# 07 — sNMF and TESS3: ancestry coefficients and maps

Estimate ancestry coefficients with two fast alternatives to STRUCTURE:
**sNMF** (LEA package, does not use geography) and **TESS3** (tess3r
package, uses the coordinates of the individuals), and show them on a map.

**Scripts** (run in RStudio, line by line)

| Script | What it does |
|---|---|
| [`scripts/snmf.R`](scripts/snmf.R) | Converts the VCF to the LEA format, runs sNMF, chooses K, makes the table, bar plot and map |
| [`scripts/tess3.R`](scripts/tess3.R) | The same with TESS3, using the file made by `snmf.R` |

## Install

In RStudio (once):

```r
install.packages(c("vcfR", "ggplot2", "maps", "scatterpie", "BiocManager", "remotes"))
BiocManager::install("LEA")
remotes::install_github("bcm-uga/TESS3_encho_sen")    # tess3r
```

## Prepare the folder

```
07_snmf_tess3/
├── data/      my_data-miss0.9-maf0.01-th100.recode.vcf  (from 03_filtering, without outgroup)
│              popmap.txt
│              coords.txt
├── scripts/   snmf.R, tess3.R
└── results/
```

`coords.txt`: one line per individual, `<sample ID> <tab> <longitude>
<tab> <latitude>`, decimal degrees, no header (see
[00_setup](../00_setup/#21-files-used-in-many-tutorials)).

> The scripts match the populations and coordinates to the samples **by
> ID**. In the original analysis, the coordinates file had no IDs and was
> matched by the order of the lines: if the order of the VCF changes (e.g.
> after removing a sample), all coordinates shift without any error.

---

## 1. Background

Both methods estimate the same thing as STRUCTURE ([06](../06_structure/)):
for each individual, the proportion of its genome that comes from each of K
ancestral populations (the Q matrix). They are much faster, so many values
of K and repetitions can be run in minutes.

| | sNMF | TESS3 |
|---|---|---|
| Model | Matrix factorisation; does not assume Hardy-Weinberg equilibrium | The same, plus a spatial term: nearby individuals tend to have similar ancestry |
| Uses coordinates | No | Yes |
| Choosing K | **Cross-entropy**: lowest = best | **Cross-validation score**: lowest = best |

Because it does not assume Hardy-Weinberg equilibrium, sNMF is a good
choice for inbred or selfing species. TESS3 is useful when the structure is
spatial, but, like conStruct and EEMS ([08](../08_construct/),
[09](../09_eems/)), it can only be interpreted where there are samples.

## 2. sNMF

Open `scripts/snmf.R` in RStudio, change the folder in `setwd()`, and run it
block by block.

### 2.1 Read the data and convert it

Blocks 1 and 2 read the VCF, the popmap and the coordinates, and write the
genotypes in the LEA `.geno` format: one line per SNP, one digit per
individual (0, 1, 2 copies of the alternative allele; 9 = missing). Check
that both `sum(is.na(...))` are 0: otherwise some sample IDs are missing
from the popmap or the coordinates file.

### 2.2 Run sNMF

```r
project <- snmf("results/my_data.geno", K = 1:10, repetitions = 10,
                entropy = TRUE, alpha = 100, CPU = 4, project = "new")
```

- `K = 1:10`: test K = 1 to 10 (in the original analysis, 1 to 16).
- `repetitions = 10`: 10 runs for each K.
- `entropy = TRUE`: calculates the cross-entropy, used to choose K.
- `alpha = 100`: regularisation; higher values give smoother ancestry
  coefficients and are recommended for small datasets.
- `CPU = 4`: number of processors.

The results are saved in `results/my_data.snmf/`. To open them again in a
new R session without running sNMF again:

```r
project <- load.snmfProject("results/my_data.snmfProject")
```

### 2.3 Choose K

```r
plot(project, col = "blue", pch = 19, cex = 1.2)
```

The plot shows the cross-entropy for each K. Choose **the K with the lowest
cross-entropy**, or where the curve stops decreasing (the "elbow"). As
with STRUCTURE, look at the results of two or three values of K. In the
original analysis (131 individuals) K = 9 was chosen.

### 2.4 Table, bar plot and map

Set `K <- ` to your K and run blocks 5 to 7:

| Output | Content |
|---|---|
| `results/snmf_Q_K3.csv` | Ancestry of each individual in each cluster (C1, C2, ...), its most likely cluster, population and coordinates |
| `results/snmf_barplot_K3.pdf` | Bar plot, individuals grouped by population |
| `results/snmf_map_K3.pdf` | One pie per sampling site (mean of the individuals of the site) |

The run with the lowest cross-entropy for that K is used. The table
`population × cluster` printed in the Console shows which populations fall
in each cluster.

The individuals of the same site have the same coordinates: with one pie per
individual, they would be drawn on top of each other. The script therefore
averages the individuals of each site. Change the size of the pies with
`r = 0.05` (in degrees) and the colors with `colors`.

## 3. TESS3

Open `scripts/tess3.R` and run it block by block. It uses the `.geno` file
made by `snmf.R`.

```r
tess3_obj <- tess3(X = geno, coord = coord_matrix, K = 1:10, rep = 10,
                   method = "projected.ls", ploidy = 2, openMP.core.num = 4,
                   keep = "best", mask = 0.05)
```

- `coord`: the coordinates (longitude, latitude) of each individual.
- `rep = 10`, `keep = "best"`: 10 runs for each K, keeping the best one.
- `mask = 0.05`: hides 5% of the genotypes to calculate the
  cross-validation score.

Choose K with the plot of the cross-validation score (lowest = best), set
`K <- `, and run the rest of the script: the table, bar plot and map are
written to `results/` with the prefix `tess3_`.

> **Colors.** The cluster numbers are arbitrary and differ between sNMF and
> TESS3 (and between K). To give the same color to the same group in both
> maps, change the order of `colors`, or edit the final figure.

## 4. Interpretation

- **Compare the methods.** sNMF, TESS3, STRUCTURE and DAPC
  ([05](../05_pca_dapc/), [06](../06_structure/)) usually agree on the main
  groups and differ in the details. Groups found by all methods are robust.
  In the original analysis, DAPC found 8–11 clusters and sNMF and TESS3 9.
- **TESS3 vs sNMF.** If TESS3 shows smoother transitions between nearby
  sites than sNMF, part of the structure is spatial (isolation by
  distance): test it with conStruct ([08](../08_construct/)).
- **Admixed individuals** are not necessarily hybrids (see
  [06](../06_structure/#7-interpretation)).

## Next step

Discrete groups or isolation by distance? [08_construct](../08_construct/).

## More information

- **Introduction to population structure in R** (Connor French): DAPC and
  sNMF with maps, the tutorial used in the original analysis:
  <https://connor-french.github.io/intro-pop-structure-r/>
- LEA (sNMF): <https://bioconductor.org/packages/LEA/> (the vignettes are on this page)
- tess3r tutorial: <https://rdrr.io/github/cayek/TESS3_encho_sen/f/vignettes/main-vignette.Rmd>

## References

- Frichot E, Mathieu F, Trouillon T, Bouchard G, François O (2014) Fast and
  efficient estimation of individual ancestry coefficients. *Genetics* 196:
  973–983. (sNMF)
- Frichot E, François O (2015) LEA: an R package for landscape and
  ecological association studies. *Methods in Ecology and Evolution* 6:
  925–929.
- Caye K, Deist TM, Martins H, Michel O, François O (2016) TESS3: fast
  inference of spatial population structure and genome scans for selection.
  *Molecular Ecology Resources* 16: 540–548.
