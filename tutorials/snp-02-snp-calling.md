# 02 — Mapping and SNP calling

Map the clean reads to a reference genome and call the variants of all
samples together, to get a VCF file. If there is no reference genome for
your group, see [section 5](#5-without-a-reference-genome-stacks-de-novo).

**Scripts**

| Script | What it does |
|---|---|
| [`scripts/map_reads.sh`](scripts/map_reads.sh) | Maps each sample with BWA, keeps the mapped reads, sorts and indexes the BAM files |
| [`scripts/call_snps.sh`](scripts/call_snps.sh) | Merges the BAM files and calls the variants with FreeBayes |

## Install

```bash
conda create -n snps bwa samtools bamaddrg freebayes bcftools
conda activate snps
```

---

## 1. Steps

```
clean reads (01) ──bwa mem──> SAM ──samtools──> sorted BAM per sample
    ──bamaddrg──> one BAM with all samples ──freebayes──> VCF
```

- **Mapping** finds where each read comes from in the reference genome.
- **Variant calling** compares the reads of all samples at each position and
  decides, for each sample, its genotype (0/0, 0/1, 1/1).

All samples are called **together** (one FreeBayes run): a site that is
variable in one sample is genotyped in all the others.

## 2. Prepare the reference genome

Use the genome of the species or of a closely related one (in the original
analyses, *Petunia inflata* or *P. axillaris* for *Petunia* species).
Index it once:

```bash
cd ~/my_project/02_snp_calling
conda activate snps
bwa index data/reference.fasta
```

Use the same list of samples as in [01](../01_raw_reads/):

```bash
cp ../01_raw_reads/data/samples.txt data/
```

## 3. Map the reads

Edit the settings at the top of `map_reads.sh`:

```bash
REFERENCE=data/reference.fasta
READS_DIR=../01_raw_reads/results/clean_reads
SAMPLES=data/samples.txt
THREADS=8
```

```bash
bash scripts/map_reads.sh
```

For each sample the script runs:

```bash
bwa mem -t 8 data/reference.fasta <sample>.fq.gz \
    | samtools view -F 4 -b - \
    | samtools sort -@ 8 -o results/bam/<sample>.bam -
```

- `samtools view -F 4`: keeps only the reads that mapped (flag 4 =
  unmapped).
- `samtools sort`: sorts the reads by position, as needed by FreeBayes.

### Check the mapping

`results/mapping_stats/<sample>.flagstat.txt` has the number of mapped
reads of each sample. Make a table of all samples:

```bash
for f in results/mapping_stats/*.flagstat.txt; do
    echo -e "$(basename $f .flagstat.txt)\t$(head -1 $f | cut -d' ' -f1)"
done > results/mapped_reads_per_sample.txt
sort -k2,2n results/mapped_reads_per_sample.txt | head
```

Compare with the number of clean reads ([01](../01_raw_reads/)): the
proportion of reads that map depends on how close the reference is to your
species. Samples with very few mapped reads will have much missing data.

## 4. Call the variants

Edit the settings of `call_snps.sh`:

```bash
REFERENCE=data/reference.fasta
SAMPLES=data/samples.txt
OUTPUT=results/my_data.vcf
MIN_MAP_QUALITY=30
MIN_BASE_QUALITY=30
MIN_COVERAGE=10
LIMIT_COVERAGE=10000
```

```bash
byobu                          # FreeBayes can take many hours
conda activate snps
bash scripts/call_snps.sh
```

The script:

1. **Merges the BAM files** with `bamaddrg`, which adds the sample name to
   each read, so that FreeBayes knows which sample each read comes from:

   ```bash
   bamaddrg -b results/bam/2062251.bam -s 2062251 -b results/bam/2062252.bam -s 2062252 ... > results/all_samples.bam
   ```

2. **Calls the variants** with FreeBayes:

   ```bash
   freebayes -b results/all_samples.bam -f data/reference.fasta -v results/my_data.vcf \
       -m 30 -q 30 --min-coverage 10 --limit-coverage 10000
   ```

   - `-m 30`: use only reads with mapping quality ≥ 30 (reads that map to
     one place).
   - `-q 30`: use only bases with quality ≥ 30.
   - `--min-coverage 10`: skip sites with fewer than 10 reads (all samples
     together).
   - `--limit-coverage 10000`: skip sites with too many reads, which are
     usually repeated regions. A common value is about 100 × the number of
     samples.

```
Number of variants: ...
Number of samples:  ...
Done: results/my_data.vcf
```

(In the original analysis, the VCF of 145 samples had 1.27 million
variants before filtering.)

The VCF contains all types of variants (SNPs, indels, complex variants)
and is not filtered yet: the filtering depends on the analysis
([03_filtering](../03_filtering/)).

## 5. Without a reference genome: Stacks de novo

If there is no reference genome close enough to your species, Stacks can
build the loci *de novo* by comparing the reads.

```bash
conda create -n stacks stacks
conda activate stacks
```

The two key parameters are `-M` (mismatches allowed between the two alleles
of a locus within an individual) and `-n` (mismatches between loci of
different individuals). Choose them with the **R80 method** (Paris et al.
2017): run `denovo_map.pl` on a subset of ~20 representative samples with
M = n = 1 to 10, and count the loci present in at least 80% of the samples
(`--min-samples-per-pop 0.8`):

```bash
for n in 1 2 3 4 5 6 7 8 9 10; do
    mkdir -p results/opt/M${n}
    denovo_map.pl --samples ../01_raw_reads/results/clean_reads/ --popmap data/popmap_subset.txt \
        -o results/opt/M${n} -M $n -n $n -T 8 --min-samples-per-pop 0.8
done
```

Here the Stacks popmap is `<sample> <tab> <population>` (opposite to the
popmap of the other tutorials), and for this test all samples can be in one
population. The number of R80 loci of each run is in
`results/opt/M<n>/populations.log`. It increases with M = n and then levels
off: choose the value after which it stops increasing (in the original
analysis, M = n = 3). Then run all samples:

```bash
denovo_map.pl --samples ../01_raw_reads/results/clean_reads/ --popmap data/popmap_stacks.txt \
    -o results/denovo -M 3 -n 3 -T 8
populations -P results/denovo -M data/popmap_stacks.txt --vcf -t 8
```

The VCF is `results/denovo/populations.snps.vcf`.

> Stacks expects all reads to have the **same length**. With fastq-mcf
> ([01](../01_raw_reads/)), trim all reads to the same length with
> `-l 60 -L 60` (minimum and maximum length 60).

## Next step

Filter the VCF: [03_filtering](../03_filtering/).

## More information

- BWA: <https://github.com/lh3/bwa>; SAMtools: <http://www.htslib.org/>
- FreeBayes: <https://github.com/freebayes/freebayes>
- bamaddrg: <https://github.com/ekg/bamaddrg>
- Stacks manual: <https://catchenlab.life.illinois.edu/stacks/manual/>
- Rochette NC, Catchen JM (2017) Deriving genotypes from RAD-seq short-read
  data using Stacks. *Nature Protocols* 12: 2640–2659. (step-by-step
  protocol, including the R80 optimisation)

## References

- Li H, Durbin R (2009) Fast and accurate short read alignment with
  Burrows–Wheeler transform. *Bioinformatics* 25: 1754–1760.
- Danecek P, Bonfield JK, Liddle J, et al. (2021) Twelve years of SAMtools
  and BCFtools. *GigaScience* 10: giab008.
- Garrison E, Marth G (2012) Haplotype-based variant detection from
  short-read sequencing. arXiv:1207.3907.
- Paris JR, Stevens JR, Catchen JM (2017) Lost in parameter space: a road
  map for Stacks. *Methods in Ecology and Evolution* 8: 1360–1373.
- Rochette NC, Rivera-Colón AG, Catchen JM (2019) Stacks 2: Analytical
  methods for paired-end sequencing improve RADseq-based population
  genomics. *Molecular Ecology* 28: 4737–4754.
