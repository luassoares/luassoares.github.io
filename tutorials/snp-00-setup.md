# 00 — Setup: installing the tools without root access

All tools are installed in your home directory, using conda when possible.
Commands are for a Linux (Ubuntu) server.

| Tool | Used in | Install |
|---|---|---|
| PAUP\* | 01 SVDQuartets | binary + conda environment (below) |
| vcftools / bcftools | filtering | `conda install -c bioconda vcftools bcftools` |
| vcf2phylip.py | 01 SVDQuartets | download (below) |
| Ruby | 02 Ancestry painting | `conda install -c conda-forge ruby` |
| Dsuite | 03 Dsuite | compile (below) |
| Python 3 | scripts of this repository, `dtools.py` | `numpy`, `pandas`, `matplotlib` for `dtools.py` |

## 1. PAUP\*

### 1.1 The `libgfortran.so.4` error

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

### 1.2 Download

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

### 1.3 A `paup` command

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

## 2. Dsuite

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

## 3. vcf2phylip.py

```bash
wget https://raw.githubusercontent.com/millanek/tutorials/refs/heads/master/analysis_of_introgression_with_snp_data/src/vcf2phylip.py
python vcf2phylip.py -h
```

The original script and its documentation are at
<https://github.com/edgardomortiz/vcf2phylip> (Ortiz 2019).

## 4. Long runs

Run long analyses inside `byobu`, `tmux` or `screen`, so they keep running
if the connection drops:

```bash
byobu                # start (or reattach)
bash my_script.sh
# F6 = detach; run `byobu` again later to reattach
```

To show the output on screen **and** save it to a file, the scripts of
these tutorials use:

```bash
exec > >(tee my_log.out) 2>&1
```
