# 03 — Dsuite: D statistics, f4-ratio and f-branch

Test for gene flow (introgression) between populations or individuals with
ABBA-BABA statistics, using Dsuite.

Original tutorial (section "Dsuite", Malinsky & Matschiner):
<https://github.com/millanek/tutorials/tree/master/analysis_of_introgression_with_snp_data>
Dsuite: <https://github.com/millanek/Dsuite>

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/make_dsuite_inputs.py`](scripts/make_dsuite_inputs.py) | Makes the SETS file and the guide tree from a popmap and an SVDQuartets tree |
| [`scripts/summarize_dsuite.py`](scripts/summarize_dsuite.py) | Multiple-testing correction and summary of the significant trios |

**Requirements:** Dsuite, Python 3 (see [00_setup](../00_setup/)). A guide
tree, e.g. from [01_svdquartets](../01_svdquartets/).

---

## 1. Background

For three groups and an outgroup with the tree (((P1,P2),P3),O), each
biallelic SNP has an ancestral (A) and a derived (B) allele. Without gene
flow, the two discordant patterns are equally frequent:

- **ABBA**: P2 and P3 share the derived allele
- **BABA**: P1 and P3 share the derived allele

| Statistic | Meaning |
|---|---|
| **D** = (ABBA − BABA) / (ABBA + BABA) | D > 0: excess allele sharing between **P2 and P3** |
| **Z-score, p-value** | From a block-jackknife: the SNPs are split into blocks (20 by default) |
| **f4-ratio** | Estimate of the admixture proportion |
| **f-branch** | Summary of the f4-ratios of all trios on the branches of the tree, to locate the most likely branches involved in gene flow |

## 2. VCF

Biallelic SNPs with a missing-data filter, **without thinning**: the
block-jackknife already accounts for linked SNPs, and thinning only removes
data (and power).

```bash
vcftools --vcf my_data.vcf --min-alleles 2 --max-alleles 2 --remove-indels \
    --maf 0.01 --max-missing 0.80 --recode --recode-INFO-all --out my_data.biallelic.miss80
```

- Dsuite uses only biallelic SNPs, so other sites are skipped anyway.
- `--maf 0.01` with many individuals removes only singletons, which cannot
  form ABBA or BABA patterns. Do not use a higher MAF: rare derived alleles
  carry ABBA/BABA information.
- The Malinsky tutorials do not thin the data for Dsuite.

> **Check (optional):** run Dsuite on a thinned and an unthinned VCF. If
> the same trios are significant, linkage does not drive the results.

## 3. SETS file and guide tree

**SETS file:** `<VCF sample ID> <tab> <set name>`. The outgroup must be
called `Outgroup`; `xxx` excludes a sample.

| Level | Set name | Number of trios |
|---|---|---|
| Population | population name | few (e.g. 10 populations → 120 trios) |
| Individual | `<Population>_<ID>` | many (80 individuals → 82,160 trios) |

**Guide tree** (`-t`): Newick, with exactly the set names as tips and one
`Outgroup` tip. It is used to orient the trios (`_tree.txt` output) and for
f-branch.

`make_dsuite_inputs.py` makes both from the popmap and an SVDQuartets tree
(individuals as tips, rooted on the outgroup; use the **best tree**, which is
fully resolved):

```bash
python3 scripts/make_dsuite_inputs.py --popmap popmap.txt --outgroup-pop Outgroup1 \
    --tree ../02_SVDQuartets/results/SVDQ_my_data_besttree_support.tre \
    --out my_SETS
```

→ `my_SETS.txt` and `my_SETS_tree.nwk`. The script removes the support
values, renames the tips `<id-prefix><ID>` → `<Population>_<ID>`, replaces
the outgroup individuals by one `Outgroup` tip, and checks that the tree and
SETS names match.

For a population-level SETS file (the population tree must be made
separately, e.g. SVDQuartets with a `taxpartition`):

```bash
python3 scripts/make_dsuite_inputs.py --popmap popmap.txt --outgroup-pop Outgroup1 \
    --level population --out my_SETS_pops
```

## 4. Run Dtrios

```bash
Dsuite Dtrios -c -t my_SETS_tree.nwk my_data.biallelic.miss80.recode.vcf my_SETS.txt
```

- `-c`: the whole dataset in one run (no intermediate files for
  `DtriosCombine`).
- `-t`: guide tree.
- `-o <prefix>`: output prefix (default: the SETS file name).
- `-k <n>`: number of jackknife blocks (default 20).

Screen output (example):

```
There are 80 sets (populations/species) excluding the Outgroup
Going to calculate D and f4-ratio values for 82160 trios
The VCF contains 12140 variants
Going to use block size of 606 variants to get 20 Jackknife blocks
```

Check that each block has many SNPs from many independent loci; with few
SNPs, use fewer blocks (`-k`).

Output files — the same trios, oriented in three ways:

| File | P1–P2 pair = |
|---|---|
| `<prefix>_BBAA.txt` | the pair sharing most derived alleles (BBAA pattern) |
| `<prefix>_Dmin.txt` | the orientation giving the lowest D (most conservative) |
| `<prefix>_tree.txt` | sister pair in the guide tree |

Columns: `P1 P2 P3 Dstatistic Z-score p-value f4-ratio BBAA ABBA BABA`.

## 5. f-branch

```bash
Dsuite Fbranch my_SETS_tree.nwk my_SETS_tree.txt > my_Fbranch.txt
python3 ~/programs/Dsuite/utils/dtools.py my_Fbranch.txt my_SETS_tree.nwk

# larger labels and another output name
python3 ~/programs/Dsuite/utils/dtools.py my_Fbranch.txt my_SETS_tree.nwk \
    --tree-label-size 24 -n my_Fbranch_big
```

`dtools.py` writes a PNG and an SVG (`fbranch.png/.svg` by default). With
recent Python versions it prints several `SyntaxWarning: invalid escape
sequence` messages: they can be ignored.

Read the plot as: the value in row *b* (a branch of the tree, left) and
column *C* (a tip, top) is the excess allele sharing between branch *b* and
*C*. Grey cells are comparisons that are not possible in the tree.

## 6. Multiple testing

With many sets the number of trios is large, so the p-values must be
corrected:

```bash
python3 scripts/summarize_dsuite.py my_SETS
```

For each of `_tree`, `_BBAA` and `_Dmin`, the script:

- applies Benjamini-Hochberg (BH) and Bonferroni corrections;
- counts the significant trios (BH q < 0.05) by the populations of P2 and
  P3 (for individual sets named `<Population>_<ID>`);
- lists the top trios;
- writes `<prefix>_<kind>_BH.txt` with a `q_BH` column.

## 7. Interpretation

- **Compare the three orientations.** A signal significant with the tree
  orientation but not with BBAA or Dmin may come from a wrong or weakly
  supported guide tree (incomplete lineage sorting), not from gene flow.
  Signals that remain in `_Dmin` are the most robust.
- **Individual level:** each trio has few informative sites (ABBA + BABA),
  and structure within populations also produces significant trios (P2 and
  P3 from the same population). Use it to find which individuals carry the
  signal; confirm at the population level.
- **f-branch** values on weakly supported branches should be interpreted
  with caution.
- To see where in the genome the signal is, use `Dsuite Dinvestigate` with
  the trios of interest (sliding windows).

## References

- Malinsky M, Matschiner M, Svardal H (2021) Dsuite — fast D-statistics and
  related admixture evidence from VCF files. *Molecular Ecology Resources*
  21: 584–595.
- Malinsky M, Svardal H, Tyers AM, et al. (2018) Whole-genome sequences of
  Malawi cichlids reveal multiple radiations interconnected by gene flow.
  *Nature Ecology & Evolution* 2: 1940–1955. (f-branch)
- Green RE, Krause J, Briggs AW, et al. (2010) A draft sequence of the
  Neandertal genome. *Science* 328: 710–722. (D statistic)
- Durand EY, Patterson N, Reich D, Slatkin M (2011) Testing for ancient
  admixture between closely related populations. *Molecular Biology and
  Evolution* 28: 2239–2252.
