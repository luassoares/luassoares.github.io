# 06 — STRUCTURE and fastSTRUCTURE

Estimate the number of genetic clusters (K) and the ancestry proportions of
each individual with STRUCTURE and fastSTRUCTURE (run with
structure_threader), and plot the results with **pophelper**, on the web or
in R.

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/vcf2structure.py`](scripts/vcf2structure.py) | Converts the VCF to the STRUCTURE and fastSTRUCTURE input files, and writes the population labels (or use PGDSpider, section 2.2) |
| [`scripts/plot_structure.R`](scripts/plot_structure.R) | pophelper in RStudio: Evanno method, alignment of the runs and bar plots |

## Install

On the server:

```bash
conda create -n structure python=3.10 pip
conda activate structure
pip install structure_threader
structure_threader -h
ls $CONDA_PREFIX/bin | grep -i structure     # STRUCTURE and fastStructure come with structure_threader
```

For the plots in R (RStudio), once:

```r
install.packages("remotes")
remotes::install_github("royfrancis/pophelper")
```

## Prepare the folder

```bash
mkdir -p ~/my_project/06_structure/{data,scripts,results}
cd ~/my_project/06_structure
ln -s ../../03_filtering/results/my_data-miss0.9-maf0.01-th100.recode.vcf data/
cp ../03_filtering/data/popmap.txt data/
cp ~/genomics-tutorials/06_structure/scripts/* scripts/
```

Use the filtered VCF **without the outgroup** ([03_filtering](../03_filtering/)).

---

## 1. Background

STRUCTURE assumes that there are K ancestral populations (clusters), each
with its own allele frequencies, and estimates for each individual the
proportion of its genome that comes from each cluster (Q). It is a Bayesian
model run with MCMC, so:

- each K is run several times (**replicates**) to check that the runs agree;
- K is not estimated directly: you compare the runs for different K.

**fastSTRUCTURE** uses the same model with a much faster algorithm. It is
useful to explore many K quickly. STRUCTURE is the reference method;
running both and comparing them is a good check.

## 2. Input files

Convert the VCF with **one** of the two options below. Both make files
with the same columns, so the rest of the tutorial is the same.

### 2.1 Option A: script

```bash
conda activate structure
python3 scripts/vcf2structure.py --vcf data/my_data-miss0.9-maf0.01-th100.recode.vcf \
    --popmap data/popmap.txt --out data/my_data
```

```
Individuals (NUMINDS): 135
Loci (NUMLOCI):        13179
Populations:           13
Written: data/my_data.str, data/my_data_fast.str, data/my_data_popfile.txt, data/my_data_labels.txt
```

| File | Used by |
|---|---|
| `my_data.str` | STRUCTURE |
| `my_data_fast.str` | fastSTRUCTURE |
| `my_data_popfile.txt` | structure_threader `--pop` (population names in its plots) |
| `my_data_labels.txt` | pophelper (population labels of the bar plots) |

The individuals are ordered by population (in the order of the popmap), so
in the bar plots each population is one block. Write down `NUMINDS` and
`NUMLOCI`: you need them in the next step.

### 2.2 Option B: PGDSpider

PGDSpider converts between many formats; it was used in the original
analysis. It has a graphical version (easiest on your own computer) and a
command-line version (for the server). Download it from
<http://www.cmpg.unibe.ch/software/PGDSpider/>, or on the server:
`conda create -n pgdspider pgdspider "openjdk=8"` (PGDSpider needs Java 8).

PGDSpider needs a population file with the columns `<sample ID> <tab>
<population>` (the opposite order to our popmap):

```bash
awk -v OFS='\t' '{print $2, $1}' data/popmap.txt > data/popmap_pgdspider.txt
```

**Graphical version:**

1. *Data input file*: select the VCF; *Data input file format*: **VCF**.
2. *Data output file*: `my_data.str`; *Data output file format*:
   **STRUCTURE**.
3. Click **Create/Edit SPID file** and answer the questions:
   - *Do you want to include a file with population definitions?* **Yes**,
     and select `popmap_pgdspider.txt`;
   - *What is the ploidy of the data?* **Diploid**;
   - *Do you want to include non-polymorphic SNPs?* **No**;
   - *Specify which data type should be included*: **SNP**;
   - *Do you want to include inter-marker distances?* **No**;
   - *Save more specific fastSTRUCTURE format?* **No** for STRUCTURE.
   Leave the other questions empty. Save the SPID file, so you can use it
   again.
4. Click **Convert**.

For fastSTRUCTURE, convert again with *Save more specific fastSTRUCTURE
format?* **Yes**, to `my_data_fast.str`.

**Command line:** save the answers above in a SPID file, e.g.
`data/vcf_to_structure.spid`:

```
PARSER_FORMAT=VCF
VCF_PARSER_POP_QUESTION=true
VCF_PARSER_POP_FILE_QUESTION=/home/<user>/my_project/06_structure/data/popmap_pgdspider.txt
VCF_PARSER_PLOIDY_QUESTION=DIPLOID
VCF_PARSER_MONOMORPHIC_QUESTION=false
VCF_PARSER_PL_QUESTION=false
VCF_PARSER_EXC_MISSING_LOCI_QUESTION=true
WRITER_FORMAT=STRUCTURE
STRUCTURE_WRITER_LOCI_DISTANCE_QUESTION=false
STRUCTURE_WRITER_DATA_TYPE_QUESTION=SNP
STRUCTURE_WRITER_FAST_FORMAT_QUESTION=false
```

```bash
conda activate pgdspider
java -Xmx4g -jar $CONDA_PREFIX/share/pgdspider-*/PGDSpider2-cli.jar \
    -inputfile data/my_data-miss0.9-maf0.01-th100.recode.vcf -inputformat VCF \
    -outputfile data/my_data.str -outputformat STRUCTURE -spid data/vcf_to_structure.spid
```

(For fastSTRUCTURE, copy the SPID file with
`STRUCTURE_WRITER_FAST_FORMAT_QUESTION=true` and write `my_data_fast.str`.)

The PGDSpider file has the individuals in the order of the VCF. Count
`NUMINDS` and `NUMLOCI` for `mainparams`, and make the label file for
pophelper (population names in the same order as the file):

```bash
echo $(( $(wc -l < data/my_data.str) / 2 ))                     # NUMINDS (lines minus the header, / 2)
head -1 data/my_data.str | wc -w                                # NUMLOCI
awk 'NR==FNR {pop[$2]=$1; next} FNR==1 {print "population"} FNR>1 && FNR%2==0 {print pop[$1]}' \
    data/popmap.txt data/my_data.str > data/my_data_labels.txt
```

structure_threader can also show population names in its plots with
`--pop`; with PGDSpider files you can leave this option out.

> If a file was made on Windows, convert it with `dos2unix` before running
> STRUCTURE.

## 3. STRUCTURE

### 3.1 Parameter files

Create `mainparams` and `extraparams` **in the `data/` folder, next to the
input file**: STRUCTURE looks for them in the folder of the input file.

```bash
cd data
structure_threader params -o .
```

Open `mainparams` (e.g. with `nano mainparams`) and change these lines:

```
#define BURNIN    125000   // (int) length of burnin period
#define NUMREPS   500000   // (int) number of MCMC reps after burnin

#define NUMINDS    135     // number of individuals (printed by vcf2structure.py)
#define NUMLOCI    13179   // number of loci (printed by vcf2structure.py)
```

The other settings are already correct for the files made by
`vcf2structure.py`:

```
#define PLOIDY       2
#define MISSING     -9
#define ONEROWPERIND 0     // two rows per individual
#define LABEL        1     // first column: individual ID
#define POPDATA      1     // second column: population number
#define EXTRACOLS    0
#define MARKERNAMES  1     // first row: marker names
```

`MAXPOPS`, `INFILE` and `OUTFILE` are set by structure_threader. Leave
`extraparams` with the default values (admixture model, correlated allele
frequencies). The population column is only read; it is not used in the
analysis.

> **Burn-in and run length.** 125,000 burn-in and 500,000 MCMC steps were
> used in the original analysis. To test that everything works, run first
> with short values (e.g. 1,000 / 2,000).

### 3.2 Run

From the `data/` folder:

```bash
byobu
conda activate structure
cd ~/my_project/06_structure/data
structure_threader run -K 10 -R 10 -i my_data.str -o ../results/structure_out \
    -t 20 -st $CONDA_PREFIX/bin/structure --pop my_data_popfile.txt
```

- `-K 10`: run K = 1 to 10.
- `-R 10`: 10 replicates for each K.
- `-t 20`: number of runs in parallel (one CPU each; check with `nproc`).
- `-st`: path of the STRUCTURE program.

10 K × 10 replicates = 100 runs: with ~100 individuals and ~10,000 SNPs
this can take days.

Output in `results/structure_out/`:

| File | Content |
|---|---|
| `str_K2_rep1_f`, ... | STRUCTURE result of each run (input of pophelper) |
| `bestK/evanno.txt` | Evanno table (made by structure_threader with Structure Harvester) |
| `plots/` | quick bar plots of each run |

## 4. fastSTRUCTURE

From the `data/` folder:

```bash
structure_threader run -K 10 -i my_data_fast.str -o ../results/faststructure_out \
    -t 10 -fs $CONDA_PREFIX/bin/fastStructure --pop my_data_popfile.txt
cat ../results/faststructure_out/bestK/chooseK.txt
```

```
Model complexity that maximizes marginal likelihood = 2
Model components used to explain structure in data = 2
```

It runs in minutes. The two values give a range of plausible K. The
results (`fS_run_K.2.meanQ`, ...) can be plotted with pophelper, like the
STRUCTURE results.

## 5. Choose K

- **ΔK** (Evanno method) has a peak at the K where the likelihood increases
  most. It often gives **K = 2**, because it detects the uppermost level of
  structure (e.g. two major lineages). This does not mean that there is no
  further structure.
- **Mean ln P(D)** usually increases and then reaches a plateau; the start
  of the plateau is another estimate of K.
- **Look at the bar plots for several K.** The "best" K is a model choice,
  not a biological truth. Report the K suggested by the methods, and
  describe what higher K values show (e.g. at K = 3 a third species
  separates).
- **Uneven sampling** (some populations with many more individuals) biases
  ΔK. Puechmaille (2016) proposes alternative estimators.

> **Example from the original analysis.** STRUCTURE and fastSTRUCTURE chose
> K = 2, splitting the samples into two groups of species. At K = 3 one more
> species separated. DAPC ([05](../05_pca_dapc/)) found more clusters. The
> methods do not contradict each other: they describe the structure at
> different levels.

## 6. Plot the results with pophelper

pophelper reads the STRUCTURE (`_f`) and fastSTRUCTURE (`.meanQ`) files,
runs the Evanno method, **aligns the runs** (the same cluster can have
different colors in different runs) and makes the bar plots with population
labels. Use either the web app or R.

Copy the results to your computer if they are on a server:
`results/structure_out/` (the `str_K*_f` files) and
`data/my_data_labels.txt`.

### 6.1 Web app

1. Open <http://pophelper.com/>.
2. **Upload** tab: select all the `str_K*_f` files (or `.meanQ` files). With
   many files, zip them first and upload the zip. Input format: *Auto*.
3. **Data** tab: table of the runs (tabulated) and summary for each K.
4. **Evanno** tab (STRUCTURE only): select the runs; the table and plots
   show ΔK for each K. Download the table for your notes.
5. **Plotting** tab:
   - select the runs to plot (e.g. one run for each K from 2 to 5);
   - **Align/Merge**: choose *Align within K* (or *Merge runs*, which
     averages the replicates of each K), and *Align across K* so that the
     same cluster keeps its color in all K;
   - **Group labels**: upload `my_data_labels.txt` (one column with the
     header `population`, one line per individual, in the same order as the
     input file);
   - choose the colors, then download the plot (*Download options*: size in
     cm, resolution, file type: PDF, PNG...).

### 6.2 R (RStudio)

Open `scripts/plot_structure.R` in RStudio, change the folder in `setwd()`
and run it line by line. The main steps:

```r
library(pophelper)

files  <- list.files("results/structure_out", pattern = "_f$", full.names = TRUE)
qlist  <- readQ(files)                       # read the runs

sr     <- summariseQ(tabulateQ(qlist))       # summary for each K
evanno <- evannoMethodStructure(sr, exportplot = TRUE, exportpath = "results", imgtype = "pdf")

labels <- read.table("data/my_data_labels.txt", header = TRUE, stringsAsFactors = FALSE)

qlist_aligned <- alignK(qlist)                            # align the runs of the same K
qlist_aligned <- alignK(qlist_aligned, type = "across")   # same colors across K

ks  <- sapply(qlist_aligned, ncol)
sel <- match(2:5, ks)                        # one run for each K from 2 to 5
plotQ(qlist_aligned[sel], imgoutput = "join", grplab = labels,
      showsp = TRUE, splab = paste0("K=", 2:5), showindlab = FALSE,
      exportpath = "results", outputfilename = "structure_K2-5", imgtype = "pdf",
      width = 25, height = 3)
```

The Evanno table is printed in the Console (`deltaK` column) and saved as
`results/evannoMethodStructure.pdf`. The bar plot is
`results/structure_K2-5.pdf`. Change the colors with
`clustercol = c("#1f77b4", "#ff7f0e", ...)` in `plotQ()`. The pophelper
tutorial (link below) shows many more options (sorting individuals,
several label sets, plots in several lines).

## 7. Interpretation

- **Admixed individuals** (bars with two or more colors) can be hybrids,
  but mixed ancestry can also come from incomplete lineage sorting or from
  a population that is not in the sample. Confirm with ancestry painting
  and D statistics ([phylogenomics](../phylogenomics/)).
- **Isolation by distance** produces gradients of ancestry along geography,
  which STRUCTURE can show as admixture. If populations are spread along a
  gradient, run conStruct ([08](../08_construct/)).
- **Missing data:** individuals with much missing data can have
  intermediate Q. Check them ([03](../03_filtering/#4-filter)).

## Next step

Faster ancestry estimates, with and without geography:
[07_snmf_tess3](../07_snmf_tess3/).

## More information

- structure_threader documentation: <https://structure-threader.readthedocs.io/>
- pophelper web app: <http://pophelper.com/>; R package, with a link to the
  tutorial of all plot options: <https://github.com/royfrancis/pophelper>
- Structure Harvester (Evanno method on the web):
  <https://taylor0.biology.ucla.edu/structureHarvester/>
- STRUCTURE manual: <https://web.stanford.edu/group/pritchardlab/structure_software/release_versions/v2.3.4/structure_doc.pdf>

## References

- Pritchard JK, Stephens M, Donnelly P (2000) Inference of population
  structure using multilocus genotype data. *Genetics* 155: 945–959.
- Falush D, Stephens M, Pritchard JK (2003) Inference of population
  structure using multilocus genotype data: linked loci and correlated
  allele frequencies. *Genetics* 164: 1567–1587.
- Raj A, Stephens M, Pritchard JK (2014) fastSTRUCTURE: variational
  inference of population structure in large SNP data sets. *Genetics* 197:
  573–589.
- Pina-Martins F, Silva DN, Fino J, Paulo OS (2017) Structure_threader: an
  improved method for automation and parallelization of programs
  structure, fastStructure and MavericK on multicore CPU systems. *Molecular
  Ecology Resources* 17: e268–e274.
- Evanno G, Regnaut S, Goudet J (2005) Detecting the number of clusters of
  individuals using the software STRUCTURE: a simulation study. *Molecular
  Ecology* 14: 2611–2620.
- Earl DA, vonHoldt BM (2012) STRUCTURE HARVESTER: a website and program for
  visualizing STRUCTURE output and implementing the Evanno method.
  *Conservation Genetics Resources* 4: 359–361.
- Francis RM (2017) pophelper: an R package and web app to analyse and
  visualize population structure. *Molecular Ecology Resources* 17: 27–32.
- Puechmaille SJ (2016) The program STRUCTURE does not reliably recover the
  correct population structure when sampling is uneven: subsampling and new
  estimators alleviate the problem. *Molecular Ecology Resources* 16:
  608–627.
