# 09 — EEMS: effective migration surfaces

Map where the gene flow is lower (barriers) or higher (corridors) than
expected under isolation by distance, with EEMS.

**Scripts** (RStudio)

| Script | What it does |
|---|---|
| [`scripts/vcf2diffs.R`](scripts/vcf2diffs.R) | Makes the `.diffs` and `.coord` input files from the VCF (no plink or bed2diffs needed) |
| [`scripts/plot_eems.R`](scripts/plot_eems.R) | Checks the runs and makes the migration and diversity maps |

## Install

EEMS is compiled from its source code. Create a conda environment with the
libraries it needs, and compile it there:

```bash
conda create -n eems eigen boost-cpp cxx-compiler make
conda activate eems

mkdir -p ~/programs && cd ~/programs
git clone https://github.com/dipetkov/eems.git
cd eems/runeems_snps/src
```

Open the `Makefile` (`nano Makefile`) and change the first three lines to:

```
EIGEN_INC = $(CONDA_PREFIX)/include/eigen3
BOOST_LIB = $(CONDA_PREFIX)/lib
BOOST_INC = $(CONDA_PREFIX)/include
```

Compile and test:

```bash
make linux
./runeems_snps --help        # "the option '--params' is required": it works
echo 'export PATH=$HOME/programs/eems/runeems_snps/src:$PATH' >> ~/.bashrc
source ~/.bashrc
```

For the plots, in RStudio:

```r
install.packages(c("vcfR", "ggplot2", "maps", "remotes"))
remotes::install_github("dipetkov/reemsplots2")
```

> **You do not need bed2diffs.** The EEMS documentation converts the data
> with `bed2diffs`, which needs plink files and the `libplinkio` library
> (hard to compile). `vcf2diffs.R` calculates the same matrix in R, directly
> from the VCF.

## Prepare the folder

```
09_eems/
├── data/      my_data-miss0.9-maf0.01-th100.recode.vcf  (from 03_filtering, without outgroup)
│              coords.txt
├── scripts/   vcf2diffs.R, plot_eems.R
└── results/
```

`coords.txt`: `<sample ID> <tab> <longitude> <tab> <latitude>`, decimal
degrees, no header (see
[00_setup](../00_setup/#21-files-used-in-many-tutorials)).

---

## 1. Background

EEMS places a grid of **demes** over the study area and estimates two
surfaces:

- **Effective migration (m)**: how fast the genetic similarity decreases
  between nearby places. Areas with **lower** migration than the average are
  **barriers** to gene flow (orange in the maps); areas with higher
  migration are corridors (blue).
- **Effective diversity (q)**: the expected genetic difference between two
  individuals from the **same** place (diversity within a deme).

Without barriers or corridors (only isolation by distance), the migration
surface is flat. The colors are on a log10 scale relative to the mean: 1
means 10 times more migration than the average, −1 means 10 times less.

## 2. Input files

EEMS needs three files with the same name and different extensions:

| File | Content |
|---|---|
| `my_data.diffs` | Average genetic differences between all pairs of individuals |
| `my_data.coord` | Coordinates of each individual, **longitude latitude**, in the same order as `.diffs` |
| `my_data.outer` | Polygon of the study area, **longitude latitude**, counterclockwise, first point = last point |

### 2.1 `.diffs` and `.coord`

Open `scripts/vcf2diffs.R` in RStudio, change the folder in `setwd()` and
run it line by line. It:

1. reads the genotypes of the VCF (0, 1, 2 copies of the alternative
   allele);
2. calculates the average genetic difference between each pair of
   individuals (the `bed2diffs_v2` method of the EEMS documentation, where
   missing genotypes are replaced by the mean);
3. checks that the matrix is valid (exactly **one** positive eigenvalue);
4. writes the coordinates in the same order as the VCF.

The script also has `bed2diffs_v1`, which uses for each pair of
individuals only the SNPs genotyped in both (used in the original
analysis). Both are in the EEMS documentation; if the check in step 3
fails with v1, use v2.

Write down `nIndiv` and `nSites` (number of individuals and SNPs, printed
by the script): you need them for the parameter file. In the original
analysis: 131 individuals and 13,179 SNPs.

### 2.2 `.outer`: the polygon of the study area

The polygon outlines the area where the species can occur. Draw it around
the sampling sites, with some margin, and follow natural limits (e.g. the
coast), so that EEMS does not place demes in the sea.

- Online: draw the polygon on a map with
  <https://www.birdtheme.org/useful/v3tool.html> and copy the coordinates.
- QGIS: draw a polygon, clip it with a country or coastline shapefile, and
  export its vertices.

One vertex per line, **longitude latitude**, listed **counterclockwise**,
and the last line repeats the first:

```
-57.97 -20.40
-57.79 -32.06
-44.30 -31.95
-44.13 -20.20
-57.97 -20.40
```

Save it as `data/my_data.outer`.

> **Longitude first, in all files.** Mixing the order (latitude-longitude in
> one file and longitude-latitude in another) is the most common error: the
> samples fall outside the polygon or the map appears rotated.

## 3. Parameter files

EEMS reads its settings from a parameter file. Make one for each **chain**
(independent run): running three chains with different seeds shows whether
the results are stable.

Create `data/params-chain1.ini` (e.g. with `nano`) with the **full paths**
of your folders:

```
datapath = /home/<user>/my_project/09_eems/data/my_data
mcmcpath = /home/<user>/my_project/09_eems/results/my_data-chain1
nIndiv = 131
nSites = 13179
nDemes = 300
diploid = true
numMCMCIter = 4000000
numBurnIter = 1000000
numThinIter = 9999
```

| Setting | Meaning |
|---|---|
| `datapath` | input files, without the extension (`.diffs`, `.coord`, `.outer`) |
| `mcmcpath` | output folder of this chain |
| `nIndiv`, `nSites` | numbers printed by `vcf2diffs.R` |
| `nDemes` | density of the grid (approximate number of demes); 200–500 |
| `numMCMCIter`, `numBurnIter`, `numThinIter` | length of the run, burn-in and thinning |

Copy the file to `params-chain2.ini` and `params-chain3.ini`, and change
only `mcmcpath` (`...-chain2`, `...-chain3`).

## 4. Run EEMS

```bash
byobu
conda activate eems
cd ~/my_project/09_eems
runeems_snps --params data/params-chain1.ini --seed 123 > results/chain1.log 2>&1 &
runeems_snps --params data/params-chain2.ini --seed 456 > results/chain2.log 2>&1 &
runeems_snps --params data/params-chain3.ini --seed 789 > results/chain3.log 2>&1 &
```

The `&` runs the three chains at the same time. With the settings above,
each chain takes hours. The end of each log shows the final likelihood:

```bash
tail -2 results/chain1.log
```

```
Final log prior: 64.26
Final log llike: 4678.90
```

> **Test first** with a short run (e.g. `numMCMCIter = 20000`,
> `numBurnIter = 10000`, `numThinIter = 99`) to check that the files are
> correct.

## 5. Plot the results

Copy the `results/` folder and `data/my_data.coord` to your computer, open
`scripts/plot_eems.R` in RStudio, change the folder in `setwd()` and run it
block by block.

### 5.1 Check the runs first

- **`plots$pilogl01`**: log posterior of each chain along the MCMC. The
  chains should reach the same level and stay flat. If they are still
  increasing, run longer.
- **`plots$rdist01`** and **`plots$rdist02`**: observed vs fitted
  differences between and within demes. A **strong linear relationship**
  means that the model fits the data well.
- **`plots$rdist03`**: genetic difference vs geographic distance. Under
  isolation by distance it increases linearly with distance.

### 5.2 Migration and diversity maps

The script adds the country borders and the sampling sites (circles) to the
maps, and saves them in `results/`:

- **`eems_migration.pdf`** (effective migration): orange = lower migration
  than the average (barrier); blue = higher (corridor).
- **`eems_migration_probability.pdf`**: posterior probability that the
  migration is lower or higher than the average. Only interpret areas where
  it is high (e.g. > 0.9).
- **`eems_diversity.pdf`** (effective diversity). In the original
  analysis, inland populations had higher diversity than populations at the
  edges of the range.

## 6. Interpretation

- **Only interpret areas with samples.** Far from the sampling sites the
  surface shows the prior, not the data.
- **Barriers between groups that are also separated in DAPC or STRUCTURE**
  ([05](../05_pca_dapc/)–[07](../07_snmf_tess3/)) support real limits to
  gene flow. Compare them with the landscape (rivers, valleys, changes in
  altitude or habitat).
- Compare with FEEMS ([10](../10_feems/)): barriers found by both methods
  are the most reliable.

## Next step

A faster method with cross-validation: [10_feems](../10_feems/).

## More information

- EEMS on GitHub (documentation and examples): <https://github.com/dipetkov/eems>
- Making the `.diffs` file in R (str2diffs):
  <https://github.com/dipetkov/eems/tree/master/str2diffs>
- reemsplots2 (plots in R): <https://github.com/dipetkov/reemsplots2>
- Tool to draw the polygon: <https://www.birdtheme.org/useful/v3tool.html>

## References

- Petkova D, Novembre J, Stephens M (2016) Visualizing spatial population
  structure with estimated effective migration surfaces. *Nature Genetics*
  48: 94–100.
