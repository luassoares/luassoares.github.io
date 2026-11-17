# 05 — PCA and DAPC in RStudio

Explore the genetic structure without a population genetic model: a **PCA**
to see how the individuals are distributed, and a **DAPC** to find genetic
clusters and assign the individuals to them.

This tutorial is done **in RStudio, step by step**: some functions ask you
questions in the Console, and the answers depend on the plots you see.
Write your answers in your notes, so you can repeat the analysis.

## Install

In RStudio (once):

```r
install.packages(c("vcfR", "adegenet", "dartR", "directlabels", "plotly", "htmlwidgets"))
```

`dartR` makes the PCA and the plots; `directlabels` is needed by its plot
function, and `plotly`/`htmlwidgets` by the interactive and 3D plots.

> **dartR or dartR.base?** The `dartR` package is no longer developed: its
> functions continue in `dartR.base` (part of the dartRverse), with the
> same names (`gl.pcoa`, `gl.pcoa.plot`). If `install.packages("dartR")`
> fails, use `install.packages("dartR.base")` and `library(dartR.base)`
> instead.

## Prepare the folder

```
05_pca_dapc/
├── data/        my_data-miss0.9-maf0.01-th100.recode.vcf  (from 03_filtering, without outgroup)
│                popmap.txt
└── results/     plots and tables
```

If the VCF is on a server, copy it to your computer (e.g. with FileZilla or
`scp`).

---

## 1. Background

- **PCA** (principal component analysis) summarises the genotypes in a few
  axes (principal components, PCs) that explain most of the variation. It
  does not use the population labels: the groups you see are in the data.
- **DAPC** (discriminant analysis of principal components) has two steps:
  1. `find.clusters` groups the individuals into K clusters (k-means on the
     PCs), without using the population labels;
  2. `dapc` builds discriminant functions that best **separate** these
     clusters, and gives each individual a probability of belonging to each
     cluster.

PCA shows the overall variation; DAPC maximises the differences between
groups. Always look at the PCA first.

> **Use the VCF without the outgroup.** An outgroup is so different from
> the other samples that it takes the first PC, and the structure within
> your species becomes hard to see.

## 2. Read the data

Open RStudio, create a new script (File → New File → R Script), and run each
block with Ctrl+Enter (Cmd+Enter on Mac).

```r
setwd("~/my_project/05_pca_dapc")      # change to your folder
library(vcfR)
library(dartR)

# read the VCF and convert it to a genlight object (the format of adegenet and dartR)
my_data <- read.vcfR("data/my_data-miss0.9-maf0.01-th100.recode.vcf")
my_data_gl <- vcfR2genlight(my_data)

# add the population of each individual, from the popmap
popmap <- read.table("data/popmap.txt", header = FALSE, col.names = c("POP", "ID"))
popmap <- popmap[match(indNames(my_data_gl), popmap$ID), ]   # same order as the VCF
my_data_gl$other$ind.metrics <- popmap
pop(my_data_gl) <- my_data_gl$other$ind.metrics$POP

my_data_gl                 # summary: number of individuals, SNPs and populations
table(pop(my_data_gl))     # individuals per population
```

The `match()` line puts the popmap in the same order as the samples of the
VCF. Without it, the populations are given by the order of the lines, and
if the two files are not in the same order, individuals get the wrong
population without any error. If `table(pop(my_data_gl))` shows `NA`, some
sample IDs of the VCF are not in the popmap (check the names, and Windows
line endings, see [00_setup](../00_setup/#21-files-used-in-many-tutorials)).

## 3. PCA

```r
pca1 <- gl.pcoa(my_data_gl)
```

`gl.pcoa` runs the PCA and shows a diagnostic plot with the **percentage of
the variation explained by each axis**. With many SNPs and closely related
populations, the first axis often explains only a few % of the variation:
this is normal.

### 3.1 Plot

```r
gl.pcoa.plot(pca1, my_data_gl, pop.labels = "pop", xaxis = 1, yaxis = 2)
gl.pcoa.plot(pca1, my_data_gl, pop.labels = "pop", xaxis = 2, yaxis = 3)
```

The first plot shows PCA axis 1 × axis 2, with the individuals colored and
labelled by population; the second, axis 2 × axis 3. The third axis can
separate groups that overlap on the first two (in the original analysis,
axis 3 separated two species that overlapped on axes 1 and 2).

Save the plots with **Export → Save as Image / Save as PDF** in the Plots
panel.

### 3.2 Interactive plot

```r
gl.pcoa.plot(pca1, my_data_gl, interactive = TRUE, xaxis = 1, yaxis = 2)
```

The plot opens in the **Viewer** panel. Move the mouse over a point to see
the name of the individual and its population: this is the easiest way to
identify individuals that are far from their population. Click a population
in the legend to hide or show it.

### 3.3 3D plot

```r
gl.pcoa.plot(pca1, my_data_gl, xaxis = 1, yaxis = 2, zaxis = 3)
```

Adding `zaxis` makes an interactive **3D plot** of the first three axes:
turn it with the mouse to see how the groups separate in three dimensions.

To keep the interactive and 3D plots, use **Export → Save as Web Page** in
the Viewer panel, or:

```r
pca_3d <- gl.pcoa.plot(pca1, my_data_gl, xaxis = 1, yaxis = 2, zaxis = 3)
htmlwidgets::saveWidget(pca_3d, "results/PCA_3D.html")
```

The `.html` file opens in any web browser, and can be shared with
colleagues.

> **Check:** an individual far from its population may be a mislabelled
> sample, a hybrid, or a sample with much missing data. Check its missing
> data ([03_filtering](../03_filtering/#4-filter)) before interpreting it.

## 4. DAPC step 1: find the clusters

```r
grp <- find.clusters(my_data_gl, max.n.clust = 15)
```

`max.n.clust` is the largest number of clusters tested. Set it a bit higher
than the number of groups you expect.

### Question 1: number of PCs

R shows a plot of the **cumulative variance** explained by the PCs and asks:

```
Choose the number PCs to retain (>= 1):
```

At this step, **keep all the PCs**: type a number equal to or larger than
the number of individuals (e.g. `150` for 135 individuals). The DAPC
tutorial also keeps all PCs at this step: no information is lost.

### Question 2: number of clusters (K)

R shows the **BIC** for each K and asks:

```
Choose the number of clusters (>=2):
```

How to choose:

- The best K has the **lowest BIC**. Often the BIC decreases and then
  increases again: choose the K at the minimum.
- If the BIC keeps decreasing slowly, choose the K at the **elbow** of the
  curve, where it stops decreasing strongly. A large K splits populations
  into small clusters with no biological meaning.
- If there is no clear elbow, try two or three values of K and compare the
  results. As the DAPC tutorial says, the question is "how many clusters
  are useful to describe the data?", not the "true" K.

Then see how the populations fall into the clusters:

```r
table(pop(my_data_gl), grp$grp)
table.value(table(pop(my_data_gl), grp$grp), col.lab = paste("cluster", 1:length(levels(grp$grp))))
```

Rows are populations, columns are clusters: does each population fall into
one cluster? Are some merged, or split into several clusters?

## 5. DAPC step 2: describe the clusters

### 5.1 How many PCs? (a-score)

The DAPC uses some PCs to build the discriminant functions. **With too many
PCs, the DAPC over-fits**: it separates any groups perfectly, even random
ones, and the membership probabilities become unreliable. The **a-score**
helps to choose: it compares the success of the assignment with the success
for random groups.

Run a first DAPC with many PCs, answering the questions with all PCs and
all discriminant functions:

```r
dapc_test <- dapc(my_data_gl, grp$grp)
```

```
Choose the number PCs to retain (>=1):          <- type the number of individuals, e.g. 135
Choose the number discriminant functions to retain (>=1):   <- type K - 1
```

Then:

```r
a <- optim.a.score(dapc_test)
a$best
```

The plot shows the a-score for different numbers of PCs; the red line is
the best value (`a$best`). In the original analysis: K = 8 and 12 PCs.

### 5.2 Final DAPC

Run the DAPC again:

```r
dapc1 <- dapc(my_data_gl, grp$grp)
```

```
Choose the number PCs to retain (>=1):          <- the a-score value, e.g. 12
Choose the number discriminant functions to retain (>=1):   <- K - 1 (all), e.g. 7
```

With few clusters, keep all the discriminant functions (K − 1). With many
clusters (tens), keep the first few.

To repeat the analysis without the questions, give the answers as
arguments:

```r
grp   <- find.clusters(my_data_gl, max.n.clust = 15, n.pca = 150, n.clust = 8)
dapc1 <- dapc(my_data_gl, grp$grp, n.pca = 12, n.da = 7)
```

`find.clusters` starts from random positions, so the cluster numbers can
change between runs. Run `set.seed(123)` before it to always get the same
result.

## 6. DAPC plots

**Scatter plot** of the individuals on the first two discriminant
functions, with the clusters as ellipses:

```r
scatter(dapc1, posi.da = "bottomright", bg = "white", pch = 20, cstar = 0,
        col = funky(8), scree.pca = TRUE, posi.pca = "bottomleft",
        leg = TRUE, txt.leg = paste("Cluster", 1:8))
```

The small inset plots show the eigenvalues of the discriminant functions and
the PCs used.

**Membership probabilities** (a STRUCTURE-like bar plot):

```r
compoplot(dapc1, posi = "bottomright", txt.leg = paste("Cluster", 1:8),
          lab = "", ncol = 1, col = funky(8), show.lab = FALSE)
```

**Table** with the cluster and membership probabilities of each individual:

```r
memb <- data.frame(individual = indNames(my_data_gl), population = pop(my_data_gl),
                   cluster = dapc1$assign, round(dapc1$posterior, 3))
write.csv(memb, "results/DAPC_K8_membership.csv", row.names = FALSE)
```

## 7. Interpretation

- **Population × cluster table.** Compare the clusters with the taxonomy
  and the geography.
- **Membership probabilities** are usually close to 0 or 1. An individual
  with intermediate probabilities (e.g. 0.6/0.4) is genetically
  intermediate, but **DAPC is not a test for hybrids**: use STRUCTURE
  ([06](../06_structure/)) and the introgression tutorials
  ([phylogenomics](../phylogenomics/)).
- **Robustness.** Run the analysis with VCFs filtered for different amounts
  of missing data ([03](../03_filtering/)). Clusters that remain are
  robust.

## Next step

Model-based clustering: [06_structure](../06_structure/).

## More information

- **DAPC tutorial** by Thibaut Jombart (detailed explanation of each step,
  the a-score, cross-validation with `xvalDapc`, and how to customise the
  plots): <https://adegenet.r-forge.r-project.org/files/tutorial-dapc.pdf>
- adegenet tutorials: <https://adegenet.r-forge.r-project.org/>
- dartR tutorials and documentation: <https://green-striped-gecko.github.io/dartR/>
- Introduction to population structure in R (DAPC and sNMF, with maps):
  <https://connor-french.github.io/intro-pop-structure-r/>

## References

- Jombart T, Devillard S, Balloux F (2010) Discriminant analysis of
  principal components: a new method for the analysis of genetically
  structured populations. *BMC Genetics* 11: 94.
- Jombart T, Ahmed I (2011) adegenet 1.3-1: new tools for the analysis of
  genome-wide SNP data. *Bioinformatics* 27: 3070–3071.
- Gruber B, Unmack PJ, Berry OF, Georges A (2018) dartR: an R package to
  facilitate analysis of SNP data generated from reduced representation
  genome sequencing. *Molecular Ecology Resources* 18: 691–699.
- Mijangos JL, Gruber B, Berry O, Pacioni C, Georges A (2022) dartR v2: an
  accessible genetic analysis platform for conservation, ecology and
  agriculture. *Methods in Ecology and Evolution* 13: 2150–2158.
- Knaus BJ, Grünwald NJ (2017) vcfR: a package to manipulate and visualize
  variant call format data in R. *Molecular Ecology Resources* 17: 44–53.
- Miller JM, Cullingham CI, Peery RM (2020) The influence of a priori
  grouping on inference of genetic clusters: simulation study and
  literature review of the DAPC method. *Heredity* 125: 269–280.
