# 10 — FEEMS: fast effective migration surfaces

Estimate where the gene flow is lower or higher than expected with FEEMS, a
fast successor of EEMS ([09](../09_eems/)) that chooses the smoothing of the
map by cross-validation.

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/make_feems_grid.R`](scripts/make_feems_grid.R) | Makes a grid for the study area, finer than the grids that come with FEEMS (R) |
| [`scripts/run_feems.py`](scripts/run_feems.py) | Reads the VCF and coordinates, builds the graph, runs the cross-validation, fits FEEMS and plots the migration surface (Python) |

## Install

```bash
conda create -n feems -c conda-forge -c bioconda python=3.10 feems "scikit-sparse<0.5" "tskit<1"
conda activate feems
python -c "import feems; print('ok')"
```

The two version limits avoid known errors with FEEMS:
`scikit-sparse` 0.5 gives `TypeError: 'tuple' object is not callable`, and
`tskit` 1.0 needs a newer `numpy` than FEEMS
(`ImportError: numpy._core.multiarray failed to import`).

For the grid, in R (RStudio, or the R environment of
[00_setup](../00_setup/#13-r-and-rstudio)):

```r
install.packages(c("dggridR", "sf"))
```

## Prepare the folder

```
10_feems/
├── data/      my_data-miss0.9-maf0.01-th100.recode.vcf  (from 03_filtering, without outgroup)
│              coords.txt
│              my_data.outer      (the polygon of the study area, as for EEMS)
├── scripts/   make_feems_grid.R, run_feems.py
└── results/
```

`coords.txt`: `<sample ID> <tab> <longitude> <tab> <latitude>` (see
[00_setup](../00_setup/#21-files-used-in-many-tutorials)). `my_data.outer`:
see [09_eems](../09_eems/#22-outer-the-polygon-of-the-study-area). Both
with **longitude first**: in the original analysis, the first map was wrong
because the coordinates were latitude-longitude.

---

## 1. Background

Like EEMS, FEEMS places a grid of nodes (demes) over the study area and
estimates an **effective migration** weight for each edge between nodes.
Low weights (orange) mark barriers to gene flow; high weights (blue) mark
corridors.

Differences from EEMS:

- **Fast**: it fits the model by optimisation, not MCMC (minutes instead of
  hours).
- **Smoothing (λ, lambda)**: a penalty controls how smooth the map is. Small
  λ gives a patchy map (risk of over-fitting); large λ a flat one. FEEMS
  chooses λ by **cross-validation**.
- **The grid** is read from a shapefile of triangles. The grids that come
  with FEEMS are made for continental scales.

## 2. The grid problem

FEEMS comes with three global grids:

| Grid | dggridR resolution | Distance between nodes |
|---|---|---|
| `grid_500` | 4 | ~440 km |
| `grid_250` | 5 | ~220 km |
| `grid_100` | 6 | ~110 km |

For a study area of a few hundred km, even `grid_100` places all samples on
a few nodes, and the map says nothing. **This was the problem in the
original analysis**: with `grid_100` and `grid_250`, the grid was too coarse
for the populations, and FEEMS could not be used.

The solution is to make a finer grid for the study area only. Rule of thumb
from the FEEMS authors: choose a resolution at which the individuals of the
same site fall on one node, and different sites fall on different nodes.

## 3. Make the grid

Open `scripts/make_feems_grid.R` in RStudio, change the folder in
`setwd()`, choose the resolution (`res`), and run it:

```r
res <- 8      # 6 = ~110 km between nodes, 7 = ~55 km, 8 = ~28 km, 9 = ~14 km
```

`dggetres(dggs)` prints the spacing of each resolution; `nrow(grid)` the
number of triangles. The grid is saved as `data/grid_res8.shp` (with the
`.shx`, `.dbf` and `.prj` files: copy all of them if you move the grid).

## 4. Run FEEMS

Edit the settings at the top of `run_feems.py`:

```python
vcf_file = "data/my_data-miss0.9-maf0.01-th100.recode.vcf"
coords_file = "data/coords.txt"
outer_file = "data/my_data.outer"
grid_file = "data/grid_res8.shp"
draw_map = True
```

Run it from the analysis folder:

```bash
conda activate feems
cd ~/my_project/10_feems
python scripts/run_feems.py
```

```
individuals: 51  SNPs: 16064
nodes in the grid: ...  nodes with samples: ...
lambda and CV error:
    100.0000  0.040020
     27.8256  0.039588
     ...
      0.0464  0.038146
     ...
best lambda: 0.0464
Done: results/feems_graph.pdf, results/feems_cv.pdf, results/feems_migration.pdf
```

(The numbers of individuals and SNPs are from the original analysis; the
rest is from a test dataset.)

The script:

1. reads the genotypes from the VCF and replaces the missing genotypes by
   the mean of the SNP;
2. builds the graph (the grid inside the polygon) and plots it with the
   samples: **`results/feems_graph.pdf`**. Check it first: if several
   sampling sites fall on the same node, make a finer grid (higher `res`);
3. runs the **cross-validation**: FEEMS leaves out some nodes with samples,
   fits the model on the others and predicts the left-out ones, for 10
   values of λ (from 100 to 0.001). The best λ has the lowest error:
   **`results/feems_cv.pdf`**. If the best λ is at the end of the range,
   change the range in `np.geomspace(1e-3, 1e2, 10)`;
4. fits FEEMS with the best λ and plots the migration surface:
   **`results/feems_migration.pdf`**.

> **Maps without internet.** cartopy downloads the coastlines the first
> time it draws a map. If the server has no internet, set
> `draw_map = False` (the maps will have no coastlines).

## 5. Interpretation

- Orange edges (lower migration than the mean) between groups of samples
  are candidate **barriers**; blue edges are **corridors**.
- Only interpret the map between nodes with samples. Edges far from the
  samples show the penalty, not the data.
- To see how sensitive the map is to the smoothing, change the last
  `sp_graph.fit(lamb=best_lamb, ...)` to other values (e.g. `lamb=1.0`)
  and compare.
- Compare with EEMS ([09](../09_eems/)): barriers found by both methods, and
  that agree with the clusters of [05](../05_pca_dapc/)–[07](../07_snmf_tess3/),
  are the most reliable.

## Next step

The population structure analyses are complete. For the relationships
between populations and the tests of gene flow, see
[phylogenomics](../phylogenomics/).

## More information

- FEEMS on GitHub: <https://github.com/NovembreLab/feems>
- FEEMS tutorials (notebooks):
  [getting started](https://github.com/NovembreLab/feems/blob/main/docsrc/notebooks/getting-started.ipynb)
  and [cross-validation](https://github.com/NovembreLab/feems/blob/main/docsrc/notebooks/cross-validation.ipynb)
- dggridR (grids): <https://github.com/r-barnes/dggridR>
- Making the polygon in QGIS: clip a polygon with a country shapefile and
  extract the coordinates of its vertices (*Vector → Geometry Tools →
  Extract Vertices*).

## References

- Marcus J, Ha W, Barber RF, Novembre J (2021) Fast and flexible estimation
  of effective migration surfaces. *eLife* 10: e61927.
- Barnes R, Sahr K (2017) dggridR: discrete global grids for R.
  <https://github.com/r-barnes/dggridR>
- Petkova D, Novembre J, Stephens M (2016) Visualizing spatial population
  structure with estimated effective migration surfaces. *Nature Genetics*
  48: 94–100.
