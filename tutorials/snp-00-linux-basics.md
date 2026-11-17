# 00 — Linux basics

Most analyses in these tutorials run on a **Linux server**, through the
**command line** (the terminal). This tutorial explains the main logic of
Linux, the commands you will use every day, how to keep analyses running
with **byobu**, and how to add a program to the **PATH**.

Try each command as you read: you learn the terminal by using it.

---

## 1. Connect to the server

From your computer, open a terminal:

- **Mac**: the *Terminal* app.
- **Linux**: any terminal.
- **Windows**: *PowerShell*, or [MobaXterm](https://mobaxterm.mobatek.net/)
  (terminal and file transfer in one window).

Connect with `ssh` (secure shell):

```bash
ssh <user>@<server address>
# e.g. ssh luana@server.university.edu
```

Type your password (nothing appears on screen while you type: this is
normal). You are now working **on the server**: every command runs there,
not on your computer. To leave: `exit`.

## 2. The main logic

### 2.1 The command line

The terminal shows a **prompt** and waits for a command:

```
luana@server:~$
```

(`luana` = user, `server` = computer, `~` = current folder, `$` = waiting
for a command.)

A command has the form:

```
command  -options  arguments
ls       -l        my_project/
```

- **Options** change what the command does (`-l` = long list). They start
  with `-` (short: `-l`) or `--` (long: `--help`).
- **Arguments** are what the command works on (files, folders).

Linux is **case-sensitive**: `Data.txt`, `data.txt` and `DATA.txt` are three
different files. Avoid spaces and accents in file names: use `_` or `-`
(`my_data.vcf`, not `my data.vcf`).

### 2.2 Files and folders

Everything is a file, inside folders (directories), organized as a tree
starting at the **root** `/`:

```
/
├── home/
│   ├── luana/          <- your home folder: ~
│   │   ├── my_project/
│   │   └── programs/
│   └── other_user/
├── usr/
│   └── bin/            <- system programs
└── tmp/
```

- **Home folder** (`~`): your own folder; you can only write here (and in
  folders where you have permission).
- **Absolute path**: starts at the root: `/home/luana/my_project/data.vcf`.
- **Relative path**: starts at the current folder: if you are in
  `/home/luana`, the same file is `my_project/data.vcf`.

Special names:

| Name | Meaning |
|---|---|
| `~` | your home folder |
| `.` | the current folder |
| `..` | the folder above (parent) |
| `/` | the root (or the separator between folders) |

### 2.3 Help

```bash
man ls              # manual of a command (q to quit, / to search)
ls --help           # short help of most commands
vcftools --help     # most bioinformatics programs have -h or --help
```

## 3. Main commands

### 3.1 Moving around

```bash
pwd                 # print working directory: where am I?
ls                  # list the files of the current folder
ls -l               # long list: size, date, permissions
ls -lh              # sizes in KB/MB/GB (h = human-readable)
ls -a               # also hidden files (names starting with .)
cd my_project       # change directory: go into my_project
cd ..               # go up one folder
cd ~                # go to your home folder (also: cd)
cd -                # go back to the previous folder
```

**Tab completion**: type the first letters of a file or folder and press
**Tab**: the terminal completes the name. Press Tab twice to see all
options. Use it always: it saves time and avoids typing errors.

**History**: the **↑** arrow shows the previous commands; `history` lists
them; **Ctrl+R** searches them.

### 3.2 Files and folders

```bash
mkdir results                   # make a folder
mkdir -p a/b/c                  # make nested folders
cp file.txt copy.txt            # copy a file
cp -r folder/ folder_copy/      # copy a folder (-r = recursive)
mv file.txt results/            # move a file
mv old_name.txt new_name.txt    # rename a file
rm file.txt                     # remove a file
rm -r folder/                   # remove a folder and everything inside
ln -s ../data/my_data.vcf .     # make a link (shortcut) to a file
```

> **Careful with `rm`:** there is no trash bin in the terminal. A removed
> file is gone. Check with `ls` before removing, and never run `rm -r` on a
> path you have not checked.

**Wildcards** select many files at once:

```bash
ls *.vcf            # all files ending in .vcf
ls sample_?.txt     # ? = any one character: sample_1.txt, sample_2.txt...
cp *.fq.gz backup/  # copy all .fq.gz files
```

### 3.3 Looking at files

```bash
cat file.txt            # print the whole file (only for small files)
less file.txt           # read page by page (space = next page, q = quit, / = search)
head file.txt           # first 10 lines
head -n 20 file.txt     # first 20 lines
tail file.txt           # last 10 lines
tail -f log.txt         # follow a file that is growing (Ctrl+C to stop)
wc -l file.txt          # count lines
zcat reads.fq.gz | head # look inside a compressed file without decompressing it
```

Useful for VCF files:

```bash
grep -v "^#" my_data.vcf | wc -l     # number of SNPs (lines not starting with #)
grep "^#CHROM" my_data.vcf           # the line with the sample names
less -S my_data.vcf                  # long lines without wrapping (arrows to move right)
```

### 3.4 Searching and editing text

```bash
grep "PopA" popmap.txt          # lines containing PopA
grep -c "PopA" popmap.txt       # count them
grep -v "PopA" popmap.txt       # lines NOT containing PopA
cut -f 2 popmap.txt             # second column (tab-separated)
sort file.txt                   # sort lines
sort -k2,2n file.txt            # sort by the 2nd column, numerically
uniq -c                         # count repeated lines (after sort)
sed 's/old/new/g' file.txt      # replace text (prints the result)
```

Edit files with **nano**, a simple text editor in the terminal:

```bash
nano my_script.sh
```

The commands are shown at the bottom (`^` = Ctrl): **Ctrl+O** saves (then
Enter), **Ctrl+X** exits, **Ctrl+W** searches.

### 3.5 Pipes and redirection

The power of the terminal is combining commands:

| Symbol | Meaning | Example |
|---|---|---|
| `\|` | pipe: the output of one command goes to the next | `grep -v "^#" my_data.vcf \| wc -l` |
| `>` | save the output to a file (overwrites it) | `cut -f2 popmap.txt > samples.txt` |
| `>>` | add the output to the end of a file | `echo "PopC 1205" >> popmap.txt` |
| `2>` | save the error messages | `freebayes ... 2> errors.log` |
| `2>&1` | send the errors to the same place as the output | `bash script.sh > run.log 2>&1` |

Example: how many individuals per population?

```bash
cut -f1 popmap.txt | sort | uniq -c
```

```
     12 PopA
     23 PopB
      7 PopC
```

### 3.6 Compressed files and transfers

```bash
gzip file.txt                   # compress -> file.txt.gz
gunzip file.txt.gz              # decompress
tar -czf results.tar.gz results/   # pack and compress a folder
tar -xzf results.tar.gz         # unpack it
```

Copy files **between your computer and the server** (run on your
computer, not on the server):

```bash
scp luana@server:~/my_project/05_pca_dapc/data/my_data.vcf .     # server -> computer
scp my_file.txt luana@server:~/my_project/                         # computer -> server
rsync -av luana@server:~/my_project/06_structure/results/ results/ # copy a folder (only what changed)
```

Graphical programs such as FileZilla or MobaXterm do the same with drag and
drop.

### 3.7 Variables and loops

A **variable** stores a value; `$` reads it:

```bash
SAMPLE=2062251
echo $SAMPLE
ls ${SAMPLE}.fq.gz        # {} separates the name from the text around it
```

A **loop** repeats a command for many files, which is the basis of the
scripts in these tutorials:

```bash
for sample in $(cat samples.txt); do
    echo "Processing $sample"
    fastqc ${sample}.FASTQ.gz
done
```

### 3.8 Scripts

A script is a text file with commands, run one after the other. Save the
commands in a file (e.g. with nano):

```bash
#!/bin/bash
# count the SNPs of all VCF files in this folder
for vcf in *.vcf; do
    echo "$vcf $(grep -vc '^#' $vcf)"
done
```

Run it:

```bash
bash count_snps.sh
```

or make it executable and run it directly:

```bash
chmod +x count_snps.sh      # give execute permission
./count_snps.sh             # ./ = the script in the current folder
```

The first line `#!/bin/bash` says which program runs the script. Lines
starting with `#` are comments: use them to explain what each part does.

### 3.9 Permissions

`ls -l` shows the permissions of each file:

```
-rwxr-xr-- 1 luana lab 1200 Nov 17 10:00 count_snps.sh
```

`rwx` = read, write, execute, for the owner (`luana`), the group (`lab`)
and everyone else. `chmod +x file` adds execute permission;
`Permission denied` usually means you are trying to write in a folder that
is not yours, or to run a file that is not executable.

## 4. The server's resources

A server is shared by many people. Before starting a long analysis, check
what is available:

```bash
nproc               # number of processors (CPUs)
free -h             # memory (RAM): total, used, available
df -h ~             # free disk space where your home folder is
du -sh my_project/  # size of a folder
htop                # running programs and their CPU and memory use (q to quit)
```

Programs you started:

```bash
ps -u $USER         # list your running programs, with their number (PID)
kill 12345          # stop the program with PID 12345
```

**Ctrl+C** stops the command running in the terminal.

> Do not use all the processors if other people work on the same server.
> Ask your group how many you can use.

## 5. byobu: keep analyses running

### 5.1 Why

When you close the terminal, or the connection drops (Wi-Fi, laptop going
to sleep), **every command running in that terminal is stopped**. Many
analyses take hours or days (FreeBayes, STRUCTURE, EEMS), so they must run
somewhere that does not depend on your connection.

**byobu** creates sessions on the **server** that keep running when you
disconnect. You can leave, turn off your computer, connect again the next
day and find the session exactly as you left it, with the analysis still
running. (byobu is a friendlier interface to `tmux` or `screen`, which do
the same thing; you may see these names in other tutorials.)

### 5.2 Use

```bash
byobu               # start byobu (or reconnect to the session that is already running)
```

The terminal now has a status bar at the bottom: you are inside byobu. Run
your analysis as usual:

```bash
conda activate snps
cd ~/my_project/02_snp_calling
bash scripts/call_snps.sh
```

Then **detach** (leave byobu, with everything still running): press
**F6**. You can now close the terminal. Later, connect to the server again
and type `byobu`: you are back in the session, and you can see the
progress of the analysis.

### 5.3 Windows

A byobu session can have several **windows** (like tabs), e.g. one for
each analysis:

| Key | Action |
|---|---|
| **F2** | new window |
| **F3** / **F4** | previous / next window |
| **F8** | rename the window (e.g. "structure") |
| **F6** | detach: leave byobu, everything keeps running |
| **Shift+F2** / **Ctrl+F2** | split the window horizontally / vertically |
| **Shift+arrows** | move between the split parts |
| `exit` | close the current window (and stop what is running in it) |

The window names appear in the status bar at the bottom.

> **Mac keyboards:** the F keys may need the **fn** key (fn+F6). If the F
> keys do not work in your terminal, run `byobu-config` → *Change escape
> sequence*, and use the menu with **Ctrl+A** followed by the key (e.g.
> Ctrl+A then D to detach).

> **Do not run long analyses outside byobu.** If the connection drops, they
> are lost. A common mistake is to start byobu, detach, and then run the
> analysis in the normal terminal.

## 6. The PATH: how Linux finds programs

### 6.1 What it is

When you type a command such as `vcftools`, Linux looks for a program with
that name in a list of folders, the **PATH**:

```bash
echo $PATH
```

```
/home/luana/miniforge3/envs/popgen/bin:/home/luana/miniforge3/bin:/usr/local/bin:/usr/bin:/bin
```

The folders are separated by `:` and searched in order. To see where a
program is:

```bash
which vcftools
```

```
/home/luana/miniforge3/envs/popgen/bin/vcftools
```

If the program is not in any of these folders:

```
vcftools: command not found
```

This is why `conda activate` works: it adds the `bin` folder of the
environment to the beginning of the PATH.

### 6.2 Run a program that is not in the PATH

A program you downloaded or compiled yourself (e.g. EEMS, Dsuite) is in
its own folder. You can run it with its full path:

```bash
~/programs/Dsuite/Build/Dsuite
```

or from its folder with `./`:

```bash
cd ~/programs/Dsuite/Build
./Dsuite
```

### 6.3 Add a program to the PATH

To run it from anywhere just by its name, add its folder to the PATH:

```bash
export PATH=$HOME/programs/Dsuite/Build:$PATH
which Dsuite              # now it is found
```

This lasts only until you close the terminal. To make it permanent, add the
same line to the file `~/.bashrc`, which is read every time you open a
terminal:

```bash
echo 'export PATH=$HOME/programs/Dsuite/Build:$PATH' >> ~/.bashrc
source ~/.bashrc          # read the file again now
which Dsuite
```

Notes:

- Use **single quotes** `'...'` in the `echo` line, so that `$PATH` is
  written to the file as text and not replaced by its current value.
- Use `>>` (add), **not** `>` (overwrite), or you erase your `.bashrc`.
- Keep `:$PATH` at the end: without it, you replace the whole PATH and no
  command works any more (if this happens, open `~/.bashrc` with
  `/usr/bin/nano ~/.bashrc` and fix the line).
- If your shell is `zsh` (Mac), the file is `~/.zshrc` instead of
  `~/.bashrc` (`echo $SHELL` shows your shell).

An alternative is a folder `~/bin` for all your own programs and scripts:
add it to the PATH once, then copy or link programs into it:

```bash
mkdir -p ~/bin
echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
ln -s ~/programs/eems/runeems_snps/src/runeems_snps ~/bin/
```

## 7. Good practices

- **Know where you are** (`pwd`) before running a command, especially `rm`
  and `mv`.
- **Use Tab** to complete names, and **↑** to repeat commands.
- **Never edit raw data.** Keep it in its own folder and work on copies or
  links (see [00_setup](../00_setup/#2-organize-the-project)).
- **Write down the commands** you run, in a notes file or in scripts.
- **Test on a small file first** (e.g. `head -n 1000`) before running on
  all the data.
- **Read the error messages**: the last lines usually say what went wrong
  (file not found, permission denied, command not found).

## Next step

Install conda and organize your project: [00_setup](../00_setup/).

## More information

- The Linux command line for beginners (Ubuntu tutorial):
  <https://ubuntu.com/tutorials/command-line-for-beginners>
- Software Carpentry, *The Unix Shell* (a complete lesson with exercises):
  <https://swcarpentry.github.io/shell-novice/>
- byobu documentation: <https://www.byobu.org/documentation>
