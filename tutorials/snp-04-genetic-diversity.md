# 04 — Genetic diversity and differentiation (Stacks `populations`)

Calculate nucleotide diversity (π), heterozygosity, inbreeding coefficient
(F<sub>IS</sub>), private alleles and pairwise F<sub>ST</sub> for each
population, from a VCF.

## Install

```bash
conda create -n stacks stacks
conda activate stacks
populations --version
```

## Prepare the folder

```bash
mkdir -p ~/my_project/04_genetic_diversity/{data,results}
cd ~/my_project/04_genetic_diversity
ln -s ../../03_filtering/results/my_data-miss0.9-maf0.01-th100.recode.vcf data/
cp ../03_filtering/data/popmap.txt data/
```

Use the filtered VCF **without the outgroup** ([03_filtering](../03_filtering/)).

---

## 1. Background

| Statistic | Meaning |
|---|---|
| **π** (nucleotide diversity) | Average number of differences between two copies of a locus in the population |
| **H<sub>o</sub> / H<sub>e</sub>** | Observed / expected heterozygosity |
| **F<sub>IS</sub>** | Inbreeding coefficient: > 0 fewer heterozygotes than expected (inbreeding, selfing, hidden structure); < 0 more heterozygotes than expected |
| **Private alleles** | Alleles found only in that population |
| **F<sub>ST</sub>** | Differentiation between two populations: 0 = same allele frequencies, 1 = fixed for different alleles |

## 2. Popmap for Stacks

> **Careful:** the Stacks popmap has the columns in the **opposite order**
> to the popmap of the other tutorials: `<sample ID> <tab> <population>`.

Convert the popmap of this repository (`<population> <tab> <sample ID>`):

```bash
awk -v OFS='\t' '{print $2, $1}' data/popmap.txt > data/popmap_stacks.txt
head -3 data/popmap_stacks.txt
```

```
1023	PopA
1024	PopA
1101	PopB
```

All samples in the popmap must be in the VCF. Samples in the VCF that are
not in the popmap are ignored.

## 3. Run `populations`

```bash
mkdir -p results/populations
populations -V data/my_data-miss0.9-maf0.01-th100.recode.vcf \
    -M data/popmap_stacks.txt -O results/populations/ --fstats -t 8
```

- `-V`: VCF input (instead of a Stacks catalog).
- `-M`: popmap; `-O`: output folder (it must exist).
- `--fstats`: pairwise F<sub>ST</sub> and Φ<sub>ST</sub> between all
  populations.
- `-t`: number of threads.

Screen output (example):

```
Found 8120 SNP records in file 'data/my_data-miss0.9-maf0.01-th100.recode.vcf'.
Kept 8120 loci, composed of 8120 sites; 0 of those sites were filtered, 8120 variant sites remained.

Population summary statistics (more detail in populations.sumstats_summary.tsv):
  PopA: 9.2684 samples per locus; pi: 0.10695; all/variant/polymorphic sites: 8119/8119/2830; private alleles: 331
  PopB: 22.756 samples per locus; pi: 0.16731; all/variant/polymorphic sites: 8120/8120/4435; private alleles: 495
  ...
Population pair divergence statistics (more in populations.fst_summary.tsv and populations.phistats_summary.tsv):
  PopA-PopB: mean Fst: 0.1788; mean Phi_st: 0.25613; mean Fst': 0.17077; mean Dxy: -nan
```

`Dxy: -nan` is normal with a VCF input: D<sub>XY</sub> needs the invariant
sites, which are not in the VCF.

## 4. Output files

| File | Content |
|---|---|
| `populations.sumstats_summary.tsv` | One line per population: private alleles, number of individuals, P, H<sub>o</sub>, H<sub>e</sub>, π, F<sub>IS</sub> (mean and standard error). The first table is for variant sites only; the second for all sites |
| `populations.fst_summary.tsv` | Matrix of mean pairwise F<sub>ST</sub> |
| `populations.phistats_summary.tsv` | Matrix of pairwise Φ<sub>ST</sub> (AMOVA-based) |
| `populations.sumstats.tsv` | Per-SNP statistics for each population |

The diversity table of a paper usually has, per population: N, private
alleles, H<sub>o</sub>, H<sub>e</sub>, π and F<sub>IS</sub>, together with
the coordinates and voucher of each population.

## 5. Interpretation and pitfalls

- **Compare populations only within the same dataset.** With a VCF of SNPs
  only (no invariant sites), π is calculated over variable sites. Its value
  depends on the filtering and is not comparable with π from other studies.
  Use it to compare populations within your dataset.
- **Sample size.** Populations with 2–3 individuals have unreliable
  estimates, especially private alleles and F<sub>IS</sub>. Note N in the
  table, and consider merging nearby sites into one population.
- **Private alleles grow with N.** A population with many more individuals
  will have more private alleles only because more alleles were sampled.
- **Run with the same samples as the other analyses.** If you remove
  individuals (e.g. duplicates), remove them from the popmap too.

## 6. Optional: AMOVA

AMOVA partitions the genetic variation into levels (among groups, among
populations within groups, within populations). In the example data it was
run in Arlequin with groups defined from the PCA. Example result:

```
 Source of variation                        Percentage of variation
 Among groups                                 21.03
 Among populations within groups               5.87
 Among individuals within populations        -10.48
 Within individuals                           83.58
 Fixation indices   FCT: 0.21032   FSC: 0.07439   FIS: -0.14345
```

A **negative variance component** (here among individuals within
populations) means that there is no variation at that level; it is
interpreted as zero. Here it agrees with the negative F<sub>IS</sub>: there
are slightly more heterozygotes than expected, so individuals within a
population are not more similar to each other than random pairs.

## Next step

Explore the structure of the populations: [05_pca_dapc](../05_pca_dapc/).

## More information

- Stacks `populations` manual (all options and output files):
  <https://catchenlab.life.illinois.edu/stacks/comp/populations.php>
- Arlequin (AMOVA): <http://cmpg.unibe.ch/software/arlequin35/>

## References

- Rochette NC, Rivera-Colón AG, Catchen JM (2019) Stacks 2: Analytical
  methods for paired-end sequencing improve RADseq-based population
  genomics. *Molecular Ecology* 28: 4737–4754.
- Excoffier L, Lischer HEL (2010) Arlequin suite ver 3.5: a new series of
  programs to perform population genetics analyses under Linux and Windows.
  *Molecular Ecology Resources* 10: 564–567.
- Excoffier L, Smouse PE, Quattro JM (1992) Analysis of molecular variance
  inferred from metric distances among DNA haplotypes. *Genetics* 131:
  479–491.
