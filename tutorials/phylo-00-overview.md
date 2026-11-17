# Phylogenomics and introgression

Tutorials to infer the relationships between populations or species and to
test for hybridization and gene flow, from a filtered VCF
([03_filtering](../03_filtering/)).

| # | Tutorial | Question |
|---|---|---|
| 01 | [SVDQuartets](01_svdquartets/) | How are the individuals or populations related? |
| 02 | [Ancestry painting](02_ancestry_painting/) | Are putative hybrids heterozygous at sites fixed between the parents? |
| 03 | [Dsuite](03_dsuite/) | Is there excess allele sharing (gene flow) between groups? D statistics, f4-ratio, f-branch |

More tutorials will be added (RAxML-ng, IQ-TREE, SNAPP, SplitsTree, HyDe,
ADMIXTOOLS, species delimitation).

These analyses need an **outgroup**: make the VCF with the outgroup samples
(see [03_filtering](../03_filtering/#1-which-vcf-for-which-analysis)).

## Installing the tools

Create a conda environment for these tutorials (see
[00_setup](../00_setup/) for conda):

```bash
conda create -n phylo -c conda-forge -c bioconda vcftools bcftools ruby python=3.11 numpy pandas matplotlib
conda activate phylo
```

### PAUP\*

#### The `libgfortran.so.4` error

The Linux build of PAUP\* needs an old Fortran runtime (GCC 7). On recent
Ubuntu versions (22.04 and later) it fails with:

```
error while loading shared libraries: libgfortran.so.4: cannot open shared object file: No such file or directory
```

Install the library in a conda environment:

```bash
conda create -n paup python=2.7
conda activate paup
conda install -c conda-forge libgfortran4
ls $CONDA_PREFIX/lib | grep gfortran      # should list libgfortran.so.4
```

(With `sudo` on Ubuntu 18.04/20.04, `sudo apt install libgfortran4` also works.)

#### Download

Get the Linux build from <https://phylosolutions.com/paup-test/>:

```bash
mkdir -p ~/programs && cd ~/programs
wget https://phylosolutions.com/paup-test/paup4a169_ubuntu64.gz    # check the newest version on the site
gzip -d paup4a169_ubuntu64.gz       # .gz, not .zip: use gzip, not unzip
chmod +x paup4a169_ubuntu64
```

PAUP\* test builds expire. If PAUP\* says the version has expired, download
the newest one.

Test it:

```bash
conda activate paup
LD_LIBRARY_PATH=$CONDA_PREFIX/lib:$LD_LIBRARY_PATH ./paup4a169_ubuntu64
```

#### A `paup` command

To call PAUP\* with just `paup`, from any folder and without activating the
conda environment, create a small wrapper script. Run this **from the folder
with the PAUP\* executable, with the `paup` environment active** (the script
records the absolute paths):

```bash
conda activate paup
cd ~/programs

mkdir -p ~/bin
cat > ~/bin/paup << EOF
#!/bin/bash
export LD_LIBRARY_PATH=$CONDA_PREFIX/lib:\$LD_LIBRARY_PATH
exec $(pwd)/paup4a169_ubuntu64 "\$@"
EOF
chmod +x ~/bin/paup
cat ~/bin/paup        # should show absolute paths, not $CONDA_PREFIX
```

Add `~/bin` to your `PATH` (`~/.bashrc` for bash, `~/.zshrc` for zsh):

```bash
echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
which paup
paup
```

> An `alias` would not work in scripts, `nohup` or job schedulers; a script
> in the `PATH` does.

### Dsuite

```bash
cd ~/programs
git clone https://github.com/millanek/Dsuite.git
cd Dsuite
make
echo 'export PATH=$HOME/programs/Dsuite/Build:$PATH' >> ~/.bashrc
source ~/.bashrc
Dsuite          # shows the help
```

The f-branch plotting script is `~/programs/Dsuite/utils/dtools.py`.

### vcf2phylip.py

```bash
wget https://raw.githubusercontent.com/millanek/tutorials/refs/heads/master/analysis_of_introgression_with_snp_data/src/vcf2phylip.py
python vcf2phylip.py -h
```

The original script and its documentation are at
<https://github.com/edgardomortiz/vcf2phylip> (Ortiz 2019).


## More information

These tutorials adapt and extend the tutorials of **Milan Malinsky** and
**Michael Matschiner**:

- Species tree inference with SNP data:
  <https://github.com/millanek/tutorials/tree/master/species_tree_inference_with_snp_data>
- Analysis of introgression with SNP data:
  <https://github.com/millanek/tutorials/tree/master/analysis_of_introgression_with_snp_data>
- Divergence time estimation with SNP data:
  <https://github.com/millanek/tutorials/tree/master/divergence_time_estimation_with_snp_data>
- Scripts from those tutorials (`vcf2phylip.py`, `get_fixed_site_gts.rb`,
  `plot_fixed_site_gts.rb`) and from Dsuite (`dtools.py`) are downloaded from
  their original repositories and are not included here.
- Review of methods to detect introgression: Hibbins MS, Hahn MW (2022)
  Phylogenomic approaches to detecting and characterizing introgression.
  *Genetics* 220: iyab173.
