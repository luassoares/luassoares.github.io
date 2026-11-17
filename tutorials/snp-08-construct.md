# 08 — conStruct: structure and isolation by distance

Test whether the genetic differentiation is better explained by discrete
groups, by continuous isolation by distance, or by both, with conStruct.

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/run_construct.R`](scripts/run_construct.R) | Prepares the data, runs the cross-validation and the spatial runs for K = 1 to 5 (on the server: it takes hours) |
| [`scripts/plot_construct.R`](scripts/plot_construct.R) | Cross-validation plots and tests, layer contributions, admixture plots (RStudio) |

## Install

conStruct runs for hours, so run it on the server, in the R environment of
[00_setup](../00_setup/#13-r-and-rstudio):

```bash
conda activate r-popgen
R
```

```r
install.packages(c("conStruct", "vcfR", "geodist", "doParallel", "foreach"))
```

conStruct uses Stan, and the installation compiles code: it can take a
while. Install it also in RStudio on your computer for the plots.

## Prepare the folder

```
08_construct/
├── data/      my_data-miss0.9-maf0.01-th100.recode.vcf  (from 03_filtering, without outgroup)
│              coords.txt
├── scripts/   run_construct.R, plot_construct.R
└── results/
```

`coords.txt`: `<sample ID> <tab> <longitude> <tab> <latitude>`, decimal
degrees, no header, **longitude first** (see
[00_setup](../00_setup/#21-files-used-in-many-tutorials)). Individuals from
the same site have the same coordinates.

---

## 1. Background

STRUCTURE-like methods ([06](../06_structure/), [07](../07_snmf_tess3/))
assume discrete populations. When populations are distributed along a
continuous range, **isolation by distance** (IBD: nearby individuals are
more similar) can appear as several clusters with "admixed" individuals
between them, even without discrete groups.

conStruct describes each individual as a mix of **K layers**. In the
**spatial model**, the relatedness within each layer decreases with the
geographic distance; the **non-spatial model** is like STRUCTURE. Comparing
them answers two questions:

1. Does the geographic distance improve the model? (spatial vs
   non-spatial)
2. How many layers are needed? (cross-validation and layer contributions)

> **Missing data.** Individuals with much missing data make the MCMC
> unstable. In the original analysis, five individuals with much missing
> data had to be removed before the runs worked well. Check the missing data
> per individual ([03_filtering](../03_filtering/#4-filter)) and, if
> needed, make a VCF without them.

## 2. Run the cross-validation and the spatial runs

Edit `scripts/run_construct.R`: change the folder in `setwd()` and the
number of processors (`makeCluster(16, ...)` and `n.nodes = 16`). Then run
it on the server:

```bash
byobu
conda activate r-popgen
cd ~/my_project/08_construct
Rscript scripts/run_construct.R 2>&1 | tee results/run_construct.log
```

The script:

1. calculates the **allele frequency** of each individual (0, 0.5, 1) from
   the VCF, and the **geographic distances** between individuals from the
   coordinates. Alternatively, as in the original analysis, the frequencies
   can be read from the STRUCTURE file of [06](../06_structure/#2-input-files)
   with `structure2conStruct` (commented lines in the script);
2. runs the **cross-validation** (`x.validation`): in each replicate, 90%
   of the SNPs are used to fit the model and the other 10% to test how well
   it predicts them (the **predictive accuracy**), for the spatial and
   non-spatial models, K = 1 to 5, 10 replicates. This is the slow part:
   several hours with 16 processors for ~80 individuals;
3. runs the **spatial model** for K = 1 to 5 with all the data, for the
   plots.

Output in `results/`:

| File | Content |
|---|---|
| `my_data_sp_xval_results.txt`, `my_data_nsp_xval_results.txt` | Predictive accuracy of the spatial and non-spatial models (rows: K, columns: replicates) |
| `my_data_spK3_conStruct.results.Robj`, `..._data.block.Robj` | Results of the spatial run with K = 3 (one pair of files per K) |
| `my_data_spK3_trace.plots.chain_1.pdf`, ... | Plots made by each run |

> **Check the MCMC.** conStruct uses Stan. Warnings such as `divergent
> transitions`, `The largest R-hat is ...` or `Effective Samples Size (ESS)
> is too low` mean that the chain has not converged. Increase `n.iter` in
> the full runs, and check for individuals with much missing data. Look at
> the trace plots (`*trace.plots*.pdf`): they should look like
> "hairy caterpillars", with no trend.

## 3. Results (RStudio)

Copy the `results/` folder to your computer, open
`scripts/plot_construct.R` in RStudio, change the folder in `setwd()` and
run it block by block.

### 3.1 Spatial or non-spatial? How many layers?

The first plot shows the mean predictive accuracy (higher = better) for each
K, for the spatial (blue) and non-spatial (green) models; the second shows
the 95% confidence intervals of the spatial model. The t-tests compare two
values of K, or the two models, paired by replicate:

```
Paired t-test
data:  sp[2, ] and sp[1, ]
t = 33.2, df = 9, p-value = 5.025e-11
mean difference 901.9202
```

(Example from the original analysis: K = 2 is better than K = 1.)

- **Spatial better than non-spatial** (especially at low K): the geographic
  distance explains part of the differentiation (IBD). In the original
  analysis, the spatial models had clearly higher predictive accuracy.
- **Choosing K**: the predictive accuracy usually increases quickly and then
  levels off. Choose the smallest K after which adding layers gives little
  improvement. A significant t-test is not enough: with many SNPs, tiny
  improvements are significant.

> The conStruct vignette calculates the confidence interval with
> `sd(x)/length(x)`. The standard error is `sd(x)/sqrt(length(x))`, used in
> the script, so the intervals are wider than in the vignette.

### 3.2 Layer contributions

The bar plot shows, for each K, how much each layer contributes to the
total covariance. A layer that contributes very little (e.g. < 1%) is not
needed: the best K is the number of layers with a real contribution. In the
original analysis, all layers up to K = 5 had a real contribution.

### 3.3 Admixture plots

Set `K <- ` to your K and run the last block:

- `make.structure.plot`: proportion of each layer in each individual, like
  a STRUCTURE plot;
- `make.admix.pie.plot`: the same proportions as pies on the map. Change
  `radii` to change the size of the pies.

Save the plots with **Export** in the Plots panel.

## 4. Interpretation

- If the spatial model with **K = 1** is about as good as higher K, the
  structure is mostly continuous (IBD), and the clusters of STRUCTURE or
  DAPC may be artefacts of IBD.
- If several spatial layers are needed, there are discrete groups **in
  addition to** IBD.
- Compare the layers with the clusters of [05](../05_pca_dapc/)–[07](../07_snmf_tess3/),
  and with the migration barriers of EEMS ([09](../09_eems/)).

## Next step

Where are the barriers to gene flow? [09_eems](../09_eems/).

## More information

- conStruct vignettes, in R: `vignette(package = "conStruct")`, or online:
  <https://cran.r-project.org/package=conStruct> — format-data,
  run-conStruct, visualize-results, model-comparison (cross-validation and
  layer contributions, the basis of these scripts).
- conStruct on GitHub: <https://github.com/gbradburd/conStruct>

## References

- Bradburd GS, Coop GM, Ralph PL (2018) Inferring continuous and discrete
  population genetic structure across space. *Genetics* 210: 33–52.
