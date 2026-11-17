# 01 — Raw reads: quality control and cleaning

Check the quality of the raw sequencing reads, then remove barcodes and
adapters, trim low-quality bases and discard short reads.

**Script**

| Script | What it does |
|---|---|
| [`scripts/clean_reads.sh`](scripts/clean_reads.sh) | Runs fastq-mcf on each sample |

## Install

```bash
conda create -n reads fastqc multiqc ea-utils
conda activate reads
fastqc --version
fastq-mcf -h | head -3
```

`ea-utils` is the package that contains `fastq-mcf`.

---

## 1. The raw data

These tutorials use **DArTseq** data (single-end Illumina reads from a
reduced-representation library, *PstI*-*MseI*), but the same steps apply to
other RAD-seq/GBS data.

DArT delivers **one FASTQ file per sample**, named with the sample ID
(e.g. `2062251.FASTQ.gz`), and a table linking each ID to the sample name
and its **barcode**. Each read starts with the barcode of its sample:

```
@...
GCTTCGGCTGTTGCAGATTGGTGCTGATAATGATCCCATGTAAG...
└──── barcode ─┘└──── genomic sequence ───────...
```

Keep the raw files untouched in `00_raw_data/` (see
[00_setup](../00_setup/#2-organize-the-project)) and work on copies or
links.

> **Plates sequenced together.** If DArT delivered one file with the reads
> of a whole plate, separate the samples first with `process_radtags`
> (Stacks) and a barcode file: see the
> [Stacks manual](https://catchenlab.life.illinois.edu/stacks/manual/#procrad).

## 2. Quality control of the raw reads

```bash
cd ~/my_project/01_raw_reads
mkdir -p results/fastqc_raw
fastqc -t 8 -o results/fastqc_raw ../00_raw_data/*.FASTQ.gz
multiqc -o results/multiqc_raw results/fastqc_raw
```

FastQC makes one report per sample; MultiQC joins them in one report:
open `results/multiqc_raw/multiqc_report.html` in a browser. Look at:

- **Number of reads per sample** (General statistics): samples with far
  fewer reads than the others will have much missing data later.
- **Per-base sequence quality**: quality usually drops at the end of the
  reads. Bases with quality below 30 will be trimmed.
- **Adapter content**: Illumina adapters at the end of short fragments.
- **Per-base sequence content**: the first bases are the **barcode** and
  the restriction site, so they are not random. This FastQC "failure" is
  expected for RAD-seq/DArT data.

## 3. Clean the reads with fastq-mcf

fastq-mcf removes the sequences listed in a FASTA file (barcodes and
adapters), trims bases with low quality and discards reads that became too
short.

### 3.1 FASTA with barcodes and adapter

Make a FASTA file with the barcode of each sample and the Illumina adapter.
From a two-column table `<sample ID> <barcode>` (made from the DArT target
file):

```bash
awk '{print ">"$1"\n"$2}' data/sample_barcodes.txt > data/barcodes_adapter.fasta
printf ">adaptor_illumina\nAGATCGGAAGAG\n" >> data/barcodes_adapter.fasta
head -4 data/barcodes_adapter.fasta
```

```
>2062251
GCTTCGGCTGTTGCA
>2062252
TGTTCCTGCTGATGC
```

One file with **all** barcodes is enough: fastq-mcf finds which sequence is
present at the start of the reads of each sample and removes only that
one.

### 3.2 List of samples

```bash
ls ../00_raw_data/ | sed 's/.FASTQ.gz//' > data/samples.txt
head -3 data/samples.txt
```

### 3.3 Run

Edit the settings at the top of `clean_reads.sh`:

```bash
RAW_DIR=../00_raw_data
SAMPLES=data/samples.txt
ADAPTERS=data/barcodes_adapter.fasta
QUALITY=30
MIN_LENGTH=50
```

```bash
conda activate reads
bash scripts/clean_reads.sh
```

The log of each sample (`results/logs/<sample>.fastq-mcf.log`) shows what
was done:

```
Adapter 2062251 (GCTTCGGCTGTTGCA): counted 299947 at the 'start' of '2062251.FASTQ.gz', clip set to 1
Adapter adaptor_illumina (AGATCGGAAGA): counted 99843 at the 'end' of '2062251.FASTQ.gz', clip set to 1
Total reads: 1464023
Too short after clip: 403365
Clipped 'start' reads: Count: 1060658, Mean: 15.00, Sd: 0.00
Trimmed 194825 reads by an average of 1.38 bases on quality < 30
```

Here the barcode (15 bases) was removed from the start of the reads, the
adapter from the end, and ~28% of the reads were discarded because they
were shorter than 50 bases after trimming.

**Settings:**

- `-q 30`: trim bases with quality < 30 from the ends of the reads.
- `-l 50`: discard reads shorter than 50 bases. Short reads map to many
  places in the genome. Use the same value for all samples.

## 4. Quality control of the clean reads

Run FastQC and MultiQC again on the clean reads and compare with the raw
ones:

```bash
mkdir -p results/fastqc_clean
fastqc -t 8 -o results/fastqc_clean results/clean_reads/*.fq.gz
multiqc -o results/multiqc_clean results/fastqc_clean
```

The adapters should be gone, the quality high along the reads, and the
reads between 50 bases and the original length minus the barcode.

Write down for each sample the number of raw and clean reads: it is useful
to explain missing data later, and for the methods section.

## Next step

Map the clean reads to a reference genome and call the SNPs:
[02_snp_calling](../02_snp_calling/).

## More information

- FastQC: <https://www.bioinformatics.babraham.ac.uk/projects/fastqc/>
  (the documentation explains each module and what "fail" means)
- MultiQC: <https://multiqc.info/>
- fastq-mcf (ea-utils): <https://expressionanalysis.github.io/ea-utils/>

## References

- Andrews S (2010) FastQC: a quality control tool for high throughput
  sequence data.
- Ewels P, Magnusson M, Lundin S, Käller M (2016) MultiQC: summarize
  analysis results for multiple tools and samples in a single report.
  *Bioinformatics* 32: 3047–3048.
- Aronesty E (2013) Comparison of sequencing utility programs. *The Open
  Bioinformatics Journal* 7: 1–8. (ea-utils, fastq-mcf)
- Kilian A, Wenzl P, Huttner E, et al. (2012) Diversity Arrays Technology: a
  generic genome profiling technology on open platforms. *Methods in
  Molecular Biology* 888: 67–89.
