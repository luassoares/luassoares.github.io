# 03 — Filtering the VCF

Select the samples and keep good-quality, biallelic SNPs. The filtered VCF
is the input of all the following tutorials.

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/filter_vcf.sh`](scripts/filter_vcf.sh) | Keeps the selected samples, removes monomorphic sites, filters the SNPs and counts them |
| [`scripts/pcadapt_outliers.R`](scripts/pcadapt_outliers.R) | Optional: finds outlier SNPs with pcadapt ([section 5](#5-optional-outlier-snps-with-pcadapt)) |

## Install

```bash
conda create -n popgen vcftools bcftools
conda activate popgen
```

For the optional pcadapt section, in R (RStudio):

```r
install.packages(c("pcadapt", "vcfR"))
```

---

## 1. Which VCF for which analysis?

Each analysis needs slightly different data, so you will usually make more
than one VCF from the same raw file:

| VCF | Filters | Used in |
|---|---|---|
| **Thinned, without outgroup** | biallelic, missing, MAF, `--thin` | diversity, PCA, DAPC, STRUCTURE, sNMF, conStruct, EEMS, FEEMS |
| **Thinned, with outgroup** | the same, plus the outgroup samples | phylogenetic trees ([phylogenomics](../phylogenomics/)) |
| **Not thinned, with outgroup** | biallelic, missing, low MAF | D statistics and ancestry painting ([phylogenomics](../phylogenomics/)) |

An outgroup is very different from the other samples: in a PCA or STRUCTURE
analysis it takes the first axis or cluster, and the structure within your
species becomes hard to see. Use it only for the phylogenetic analyses.

## 2. Why these filters

- **Biallelic SNPs only** (`--min-alleles 2 --max-alleles 2
  --remove-indels`): most methods assume two alleles per site.
- **Missing data** (`--max-missing 0.9`: a site must be genotyped in at
  least 90% of the samples): much missing data adds noise and can create
  false groups of individuals that share missing genotypes. If your dataset
  has a lot of missing data and a strict threshold leaves very few SNPs, use
  a less strict one (e.g. `--max-missing 0.8`).
- **Minor allele frequency** (`--maf 0.01`): removes very rare alleles,
  which are often sequencing errors and carry little information about
  structure. Adjust it to the number of samples: with many samples, a low
  value such as 0.01 removes only the singletons (alleles seen once) and
  keeps the real rare variation. With few samples, 0.01 removes nothing; use
  e.g. 0.03–0.05.
- **Thinning** (`--thin 100`: at most one SNP every 100 bp): in RAD-seq and
  DArT data, the SNPs on the same read are linked. Most structure and tree
  methods assume independent SNPs, so keep one SNP per locus (per read).

## 3. Select the samples

Prepare the folder (see [00_setup](../00_setup/#2-organize-the-project)):

```bash
mkdir -p ~/my_project/03_filtering/{data,scripts,results}
cd ~/my_project/03_filtering
ln -s ../../02_snp_calling/results/my_data.vcf data/
```

See the sample IDs in the VCF:

```bash
bcftools query -l data/my_data.vcf | head
```

```
1023
1024
1101
```

Make a list of the samples to keep (`data/samples_keep.txt`), one ID per
line, exactly as in the VCF. For example, from the popmap, without the
outgroup:

```bash
grep -v "Outgroup" data/popmap.txt | cut -f2 > data/samples_keep.txt
```

**Replicates and duplicates.** If an individual was sequenced twice, keep
only the replicate with less missing data. Compare them with:

```bash
vcftools --vcf data/my_data.vcf --missing-indv --out results/my_data
sort -k5,5g results/my_data.imiss | head     # 5th column: proportion of missing genotypes
```

> **Monomorphic sites.** After removing samples, some sites have only one
> allele left. `filter_vcf.sh` removes them with
> `bcftools view -e 'AC==0 || AC==AN'`. If you remove more samples later
> from a filtered VCF, run this command again.

## 4. Filter

Edit the settings at the top of `filter_vcf.sh`:

```bash
INPUT=data/my_data.vcf
SAMPLES=data/samples_keep.txt
PREFIX=my_data
MISSING=0.9
MAF=0.01
THIN=100
```

Run it:

```bash
conda activate popgen
bash scripts/filter_vcf.sh
```

```
Samples:              135
Variants before:      1270433
SNPs after filtering: 13936
```

(Example from the original analysis: 135 samples, from 1.27 million
variants to about 14,000 SNPs.)

The filtered VCF is
`results/my_data-miss0.9-maf0.01-th100.recode.vcf`. The vcftools log
(`.log`) shows how many sites each filter kept.

**Which missing-data threshold?** Stricter filters give fewer SNPs but less
missing data. Run the script two or three times with different `MISSING`
values (e.g. 0.8, 0.9, 0.95) and run the main analysis (e.g. the PCA,
[05](../05_pca_dapc/)) with each VCF. If the results are the same, the
filtering does not drive them. `--max-missing 0.9` is a common choice for
RAD-seq.

**Missing data per individual.** Individuals with much more missing data
than the others can appear as separate groups in PCA and STRUCTURE. Check
them in the filtered file:

```bash
vcftools --vcf results/my_data-miss0.9-maf0.01-th100.recode.vcf --missing-indv --out results/my_data-miss0.9
sort -k5,5gr results/my_data-miss0.9.imiss | head
```

If some individuals have much more missing data (e.g. > 50%), remove them
from `samples_keep.txt` and filter again.

## 5. Optional: outlier SNPs with pcadapt

> **We no longer remove pcadapt outliers before the structure and
> phylogenetic analyses.** pcadapt flags SNPs that are strongly associated
> with the main axes of the PCA, that is, with the population structure
> itself. Many of them are not under selection: they are simply the SNPs
> that differ most between groups. Removing them removes part of the signal
> we want to study. Use the filtered VCF of section 4 in the other
> tutorials.
>
> pcadapt is still useful to **find candidate SNPs** under selection, or to
> check whether the results change without them.

Open `scripts/pcadapt_outliers.R` in RStudio and run it line by line:

1. **Scree plot** (`option = "screeplot"`): proportion of variance explained
   by each PC. Choose **K = the number of PCs before the curve becomes
   flat**.
2. **Score plots** (`option = "scores"`): if PC3, PC4... still separate
   groups of individuals, include them in K.
3. **Outliers**: SNPs with Bonferroni-corrected p-value < 0.05. Check the
   histogram of p-values: it should be mostly flat, with a peak near 0.
4. The positions of the outliers are written to
   `results/pcadapt_outliers.txt`.

To make a VCF without the outliers:

```bash
vcftools --vcf results/my_data-miss0.9-maf0.01-th100.recode.vcf \
    --exclude-positions results/pcadapt_outliers.txt \
    --recode --recode-INFO-all --out results/my_data-miss0.9-maf0.01-th100.no-outliers
```

## 6. Before moving on

Keep a table with the filters, and the number of samples and SNPs of each
VCF, for the methods section of your paper.

## Next step

[04_genetic_diversity](../04_genetic_diversity/) and the structure
analyses ([05](../05_pca_dapc/)–[10](../10_feems/)).

## More information

- vcftools manual: <https://vcftools.sourceforge.net/man_latest.html>
- bcftools manual: <https://samtools.github.io/bcftools/bcftools.html>
- pcadapt vignette: <https://bcm-uga.github.io/pcadapt/articles/pcadapt.html>

## References

- Danecek P, Auton A, Abecasis G, et al. (2011) The variant call format and
  VCFtools. *Bioinformatics* 27: 2156–2158.
- Danecek P, Bonfield JK, Liddle J, et al. (2021) Twelve years of SAMtools
  and BCFtools. *GigaScience* 10: giab008.
- Privé F, Luu K, Vilhjálmsson BJ, Blum MGB (2020) Performing highly
  efficient genome scans for local adaptation with R package pcadapt version
  4. *Molecular Biology and Evolution* 37: 2153–2154.
