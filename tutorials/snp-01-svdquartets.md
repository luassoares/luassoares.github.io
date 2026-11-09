# 01 — SVDQuartets with PAUP\*

Infer a lineage tree (individuals as tips) or a species tree (populations as
tips) from SNP data under the multispecies coalescent, with bootstrap
support, using SVDQuartets in PAUP\*.

Original tutorial (Malinsky & Matschiner):
<https://github.com/millanek/tutorials/tree/master/species_tree_inference_with_snp_data>

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/run_SVDQuartets.sh`](scripts/run_SVDQuartets.sh) | Writes the PAUP\* batch file and runs SVDQuartets: best tree + bootstrap consensus, rooted on an outgroup |
| [`scripts/add_support_and_pops.py`](scripts/add_support_and_pops.py) | Adds bootstrap support to the trees (PAUP\* does not save it) and makes versions with population names |

**Requirements:** PAUP\*, vcftools (or bcftools), `vcf2phylip.py`, Python 3
(see [00_setup](../00_setup/)).

---

## 1. Filter the VCF

SVDQuartets assumes that every SNP has its own, independent genealogy. Keep
biallelic SNPs with little missing data, and **thin** them so that linked
SNPs are removed:

```bash
vcftools --vcf my_data.vcf \
    --min-alleles 2 --max-alleles 2 --remove-indels \
    --maf 0.01 --thin 100 --max-missing 0.80 \
    --recode --recode-INFO-all --out my_data.th100.miss80
```

| Filter | Meaning |
|---|---|
| `--min-alleles 2 --max-alleles 2` | Biallelic sites only |
| `--remove-indels` | Remove indels |
| `--maf 0.01` | Minor allele frequency ≥ 1% |
| `--thin 100` | At most one SNP per 100 bp |
| `--max-missing 0.80` | Sites genotyped in ≥ 80% of the individuals |

Run vcftools first without `--recode` to see how many sites each
combination of filters keeps.

Equivalent with bcftools (as in the original tutorial):

```bash
bcftools view -v snps -m2 -M2 -e 'AC==0 || AC==AN || F_MISSING > 0.2' my_data.vcf -o my_data.filtered.vcf
bcftools +prune -w 100bp -n 1 my_data.filtered.vcf -o my_data.th100.vcf
```

> **Remove indels and complex variants.** Variant callers such as freeBayes
> report indels and complex variants with multi-base alleles. Converted to
> an alignment, they give sequences of different lengths, and PAUP\* stops
> with an error like:
>
> ```
> Error(#308): Invalid character state 'I' for taxon 2 character 148437.
> ```
>
> (here PAUP\* read past the end of a short sequence into the next taxon
> name, `Ind_...`).

## 2. Convert the VCF to NEXUS

```bash
python vcf2phylip.py -i my_data.th100.miss80.recode.vcf -p --nexus
```

- `-p`: do not write a PHYLIP file; `--nexus`: write a NEXUS file.
- The output is written **in the folder of the VCF**, with `.min4.nexus` at
  the end (default `-m 4`: sites with data in ≥ 4 individuals).
- Heterozygous genotypes are written as IUPAC codes (R, Y, M, K, S, W);
  missing data as `N`.

### Taxon names that are only numbers

If the VCF sample names are numbers (`1023`), PAUP\* reads them as taxon
**positions** in commands such as `outgroup` (taxon number 1023), not as
names. Add a prefix to the names in the matrix:

```bash
sed -E 's/^([0-9]+)([[:space:]])/Ind_\1\2/' \
    my_data.th100.miss80.recode.min4.nexus > my_data.Ind.nexus

grep -c '^Ind_' my_data.Ind.nexus      # = number of individuals
```

Only the matrix lines start with a number, so the header is not changed.

### Check the file in PAUP\*

```
paup
execute my_data.Ind.nexus;
```

Expected: `Data matrix has <N> taxa, <M> characters` and `Processing of
input file ... completed`. Type `quit` to exit.

## 3. Run SVDQuartets

Copy `scripts/run_SVDQuartets.sh` to the folder with the NEXUS file and edit
the settings:

```bash
INPUT=my_data.Ind.nexus
PREFIX=SVDQ_my_data
NREPS=1000
NTHREADS=24
OUTDIR=results
CONDA_ENV=paup

# outgroup from the popmap...
POPMAP=../01_popmap/popmap.txt
OUTGROUP_POP=Outgroup1
ID_PREFIX="Ind_"
# ...or listed directly:
# OUTGROUP="Ind_1201 Ind_1202 Ind_1203"
```

Then:

```bash
bash run_SVDQuartets.sh
```

The script writes and runs this PAUP\* batch file:

```nexus
#NEXUS
begin paup;
  set autoclose=yes warntree=no warnreset=no increase=auto;
  log start file=results/SVDQ_my_data.log replace;
  execute my_data.Ind.nexus;

  outgroup Ind_1201 Ind_1202 Ind_1203;

  [1. best tree (fully resolved, no polytomies)]
  svdquartets evalQuartets=all ambigs=distribute nthreads=24;
  roottrees;
  savetrees file=results/SVDQ_my_data_besttree.tre format=nexus root=yes brLens=no replace;

  [2. bootstrap - majority-rule consensus]
  svdquartets evalQuartets=all ambigs=distribute bootstrap=standard nreps=1000 nthreads=24
              treeFile=results/SVDQ_my_data_bootstrap.tre replace;
  roottrees;
  savetrees file=results/SVDQ_my_data_consensus.tre format=nexus root=yes brLens=no supportValues=nodeLabels replace;

  log stop;
  quit;
end;
```

| Option | Meaning |
|---|---|
| `evalQuartets=all` | Score all possible quartets. For many taxa use `evalQuartets=random nquartets=<n>` |
| `ambigs=distribute` | Heterozygous sites (IUPAC codes) are split evenly among the possible bases, instead of being treated as missing data |
| `bootstrap=standard nreps=1000` | Bootstrap by resampling sites. `bootstrap=multilocus` resamples loci (needs a `charpartition`) |
| `nthreads` | Number of threads |
| `treeFile` | Saves the bootstrap trees |
| `roottrees` | Roots the trees on the outgroup |

**Why two analyses?** After the bootstrap, PAUP\* replaces the best tree in
memory with the bootstrap consensus. So the best tree (fully resolved, no
polytomies — useful e.g. as the guide tree for Dsuite) is saved first.

**Runtime.** With 87 tips (2,225,895 quartets) and 24 threads: best tree
≈ 10 s; 1000 bootstrap replicates ≈ 2 h (3,000 SNPs).

### Lineage tree vs species tree

Without a taxon partition, each individual is a tip (lineage tree). For a
species/population tree, add a `taxpartition` to the NEXUS file and set
`TAXPARTITION=populations` in the script:

```nexus
begin sets;
  taxpartition populations =
    PopA: Ind_1023 Ind_1024 Ind_1025,
    PopB: Ind_1101 Ind_1102,
    Outgroup1: Ind_1201 Ind_1202 Ind_1203;
end;
```

> Some converters write a SETS block with all taxa in a single population
> (`TaxPartition populations = Pop_1:1-87;`). Do not use that partition: it
> treats all individuals as one species.

## 4. Support values and population names

PAUP\* does not write the bootstrap support values to the saved consensus
tree (tested with `format=newick` and `format=nexus`). `add_support_and_pops.py`
calculates them from the bootstrap trees (% of trees that contain each
bipartition) and also writes versions with `<Population>_<ID>` tip names:

```bash
python3 add_support_and_pops.py results/SVDQ_my_data ../01_popmap/popmap.txt
```

| Output | Content |
|---|---|
| `<PREFIX>_consensus_support.tre` | Consensus + support, original tip names |
| `<PREFIX>_consensus_support_pops.tre` | Consensus + support, tips `<Population>_<ID>` |
| `<PREFIX>_besttree_support.tre` | Best tree + support, original tip names |
| `<PREFIX>_besttree_support_pops.tre` | Best tree + support, tips `<Population>_<ID>` |

Use `--id-prefix ""` if no prefix was added to the taxon names. The values
are the same as in the consensus tree drawn in the PAUP\* log.

Open the `_pops` trees in [FigTree](https://github.com/rambaut/figtree/) or
[iTOL](https://itol.embl.de/). In PAUP\*'s outgroup rooting, the ingroup is
one clade and the outgroup individuals appear at the base, possibly as more
than one group. If FigTree shows the tree unrooted, select the outgroup
branch and click **Reroot**.

## 5. Interpretation

- **Bootstrap support** is the % of bootstrap trees containing a clade.
  More replicates do not increase support; they only estimate it more
  precisely. More informative SNPs do.
- The log reports the **weight of incompatible quartets**: the higher it is,
  the more the data conflict with a single tree (incomplete lineage sorting,
  gene flow, too few SNPs).
- SVDQuartets assumes no gene flow. Admixed individuals usually do not form
  clades and are placed among their parental populations, often with low
  support.

## References

- Chifman J, Kubatko L (2014) Quartet inference from SNP data under the
  coalescent model. *Bioinformatics* 30: 3317–3324.
- Swofford DL (2003) PAUP\*. Phylogenetic Analysis Using Parsimony (\*and
  Other Methods). Version 4. Sinauer Associates.
- Ortiz EM (2019) vcf2phylip v2.0. Zenodo. <https://doi.org/10.5281/zenodo.2540861>
