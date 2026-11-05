# Example analysis pipeline

> **What this does:** one or two sentences describing the goal of the pipeline, what goes in and what comes out.

## Overview

| Step | Tool | Input | Output |
|------|------|-------|--------|
| 1. Quality control | `tool-a` | raw data | QC report |
| 2. Processing | `tool-b` | clean data | processed files |
| 3. Analysis | `script.R` | processed files | figures & tables |

## Requirements

- Linux / macOS (or an HPC cluster)
- [conda](https://docs.conda.io/) or [mamba](https://mamba.readthedocs.io/)
- ~X GB RAM, ~Y GB disk

Create the environment:

```bash
mamba env create -f environment.yml
conda activate my-pipeline
```

## Step 1 — Quality control

Explain *why* this step matters and any parameters you chose.

```bash
mkdir -p results/qc
tool-a --input data/raw/ --output results/qc/ --threads 8
```

## Step 2 — Processing

```bash
for sample in $(cat samples.txt); do
    tool-b --in data/raw/${sample}.txt --out results/processed/${sample}.out
done
```

## Step 3 — Analysis

```r
library(tidyverse)
df <- read_tsv("results/processed/summary.tsv")
ggplot(df, aes(x = condition, y = value)) + geom_boxplot()
```

## Notes & troubleshooting

- **Common error X** → fix Y.
- Tested with `tool-a v1.2`, `tool-b v3.4` (November 2026).

## Cite

If this pipeline helps you, please cite: *Soares LS et al. (2026) Journal Name.*
