# 02 — Ancestry painting

Test whether putative hybrids carry alleles of both putative parents, using
sites where the two parents are fixed for different alleles. Each hybrid is
drawn with two rows (its two alleles), coloured by the parent the allele
comes from. A first-generation (F1) hybrid is heterozygous at nearly all
sites; later-generation hybrids and backcrosses show a mix of heterozygous
and homozygous sites.

Original tutorial (section "Ancestry painting", Malinsky & Matschiner):
<https://github.com/millanek/tutorials/tree/master/analysis_of_introgression_with_snp_data>

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/count_fixed_differences.py`](scripts/count_fixed_differences.py) | Checks first if the parents have fixed differences |
| [`scripts/run_ancestry_painting.sh`](scripts/run_ancestry_painting.sh) | Runs the two Ruby scripts for several hybrid scenarios, taking the samples from a popmap |

The Ruby scripts by M. Matschiner (`get_fixed_site_gts.rb`,
`plot_fixed_site_gts.rb`) are downloaded automatically from the original
tutorial.

**Requirements:** Ruby, Python 3 (see [00_setup](../00_setup/)).

---

## 1. VCF

Ancestry painting needs many sites, so filter as little as possible:
biallelic SNPs with a missing-data filter, **without thinning** (the plot
script can thin by distance itself). The VCF must be uncompressed.

```bash
vcftools --vcf my_data.vcf --min-alleles 2 --max-alleles 2 --remove-indels \
    --max-missing 0.80 --recode --recode-INFO-all --out my_data.biallelic.miss80
```

## 2. Check that the parents have fixed differences

If the putative parents share most of their alleles, there are no
informative sites and the plots will be empty. Check this first:

```bash
# two groups of populations (regular expressions on the popmap population names)
python3 scripts/count_fixed_differences.py my_data.biallelic.miss80.recode.vcf popmap.txt \
    --p1 '^ParentA' --p2 '^ParentB'
```

Output format (the numbers are only an illustration):

```
Biallelic SNPs: <n>
SNPs with data in both groups: <n>
Max. allele-frequency difference: <0–1>
  difference >= 1.0: <n>
  difference >= 0.95: <n>
  difference >= 0.9: <n>
  difference >= 0.8: <n>
  difference >= 0.6: <n>
```

The `difference >= 1.0` line is the number of fixed differences. If it is 0
(or very low), try:

- single populations as parents instead of groups of populations;
- relaxing the fixation threshold (`PARENT_FIXEDNESS`, e.g. 0.9);
- a less filtered VCF.

Fixed differences between all pairs of populations:

```bash
python3 scripts/count_fixed_differences.py my_data.vcf popmap.txt --pairs > fixed_pairs.txt
```

> With few individuals per population (e.g. 6–9), some "fixed" differences
> are only due to sample size: an allele can be missing from a small sample
> by chance.

## 3. Run

The two Ruby scripts:

```bash
# 1. genotypes of the hybrids at sites fixed between the parents
ruby get_fixed_site_gts.rb <input.vcf> <out.fixed.txt> <parent1 IDs> <hybrid IDs> <parent2 IDs> <parent completeness> [parent fixedness]

# 2. plot
ruby plot_fixed_site_gts.rb <out.fixed.txt> <out.svg> <completeness> <min. distance in bp>
```

| Argument | Meaning |
|---|---|
| IDs | Comma-separated VCF sample names |
| parent completeness | Min. proportion of parental alleles with data (1.0 = no missing data) |
| parent fixedness | Min. frequency of the "fixed" allele in each parent (optional, default 1.0) |
| completeness (plot) | Min. completeness at a site in parents **and** hybrids |
| min. distance | Min. distance in bp between plotted SNPs |

`run_ancestry_painting.sh` runs both scripts for several hybrid scenarios
and takes the sample IDs from the popmap. Edit the settings:

```bash
VCF=my_data.biallelic.miss80.recode.vcf
POPMAP=popmap.txt
OUTDIR=results
PARENT_COMPLETENESS=0.8
PARENT_FIXEDNESS=1.0
PLOT_COMPLETENESS=0.8
MIN_DIST=100

P1_REGEX='^ParentA'                    # e.g. all populations starting with "ParentA"
P2_REGEX='^ParentB'
SCENARIOS="ALL_HYB:^Hyb HYB1:^Hyb1$ HYB2:^Hyb2$"     # name:hybrid-regex
```

```bash
bash run_ancestry_painting.sh
```

Output in `results/`: `<scenario>.fixed.txt` (genotypes at the fixed sites)
and `<scenario>.fixed.svg` (the painting), plus `ancestry_painting.out`.

> **Windows line endings.** A popmap made on Windows or in Excel has CRLF
> line endings: a hidden `\r` sticks to each sample ID, which then does not
> match the VCF (`ERROR: The vcf file ... does not include specimen ...`).
> The script removes them (`tr -d '\r'`). Check a file with
> `file popmap.txt` ("with CRLF line terminators").

## 4. Interpretation

- **Parents** are drawn in solid colours (by definition fixed).
- **F1 hybrids**: heterozygous (two colours) at nearly all sites.
- **F2 / later generations**: mix of heterozygous and homozygous sites of
  both parents.
- **Backcrosses**: mostly the colour of one parent, with some
  heterozygous sites.
- **No admixture** (not a hybrid): homozygous for one parent.

The painting is only as good as the choice of parents: if the true parents
were not sampled, or the parents are not differentiated, the method has
little power. Allele-frequency methods such as Dsuite
([03_dsuite](../03_dsuite/)) do not need fixed differences.
