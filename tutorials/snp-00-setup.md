# 00 — Setup: conda and how to organize your project

If you are new to the terminal, read [00_linux_basics](../00_linux_basics/)
first.

Before starting, prepare two things:

1. **conda**, to install the programs without administrator (root) access,
   each analysis in its own environment;
2. **a project folder**, with the data, scripts and results of each
   analysis kept apart.

Each tutorial starts with an **Install** section that shows how to install
the programs needed for that analysis only.

---

## 1. conda

conda installs programs and their dependencies in your home folder. A
**conda environment** is a separate set of programs: if two analyses need
different versions of the same program, each one has its own environment
and they do not conflict.

### 1.1 Install conda (once)

On a Linux server, install Miniforge (a small conda installation that uses
the conda-forge channel by default):

```bash
cd ~
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
bash Miniforge3-Linux-x86_64.sh        # accept the license and the default folder; answer "yes" to initialize
source ~/.bashrc
conda --version
```

Add the bioconda channel, where most bioinformatics programs are:

```bash
conda config --add channels bioconda
conda config --add channels conda-forge
conda config --set channel_priority strict
```

> If conda is already installed on your server (e.g. Anaconda or
> Miniconda), you do not need to install it again: run only the
> `conda config` commands.

### 1.2 Use environments

```bash
conda create -n popgen vcftools bcftools    # create an environment with two programs
conda activate popgen                        # use it
vcftools --version                           # the programs are now available
conda deactivate                             # leave the environment
conda env list                               # list your environments
conda install -n popgen plink2               # add a program to an existing environment
```

Good practice:

- **One environment per analysis (or group of analyses).** Environments
  with many programs become slow to install and break more easily. The
  tutorials say which environment to create.
- **Do not install programs in `base`** (the environment that is active
  when you log in).
- **Write down the versions** for the methods section of your paper:
  `conda list -n popgen > popgen_versions.txt`.

### 1.3 R and RStudio

The analyses in R (PCA, DAPC, sNMF, plots) can be run in **RStudio** on
your own computer, which is easier for exploring the results: download R
(<https://cran.r-project.org/>) and RStudio
(<https://posit.co/download/rstudio-desktop/>). Copy the input files (VCF,
popmap) from the server to your computer.

Long R analyses (conStruct) are better run on the server. Create an R
environment there:

```bash
conda create -n r-popgen r-base r-vcfr r-adegenet r-ggplot2
conda activate r-popgen
R        # then install the other packages inside R with install.packages()
```

## 2. Organize the project

Keep each analysis in its own folder, and inside it separate the **input
data**, the **scripts** and the **results**:

```
my_project/
├── 00_raw_data/              raw reads as received from the sequencing company (never edit them)
├── 01_raw_reads/
│   ├── data/                 input of this step
│   ├── scripts/              scripts used in this step
│   └── results/              output of this step
├── 02_snp_calling/
│   ├── data/
│   ├── scripts/
│   └── results/
├── 03_filtering/
│   ├── data/
│   ├── scripts/
│   └── results/
├── 05_pca_dapc/
│   ├── data/
│   ├── scripts/
│   └── results/
└── ...
```

Create the folders of an analysis with:

```bash
mkdir -p ~/my_project/03_filtering/{data,scripts,results}
```

**Input data.** The output of one step is the input of the next. Instead of
copying large files, create a link to them in the `data/` folder of the
next analysis:

```bash
cd ~/my_project/05_pca_dapc/data
ln -s ../../03_filtering/results/my_data-miss0.9-maf0.01-th100.recode.vcf .
cp ../../03_filtering/data/popmap.txt .
ls -l        # a link shows an arrow: name -> original file
```

**Scripts.** Download these tutorials once:

```bash
cd ~
git clone https://github.com/luassoares/genomics-tutorials.git
```

Copy the scripts of each tutorial to the `scripts/` folder of the analysis,
and edit the settings at the top. Run them from the analysis folder, so
that `data/` and `results/` are found:

```bash
cd ~/my_project/03_filtering
cp ~/genomics-tutorials/03_filtering/scripts/* scripts/
nano scripts/filter_vcf.sh          # edit the settings
bash scripts/filter_vcf.sh
```

**Notes.** Keep a text file in each analysis folder (e.g. `notes.md`) with
the commands you ran, the versions of the programs and what you decided
(e.g. why K = 3). You will need it for the methods section of your paper.

### 2.1 Files used in many tutorials

- **Popmap**: two columns, tab-separated, `<population> <sample ID>`, with
  the sample IDs exactly as in the VCF:

  ```
  PopA	1023
  PopA	1024
  PopB	1101
  Outgroup1	1201
  ```

- **Coordinates** (conStruct, sNMF/TESS3, EEMS, FEEMS): `<sample ID>
  <tab> <longitude> <tab> <latitude>`, decimal degrees, **longitude
  first**:

  ```
  1023	-50.950	-25.200
  1101	-51.217	-25.333
  ```

> **Files made in Excel or on Windows** have hidden Windows line endings that
> break many programs (sample names end with `\r`). Convert them with
> `dos2unix popmap.txt`, or `sed -i 's/\r$//' popmap.txt`.

## 3. Long runs

Run long analyses inside `byobu` (see
[00_linux_basics](../00_linux_basics/#5-byobu-keep-analyses-running)), so
they keep running if the connection drops:

```bash
byobu                # start (or reattach)
bash scripts/my_script.sh
# F6 = detach; run `byobu` again later to reattach
```

To show the output on screen **and** save it to a file (to check later what
happened):

```bash
bash scripts/my_script.sh 2>&1 | tee results/my_script.log
```

Check how many CPUs the server has with `nproc`, and do not use all of them
if other people work on the same server.
