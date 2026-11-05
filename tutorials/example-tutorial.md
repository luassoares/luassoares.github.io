# Getting started: reproducible environments with conda

Every project gets its own software environment, so analyses keep working months later and others can rerun them.

## 1. Install Miniforge

Download it from [conda-forge/miniforge](https://github.com/conda-forge/miniforge) and run:

```bash
bash Miniforge3-Linux-x86_64.sh
```

## 2. Create an environment per project

```bash
mamba create -n project-x python=3.12 pandas matplotlib
conda activate project-x
```

## 3. Export it so it can be recreated

```bash
conda env export --from-history > environment.yml
```

Commit `environment.yml` to the project repository next to your code.

## 4. Recreate it anywhere

```bash
mamba env create -f environment.yml
```

> **Tip:** pin versions (`pandas=2.2`) for anything that goes into a paper.
