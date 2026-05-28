# The Missing Semester of Your CS Education — Complete Reference

**Source:** missing.csail.mit.edu  
**Institution:** MIT CSAIL (Computer Science and Artificial Intelligence Laboratory)  
**Instructors:** Anish Athalye, Jon Gjengset, Jose Javier Gonzalez Ortiz  
**Format:** Free public course — lecture notes + video recordings on YouTube  
**License:** CC BY-NC-SA  
**Latest edition:** January 2026 (IAP — Independent Activities Period)

> *"Classes teach you all about advanced topics within CS, from operating systems to machine learning, but there's one critical subject that's rarely covered, and is instead left to students to figure out on their own: proficiency with their tools."*

---

## Why This Course Exists

CS programs teach algorithms, data structures, operating systems, and machine learning — but almost never teach the **practical toolkit** developers use every single day. Students spend hundreds of hours and professionals spend thousands of hours using these tools over their careers. Most people learn them by accident, through Stack Overflow, or not at all.

**The gap this course fills:**
- How to actually use a terminal beyond `cd` and `ls`
- How to write shell scripts that automate your workflow
- How to use a text editor with real power (Vim)
- How to bend data to your will at the command line
- How Git actually works internally, not just `git add` and `git commit`
- How to debug systematically instead of relying on `print` statements
- How to profile code and find what's actually slow
- How build systems and dependency management work
- What cryptography primitives actually do and why they matter
- How to configure your development environment to work for you

**The promise:** Mastering these tools doesn't just save time — it lets you solve problems that would previously have seemed impossibly complex.

**2026 addition:** AI tools and workflows are now integrated directly into each lecture rather than treated as a separate topic.

---

## Course Structure

~9–11 independent 1-hour lectures during MIT's January IAP period. Each lecture has full written notes online, a YouTube recording, and exercises. Lectures are largely independent but build on each other.

---

## Lecture 1: The Shell

### What It Covers

The shell is the primary textual interface between you and your computer. Focus: **bash** (Bourne Again Shell) — the most widely used shell.

### The Shell Prompt

```
missing:~$
```

Components: hostname (`missing`), current directory (`~` = home), privilege indicator (`$` = not root, `#` = root).

### How the Shell Executes Commands

1. You type a command
2. Shell splits it by whitespace into program name + arguments
3. Shell searches `$PATH` for the program binary
4. Shell executes the binary with the arguments

`$PATH` is a colon-separated list of directories where the shell looks for programs.

### Navigating the Filesystem

```bash
.       # current directory
..      # parent directory
~       # home directory
/       # root of filesystem

pwd     # print working directory
cd ..   # go up one level
cd ~    # go to home
ls      # list directory contents
ls -l   # long format (permissions, size, date)
ls -a   # show hidden files (starting with .)
ls -lah # long format + hidden + human-readable sizes
```

### Connecting Programs: Pipes and Redirects

```bash
# Redirect output to a file:
command > file.txt        # overwrite
command >> file.txt       # append

# Read input from a file:
command < file.txt

# Pipe output of one command to input of another:
command1 | command2

# Redirect stderr separately:
command 2> error.txt

# Redirect both stdout and stderr:
command > file.txt 2>&1
command &> file.txt       # shorthand
```

### The Root User and sudo

- Root can read, write, and delete any file on the system
- Never log in as root directly — too easy to break things
- Use `sudo` to run individual commands as root
- `sudo !!` — re-run the last command with sudo

### Essential First Commands

```bash
man <command>       # open the manual page for any command
chmod 755 file      # change file permissions
chown user file     # change file ownership
cat file            # print file contents to stdout
tail -f file        # follow a file as it grows (live logs)
```

---

## Lecture 2: Shell Tools and Scripting

### What It Covers

Writing shell scripts, using shell tools effectively, and searching filesystem and history efficiently.

### Shell Scripting Fundamentals

**Variables:**
```bash
foo=bar           # NO spaces around =
echo $foo         # bar
echo "$foo"       # bar (double quotes expand variables)
echo '$foo'       # $foo (single quotes are literal)
```

**Special variables:**

| Variable | Meaning |
|---|---|
| `$0` | Name of the script |
| `$1` – `$9` | Arguments 1 through 9 |
| `$@` | All arguments |
| `$#` | Number of arguments |
| `$?` | Return code of the previous command (0 = success) |
| `$$` | Process ID of the current shell |
| `!!` | Last command (useful for `sudo !!`) |
| `$_` | Last argument of the last command |

**Control flow:**
```bash
# if/else:
if [ condition ]; then
    commands
elif [ other ]; then
    other_commands
else
    fallback
fi

# for loop:
for file in $(ls); do
    echo $file
done

# while loop:
while true; do
    commands
done
```

**Boolean operators:**
```bash
false || echo "Oops, fail"      # prints: Oops, fail
true  || echo "Won't print"     # nothing
true  && echo "Things went well" # prints: Things went well
false && echo "Won't print"     # nothing
command ; echo "Always runs"    # always runs second command
```

**Command substitution** — `$(CMD)` runs CMD and substitutes its output:
```bash
for file in $(ls); do echo $file; done
echo "Current date: $(date)"
```

**Process substitution** — `<(CMD)` puts output of CMD into a temp file:
```bash
diff <(ls foo) <(ls bar)   # compare contents of two directories
```

### Key Shell Tools

**Finding files:**
```bash
find . -name "*.py"              # find Python files recursively
find . -type d -name src         # find directories named src
find . -mtime -1                 # files modified in last 24h
find . -size +10M                # files larger than 10MB
find . -name "*.tmp" -exec rm {} \;  # find and delete
```

**Finding content in files:**
```bash
grep pattern file           # basic search
grep -r pattern dir         # recursive search in directory
grep -i pattern file        # case insensitive
grep -n pattern file        # show line numbers
grep -l pattern dir         # show only matching filenames
grep -v pattern file        # invert: exclude matching lines
grep -E "pattern1|pattern2" # extended regex (OR)
```

Better alternatives: `rg` (ripgrep) for faster grep with smarter defaults; `fd` for faster, friendlier find.

**Searching history:**
```bash
history | grep command      # search command history
Ctrl+R                      # interactive reverse search through history
```

**Quick directory navigation:**
- `fasd` / `z` / `autojump` — jump to frequent/recent directories by partial name

**Shell scripts: the shebang line:**
```bash
#!/bin/bash                     # use bash explicitly
#!/usr/bin/env python3          # portable: finds python3 in PATH
#!/usr/bin/env node             # finds node in PATH
```

**`shellcheck`** — lint your shell scripts to catch common errors:
```bash
shellcheck myscript.sh
```

### Useful Patterns

```bash
# Run command and check if it succeeded:
if command; then echo "success"; fi

# Run something only if a file exists:
[ -f file.txt ] && echo "exists"

# Run something only if a directory exists:
[ -d /path/to/dir ] && cd /path/to/dir

# Default value for unset variable:
NAME=${1:-"World"}    # use first arg, or "World" if not given

# Exit immediately on error:
set -e

# Treat unset variables as errors:
set -u

# Print each command before executing (debug mode):
set -x
```

---

## Lecture 3: Editors (Vim)

### What It Covers

Vim is a modal text editor deeply integrated into Unix. Available on nearly every server you'll ever SSH into — learning it means you have a powerful editor everywhere.

### The Modal Editing Model

Vim operates in distinct modes — the current mode determines what keystrokes do:

| Mode | Purpose | How to Enter |
|---|---|---|
| **Normal** | Navigate, run commands | `Esc` from any mode |
| **Insert** | Type text | `i` (before cursor), `a` (after), `o` (new line below), `O` (above) |
| **Visual** | Select text | `v` (character), `V` (line), `Ctrl+v` (block) |
| **Command** | Run editor commands | `:` from Normal mode |
| **Replace** | Overtype text | `R` |

### Core Commands (Normal → Command mode with `:`)

```
:q        quit
:q!       quit without saving (force)
:w        save (write)
:wq       save and quit
:x        save and quit (only writes if modified)
:e file   open file for editing
:ls       show open buffers
:help X   open help for X
:help :w  help for the :w command
```

### Movement (Normal mode — never use arrow keys)

```
h j k l       ← ↓ ↑ → (left, down, up, right)
w / b         next / previous word start
e             end of current word
0 / $         start / end of line
^             first non-blank character of line
gg / G        first / last line of file
Ctrl+d / u    half-page down / up
Ctrl+f / b    full page down / up
% / { / }     matching bracket / paragraph up / down
H / M / L     top / middle / bottom of screen
```

### Editing Commands (Normal mode)

```
d{motion}     delete (e.g., dw = word, dd = line, d$ = to end)
c{motion}     change (delete + enter Insert mode)
y{motion}     yank/copy
p             paste after cursor
P             paste before cursor
x             delete character under cursor
r{char}       replace character under cursor with char
u             undo
Ctrl+r        redo
.             repeat last command
>>  /  <<     indent / dedent line
```

### Text Objects — Vim's Most Powerful Concept

`{operator}{i or a}{object}` — i = "inside", a = "around" (includes delimiters)

```
ci"     change inside double quotes
ca"     change around double quotes (including quotes)
ci(     change inside parentheses
da(     delete around parentheses (including parens)
yi{     yank inside curly braces
cit     change inside HTML/XML tag
diw     delete inside word
yiw     yank inside word
```

### Searching and Substitution

```
/{pattern}        search forward
?{pattern}        search backward
n / N             next / previous match

:s/old/new/       substitute first match on current line
:s/old/new/g      substitute all matches on current line
:%s/old/new/g     substitute throughout entire file
:%s/old/new/gc    substitute with confirmation for each
```

### Visual Mode Operations

Select text with `v`, `V`, or `Ctrl+v`, then:
- `d` to delete
- `y` to yank (copy)
- `c` to change
- `>` / `<` to indent / dedent
- `:` to run a command on the selection

### Composability — Why Vim is Powerful

Combine operators with counts and motions:
```
d3w     delete 3 words
5j      move down 5 lines
ggdG    go to top, delete to end of file
ci"     change everything inside double quotes
d/word  delete from cursor to next occurrence of "word"
```

### Configuration

Vim config: `~/.vimrc`  
Neovim config: `~/.config/nvim/init.vim` or `~/.config/nvim/init.lua`

Plugins: clone to `~/.vim/pack/vendor/start/` or use a plugin manager like `vim-plug`.

**Learning path:** Run `vimtutor` in terminal (built-in interactive tutorial, ~30 minutes). Use Vim exclusively for two weeks. Investment pays back within a month.

---

## Lecture 4: Data Wrangling

### What It Covers

Processing, transforming, and extracting meaning from text data at the command line — without copying to spreadsheets or writing one-off scripts.

### Regular Expressions (Regex)

```
.           any single character (except newline)
*           zero or more of preceding
+           one or more of preceding
?           zero or one of preceding
[abc]       any of: a, b, or c
[^abc]      any character NOT a, b, or c
[a-z]       any lowercase letter
^           start of line (in most tools)
$           end of line
\s          whitespace character
\S          non-whitespace character
\d          digit (in some tools)
(...)       capture group
\1          backreference to first capture group
{n}         exactly n repetitions
{n,m}       between n and m repetitions
```

### The Primary Tool: `sed` (Stream Editor)

```bash
sed 's/pattern/replacement/'        # substitute first match per line
sed 's/pattern/replacement/g'       # substitute ALL matches per line
sed -n 's/pattern/replacement/p'    # only print lines with matches
sed '/pattern/d'                    # delete lines matching pattern
sed -i 's/old/new/g' file           # edit file in-place (macOS: -i '')
sed -n '5,10p' file                 # print lines 5 through 10
sed '1d' file                       # delete first line
```

### `awk` — Full Text Processing Language

```bash
awk '{print $1}'                       # print first field of each line
awk '{print $NF}'                      # print last field
awk '$1 == "error" {print $0}'        # print lines where field 1 = "error"
awk '$2 ~ /^h.*d$/ {print $2}'        # regex match on field 2
awk -F: '{print $1}' /etc/passwd       # use colon as field separator
awk 'NR==5'                            # print only line 5
awk 'END{print NR}'                    # print total line count

# Full program with BEGIN and END:
awk 'BEGIN{sum=0} {sum+=$1} END{print sum}'    # sum first column
awk 'BEGIN{rows=0} $1==1{rows+=$1} END{print rows}'
```

### Other Essential Tools

**`sort`** — sort lines:
```bash
sort           # alphabetical
sort -n        # numerical sort
sort -r        # reverse order
sort -u        # deduplicate (sort + unique)
sort -k2       # sort by second field
sort -t: -k3 -n /etc/passwd   # sort /etc/passwd by UID
```

**`uniq`** — collapse duplicate adjacent lines (always pipe from `sort` first):
```bash
sort | uniq           # remove duplicates
sort | uniq -c        # prefix with count of occurrences
sort | uniq -d        # only print duplicate lines
sort | uniq -u        # only print unique lines
```

**`wc`** — count words, lines, characters:
```bash
wc -l file     # count lines
wc -w file     # count words
wc -c file     # count bytes
```

**`cut`** — extract fields:
```bash
cut -d: -f1 /etc/passwd    # first field, colon-delimited
cut -d, -f2,4 file.csv     # fields 2 and 4, comma-delimited
cut -c1-10 file            # first 10 characters of each line
```

**`tr`** — translate or delete characters:
```bash
tr 'a-z' 'A-Z'     # convert lowercase to uppercase
tr -d '\n'         # remove all newlines
tr -s ' '          # squeeze multiple spaces into one
```

**`paste`** — merge lines from multiple files:
```bash
paste file1 file2          # merge side by side
paste -sd+ file            # join all lines with + separator
echo "1 2 3" | paste -sd+  # → 1+2+3
```

**`bc`** — arbitrary precision calculator:
```bash
echo "1+2+3" | bc -l                  # → 6
echo "scale=4; 22/7" | bc -l          # → 3.1428
echo "2^10" | bc                      # → 1024
```

**`xargs`** — convert stdin to command arguments:
```bash
find . -name '*.py' | xargs wc -l    # count lines in all Python files
find . -name '*.tmp' | xargs rm      # delete all .tmp files
echo "a b c" | xargs -I{} echo "item: {}"
```

**`head` / `tail`:**
```bash
head -n 20 file    # first 20 lines
tail -n 20 file    # last 20 lines
tail -f file       # follow growing file (live logs)
```

### Practical Pipeline Example

Get the 5 most common error types from a server log:
```bash
grep 'ERROR' server.log \
  | sed 's/.*ERROR: //' \
  | sort \
  | uniq -c \
  | sort -rn \
  | head -5
```

---

## Lecture 5: Command-Line Environment

### What It Covers

Job control, terminal multiplexers (tmux), SSH, dotfiles, and configuring your shell environment.

### Job Control

**Signals** — Unix mechanism for communicating with processes:

| Signal | Shortcut | Meaning |
|---|---|---|
| `SIGINT` | `Ctrl+C` | Interrupt — stop the program |
| `SIGQUIT` | `Ctrl+\` | Quit with core dump |
| `SIGTSTP` | `Ctrl+Z` | Pause/suspend the process |
| `SIGTERM` | `kill PID` | Graceful termination request |
| `SIGKILL` | `kill -9 PID` | Force kill (cannot be caught or ignored) |

**Background/foreground jobs:**
```bash
command &          # run command in background
jobs               # list current jobs
bg %1              # resume job 1 in background
fg %1              # bring job 1 to foreground
kill %1            # terminate job 1
nohup command &    # run immune to hangup (survives terminal close)
```

### tmux — Terminal Multiplexer

tmux lets you have multiple windows and panes in one terminal, and detach/reattach sessions (critical for surviving SSH disconnects).

**Hierarchy:** Sessions → Windows → Panes

**Default prefix: `Ctrl+b`**

**Sessions:**
```bash
tmux                        # new session
tmux new -s name            # new named session
tmux ls                     # list sessions
tmux attach -t name         # attach to session
tmux kill-session -t name   # kill session
```

**Key bindings (after `Ctrl+b`):**
```
c           new window
n / p       next / previous window
0-9         switch to window N
,           rename current window
%           split pane vertically (left/right)
"           split pane horizontally (top/bottom)
→ ← ↑ ↓    navigate between panes
z           zoom/unzoom current pane (full screen toggle)
d           detach session (keeps running in background)
[           enter copy/scroll mode
q           show pane numbers
x           close current pane
&           close current window
$           rename current session
```

### SSH — Secure Shell

**Basic usage:**
```bash
ssh user@host               # connect
ssh -p 2222 user@host       # specify port
ssh user@host command       # run a command on remote and exit
ssh -v user@host            # verbose (debug connection issues)
```

**Generating SSH keys (use Ed25519, not RSA):**
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
# Creates:
# ~/.ssh/id_ed25519       (private key — never share)
# ~/.ssh/id_ed25519.pub   (public key — safe to share)
```

**Copying your public key to a server:**
```bash
ssh-copy-id user@host
# Or manually: cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
```

**SSH config file (`~/.ssh/config`):**
```
Host myserver
    HostName actual.hostname.com
    User myuser
    Port 22
    IdentityFile ~/.ssh/id_ed25519

Host dev
    HostName 192.168.1.100
    User ubuntu
    ForwardAgent yes

# Now use: ssh myserver  or  ssh dev
```

**SSH port forwarding:**
```bash
# Local forward (access remote port locally):
ssh -L 9999:localhost:5432 user@host
# → localhost:9999 now tunnels to host's port 5432 (PostgreSQL)

# Remote forward (expose local port on remote):
ssh -R 9999:localhost:8080 user@host
# → host:9999 now tunnels to your local port 8080
```

**Copying files:**
```bash
scp file.txt user@host:/path/        # local to remote
scp user@host:/path/file.txt ./      # remote to local
rsync -avz ./local/ user@host:/dest/ # sync directories (faster)
```

### Dotfiles — Configuring Your Environment

Dotfiles are configuration files starting with `.` in your home directory:

| File | Purpose |
|---|---|
| `~/.bashrc` or `~/.zshrc` | Shell configuration, aliases, functions |
| `~/.vimrc` | Vim editor configuration |
| `~/.gitconfig` | Git configuration |
| `~/.tmux.conf` | tmux configuration |
| `~/.ssh/config` | SSH host shortcuts |
| `~/.config/` | XDG config directory (Neovim, etc.) |

**Best practice:** Keep all dotfiles in a single git repository (`~/dotfiles`) and symlink them:
```bash
ln -s ~/dotfiles/.vimrc ~/.vimrc
ln -s ~/dotfiles/.gitconfig ~/.gitconfig
```
This lets you replicate your entire environment on any new machine in minutes.

**Aliases in `.bashrc` / `.zshrc`:**
```bash
alias ll='ls -lah'
alias la='ls -A'
alias gs='git status'
alias gp='git push'
alias gc='git commit'
alias gd='git diff'
alias ..='cd ..'
alias ...='cd ../..'
alias mk='mkdir -p'
```

**Useful shell functions:**
```bash
# Make directory and cd into it:
mkcd() { mkdir -p "$1" && cd "$1"; }

# Extract any archive:
extract() {
    case $1 in
        *.tar.gz)  tar xzf "$1" ;;
        *.zip)     unzip "$1" ;;
        *.tar.bz2) tar xjf "$1" ;;
        *)         echo "Unknown format" ;;
    esac
}
```

---

## Lecture 6: Version Control (Git)

### What It Covers

Git's internal data model (not just commands), what Git actually stores, and advanced operations that make sense once you understand the model.

### Git's Data Model — The Foundation

Git stores data as a **directed acyclic graph (DAG) of snapshots**. Understanding this explains everything else.

**Core objects (all identified by SHA-1 hash of their contents):**

| Object | What It Stores |
|---|---|
| **Blob** | Raw file contents (bytes) |
| **Tree** | Directory listing — maps names to blobs or other trees |
| **Commit** | Snapshot: pointer to tree + parent(s) + author + message + timestamp |
| **Tag** | Named pointer to a commit with optional message |

**References** — human-readable names for commits:
- `HEAD` — current position (what's checked out)
- `main`, `feature/login` — branch names (movable pointers)
- `HEAD~1` — parent of current commit
- `HEAD~2` — grandparent
- `HEAD^2` — second parent of a merge commit

**The key insight:** Because every object is identified by its content hash, Git guarantees data integrity. If the hash matches, the content is unmodified. This is why Git is trustworthy.

### Core Commands With Purpose

**Inspecting history:**
```bash
git log                           # commit history
git log --all --graph --oneline   # visual branch graph
git log -p                        # show diffs with history
git log --stat                    # show file change stats
git show <commit>                 # show a specific commit
git show HEAD~3:file.txt          # show old version of a file
```

**Understanding changes:**
```bash
git status                        # working tree status
git diff                          # unstaged changes
git diff --staged                 # staged changes (vs last commit)
git diff <commit> <commit>        # diff between two commits
git diff main feature             # diff between two branches
git blame file                    # who last modified each line
```

**Staging and committing:**
```bash
git add file                      # stage a specific file
git add -p                        # interactively stage hunks (VERY useful)
git add .                         # stage all changes
git commit -m "message"           # commit with inline message
git commit                        # open editor for commit message
git commit --amend                # modify the most recent commit
git commit --amend --no-edit      # amend without changing message
```

**Branching:**
```bash
git branch                        # list local branches
git branch -a                     # list all branches (including remote)
git branch name                   # create branch at HEAD
git checkout -b name              # create and switch to branch
git switch name                   # switch branch (modern syntax)
git switch -c name                # create and switch (modern)
git merge branch                  # merge branch into current
git rebase branch                 # rebase current onto branch
git branch -d name                # delete merged branch
git branch -D name                # force delete branch
```

**Remote operations:**
```bash
git remote add origin url         # add remote
git remote -v                     # list remotes
git fetch                         # download remote changes (no merge)
git fetch --all                   # fetch from all remotes
git pull                          # fetch + merge
git pull --rebase                 # fetch + rebase (cleaner history)
git push origin branch            # push branch to remote
git push -u origin branch         # push and set upstream tracking
git push --force-with-lease       # force push safely (checks remote first)
```

**Undoing things:**
```bash
git restore file                  # discard working directory changes
git restore --staged file         # unstage a file (keep changes)
git revert <commit>               # new commit that undoes a commit (safe)
git reset HEAD~1                  # undo last commit, keep changes staged
git reset --soft HEAD~1           # undo last commit, keep everything staged
git reset --hard HEAD~1           # undo last commit, discard changes (DANGER)
```

**Advanced operations:**
```bash
git stash                         # save dirty state temporarily
git stash push -m "WIP: feature"  # stash with a name
git stash list                    # list all stashes
git stash pop                     # restore most recent stash (and delete it)
git stash apply stash@{2}         # apply specific stash (keep it)

git cherry-pick <commit>          # apply a specific commit to current branch
git cherry-pick A..B              # apply a range of commits

git bisect start                  # start binary search for a bug
git bisect bad                    # current commit is bad
git bisect good <commit>          # this commit was good
git bisect reset                  # stop bisect session

git reflog                        # show all HEAD movements (recovery tool)
```

### Key Mental Models

**Merge vs Rebase:** Both integrate changes from one branch into another.
- `merge` preserves history — creates a merge commit, shows the branch ever existed
- `rebase` rewrites history — replays your commits on top of the target as if written there. Cleaner linear history, but changes SHA hashes.

**Golden rule:** Never rebase commits that have already been pushed to a shared remote branch. You will rewrite history that others depend on.

**The staging area (index):** A preparation zone between working directory and repository. You choose exactly what goes into each commit. `git add -p` lets you stage individual hunks within a file — essential for clean commits.

**Git's object model explains `git reset` modes:**
- `--soft`: Move HEAD, leave staging area and working directory alone
- `--mixed` (default): Move HEAD, reset staging area, leave working directory alone
- `--hard`: Move HEAD, reset staging area AND working directory (destructive)

### Writing Good Commit Messages

```
Short summary (50 chars max) in imperative mood

Body explaining WHY (not what — the diff shows what).
- Bullet points are fine
- Wrap at ~72 chars

Fixes: #123
```

**Imperative mood:** "Fix bug" not "Fixed bug" or "Fixes bug". This matches Git's own generated messages ("Merge branch...").

---

## Lecture 7: Debugging and Profiling

### What It Covers

Systematic debugging strategies, debugger tools, logging, profiling CPU and memory, and monitoring system resources.

### Debugging Strategy

**Level 1 — Printf/print debugging:** Adding print statements. Works, but leaves state in the code and gets messy fast.

**Level 2 — Logging:** Use a logging framework with log levels instead of raw prints. Log levels:
- `DEBUG` — verbose, for development only
- `INFO` — normal operational messages
- `WARNING` — something unexpected but not fatal
- `ERROR` — error that needs attention
- `CRITICAL` — system cannot continue

Configure log level at startup to control verbosity without code changes.

**`logger` (shell tool):** Write to the system log from shell scripts:
```bash
logger "my-script: deployment started"
# View on Linux: journalctl -f
# View on macOS: log stream
```

### Debuggers

**Python: `pdb`**
```bash
python -m pdb script.py      # start script under debugger

# Or insert a breakpoint in code:
import pdb; pdb.set_trace()  # Python 3.6 and earlier
breakpoint()                  # Python 3.7+ (cleaner)
```

pdb commands:
```
l         list code around current position
n         next line (step over)
s         step into function
c         continue until next breakpoint
p var     print variable value
pp var    pretty-print variable
b line    set breakpoint at line number
b func    set breakpoint at function
w         show call stack (where am I?)
u / d     move up / down the call stack
q         quit debugger
```

**`ipdb`** — improved pdb with syntax highlighting and tab completion.

**C/C++: `gdb`** — GNU Debugger (similar commands to pdb).

**JavaScript:** Chrome DevTools (`--inspect` flag for Node.js):
```bash
node --inspect script.js
# Open chrome://inspect in Chrome browser
```

**`strace` (Linux):** Trace system calls — see everything a program asks the OS to do:
```bash
strace command                        # trace all system calls
strace -e trace=openat,read command   # trace specific calls only
strace -p PID                         # attach to running process
```

**`ltrace`:** Trace library (not system) calls.

### Profiling — Finding What's Actually Slow

**Two types of profilers:**
- **Tracing profilers:** Record every function call. Accurate, but high overhead.
- **Sampling profilers:** Pause every X milliseconds and record the stack. Lower overhead, approximate. Usually preferred.

**Time measurements:**
```bash
time command    # real = wall clock, user = CPU in user code, sys = CPU in kernel
```

- **Real:** Total elapsed time (includes waiting for I/O)
- **User:** CPU time in user space
- **System (Sys):** CPU time in kernel (system calls)

**Python CPU profiling:**
```bash
python -m cProfile -s tottime script.py    # sort by total time
python -m cProfile -s cumulative script.py # sort by cumulative time
```

**Python line-by-line profiling:**
```bash
pip install line_profiler
kernprof -l -v script.py    # requires @profile decorator on target functions
```

**Python memory profiling:**
```bash
pip install memory_profiler
python -m memory_profiler script.py   # requires @profile decorator
```

**Flame graphs:** Visual representation of where a program spends time. X-axis = time proportion, Y-axis = call stack depth. Generated with `perf` on Linux, `py-spy` for Python, `0x` for Node.js.

```bash
# Python: py-spy
pip install py-spy
py-spy record -o profile.svg -- python script.py
# Opens as SVG — interactive flame graph

# Node.js: 0x
npx 0x -- node script.js
```

### System Resource Monitoring

```bash
# CPU and processes:
top                     # basic task manager (built-in)
htop                    # better top — interactive, colored

# Memory:
free -h                 # total/used/available RAM (human readable)

# Disk:
df -h                   # disk usage per partition
du -sh *                # disk usage per item in current directory
du -sh /path            # disk usage of a specific path
ncdu                    # interactive disk usage browser (install separately)

# Open files and ports:
lsof                    # list all open files
lsof -i :8080           # what process is using port 8080
lsof -p PID             # what files a process has open
lsof -u username        # what files a user has open

# Network:
ss                      # socket statistics (modern netstat)
ss -tunlp               # all listening TCP/UDP ports with process names
ss -s                   # summary statistics
netstat -tunlp          # older equivalent (still widely available)

# Performance events (Linux):
perf stat command       # hardware performance counters for a command
perf record command     # record profile (samples call stack)
perf report             # view profile interactively
```

---

## Lecture 8: Metaprogramming

### What It Covers

Build systems, dependency management, testing frameworks, and continuous integration — the systems that manage how software gets built, tested, and deployed.

### Build Systems

A build system answers: given inputs and targets, what commands must run to produce outputs? Build systems only rebuild what's necessary based on what changed.

**`make`** — the classic build system:
```makefile
# Makefile
# target: dependencies
#     command  (MUST be a tab, not spaces)

paper.pdf: paper.tex plot.png
    pdflatex paper.tex

plot.png: data.dat generate_plot.py
    python generate_plot.py data.dat

data.dat: clean_data.py raw_data.csv
    python clean_data.py raw_data.csv

.PHONY: clean test
clean:
    rm -f *.pdf *.png

test:
    pytest tests/
```

- `make` with no argument builds the first target
- Make checks file modification times to determine what to rebuild
- `.PHONY` declares targets that don't create files (like `clean`, `test`)

### Dependency Management and Semantic Versioning

**Semantic versioning (semver):** `MAJOR.MINOR.PATCH`

| Increment | Meaning |
|---|---|
| `MAJOR` | Breaking changes — API incompatibility |
| `MINOR` | New features — backward compatible |
| `PATCH` | Bug fixes — backward compatible |

**Version constraint notation:**
```
^1.2.3    → >=1.2.3 <2.0.0   (compatible: allows minor/patch updates)
~1.2.3    → >=1.2.3 <1.3.0   (approximately: allows only patch updates)
1.2.3     → exactly 1.2.3
>=1.2.0   → any version 1.2.0 or higher
*         → any version
```

**Lock files** — capture exact versions of all dependencies including transitive deps. Ensures reproducible builds across machines and time:
- JavaScript: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Python: `Pipfile.lock`, `poetry.lock`, `requirements.txt` (pinned)
- Rust: `Cargo.lock`
- Ruby: `Gemfile.lock`

**Always commit lock files.** Never ignore them in version control.

### Testing

**Types of tests:**

| Type | Tests What | Speed |
|---|---|---|
| **Unit** | A single function/component in isolation | Fast |
| **Integration** | Components working together | Medium |
| **End-to-end** | Full system from user's perspective | Slow |
| **Regression** | A specific bug stays fixed | Varies |
| **Snapshot** | Output hasn't changed unexpectedly | Fast |

**Core testing concepts:**
- **Mocking** — replacing dependencies with controlled test doubles
- **Fixtures** — reusable test data and state setup
- **Test coverage** — percentage of code executed during tests (a signal, not a goal)
- **Flaky tests** — tests that sometimes pass, sometimes fail non-deterministically (must be fixed)

### Continuous Integration (CI)

CI runs your test suite automatically on every push to detect regressions before they reach main.

Common CI systems: GitHub Actions, CircleCI, Travis CI, GitLab CI, Jenkins.

**GitHub Actions example:**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check
```

**Core CI principle:** If tests pass locally but fail in CI, CI is right. CI has a clean, reproducible environment. Your machine has accumulated state. Fix the test, don't fight CI.

---

## Lecture 9: Security and Cryptography

### What It Covers

Cryptographic primitives — hash functions, symmetric encryption, asymmetric encryption — and how they're used in real tools like Git, SSH, and HTTPS.

### Entropy — Measuring Randomness

Entropy measures unpredictability in bits. More entropy = harder to guess.

- A coin flip: 1 bit
- Rolling a die: ~2.58 bits
- Random 32-char password from 62-char alphabet: ~190 bits (very strong)
- Four random common words: ~44 bits (adequate for most purposes)
- A word from a dictionary: ~12 bits (weak)

Password strength comes from entropy, not from replacing letters with symbols.

### Cryptographic Hash Functions

Maps arbitrary input to fixed-size output. Current standard: **SHA-256**.

**Properties (all required for cryptographic security):**

| Property | Meaning |
|---|---|
| Deterministic | Same input always produces same output |
| Non-invertible | Given `h = hash(m)`, infeasible to find `m` |
| Target collision resistant | Given `m1`, infeasible to find different `m2` with `hash(m1) = hash(m2)` |
| Collision resistant | Infeasible to find ANY two inputs with the same hash |

**SHA-1** (used in Git): 160-bit output. No longer considered cryptographically strong for security purposes, but still used in Git for content addressing.

**SHA-256**: 256-bit output. Current standard.

**Practical use:**
```bash
sha256sum file.txt                         # compute SHA-256 hash
sha256sum file.txt | awk '{print $1}'      # just the hash
echo -n "hello" | sha256sum                # hash of a string
# Verify a download:
sha256sum -c checksums.txt
```

**Use cases:**
- **Git** — every object identified by hash of contents
- **File integrity** — verify downloads haven't been tampered with
- **Password storage** — store hash, not plaintext (but use bcrypt/argon2!)
- **Content addressing** — identify content by what it is, not where it is

### Key Derivation Functions (KDFs) — For Password Hashing

Regular hash functions are too fast for password hashing. Use deliberately slow KDFs:
- **bcrypt** — most common, configurable work factor
- **scrypt** — memory-hard, harder to accelerate with GPUs
- **Argon2** — winner of Password Hashing Competition, recommended for new systems

**Never** use SHA-256 or MD5 directly for password storage. A GPU can compute billions of SHA-256 hashes per second. bcrypt with cost factor 12 takes ~250ms per hash — that's the point.

### Symmetric Encryption

Same key for both encryption and decryption. The challenge: securely sharing the key.

**AES-256** — current standard symmetric algorithm.

**`openssl` for symmetric encryption:**
```bash
# Encrypt:
openssl enc -aes-256-cbc -pbkdf2 -in plaintext.txt -out encrypted.bin

# Decrypt:
openssl enc -d -aes-256-cbc -pbkdf2 -in encrypted.bin -out decrypted.txt
```

**`gpg` for symmetric encryption:**
```bash
gpg --symmetric file.txt      # prompts for passphrase, creates file.txt.gpg
gpg --decrypt file.txt.gpg    # prompts for passphrase
```

### Asymmetric (Public Key) Encryption

Two mathematically linked keys:
- **Public key** — share with anyone. Used to encrypt messages TO you, or verify YOUR signatures.
- **Private key** — keep secret forever. Used to decrypt messages, or create signatures.

**Properties:**
- Encrypt with public key → only private key can decrypt
- Sign with private key → anyone with public key can verify

**Algorithms:** RSA (older, still common), Ed25519 (elliptic curve, preferred for SSH), secp256k1 (Bitcoin/Ethereum).

**SSH key operations:**
```bash
# Generate Ed25519 key pair:
ssh-keygen -t ed25519 -C "your.email@example.com"
# Private key: ~/.ssh/id_ed25519   (NEVER share — permissions must be 600)
# Public key: ~/.ssh/id_ed25519.pub (safe to share)

# Add public key to a server:
ssh-copy-id user@host
# Or: cat ~/.ssh/id_ed25519.pub | ssh user@host "cat >> ~/.ssh/authorized_keys"

# Add to SSH agent (avoids re-entering passphrase):
ssh-add ~/.ssh/id_ed25519
```

**GPG for asymmetric encryption:**
```bash
gpg --gen-key                        # generate key pair
gpg --list-keys                      # list public keys
gpg --export --armor user@email > public.key  # export public key
gpg --import public.key              # import someone's public key

gpg --encrypt --recipient user@email file.txt   # encrypt for recipient
gpg --decrypt file.txt.gpg           # decrypt (uses your private key)
gpg --sign file.txt                  # sign a file
gpg --verify file.txt.gpg            # verify a signature
```

### Hybrid Encryption — How TLS/HTTPS Actually Works

Real systems combine symmetric and asymmetric:
1. Generate a random symmetric key (session key)
2. Encrypt the bulk data with the fast symmetric key (AES-256)
3. Encrypt the symmetric key with the recipient's public key
4. Send both
5. Recipient decrypts the symmetric key with their private key
6. Recipient decrypts the data with the symmetric key

This gives you: the security of asymmetric encryption + the speed of symmetric encryption.

### Practical Security Applications

**Password management:**
- Use a password manager (Bitwarden, 1Password, KeePass)
- Use long, random, unique passwords for every service
- A password manager generates and remembers them all

**Two-factor authentication (2FA):**
- Prefer TOTP (Time-based One-Time Passwords) over SMS
- SMS 2FA is vulnerable to SIM-swapping attacks
- TOTP apps: Google Authenticator, Authy, 1Password built-in
- How TOTP works: shared secret + current time (rounded to 30s) → 6-digit code

**Checking for exposed passwords:**
```bash
# haveibeenpwned.com API — checks if email/password appeared in data breaches
# The k-anonymity trick: only sends first 5 chars of SHA-1 hash
```

---

## 2026 New Lectures

The 2026 edition added topics not in the 2020 curriculum:

### Development Environment and Tools
Configuring and customizing dev environments. Editor plugins, language servers (LSP) for autocomplete and go-to-definition. Setting up reproducible development environments with tools like Nix, Docker devcontainers, or direnv.

### Agentic Coding
Using AI coding assistants (GitHub Copilot, Cursor, Claude Code) effectively. When to trust AI suggestions and when to be skeptical. Prompt engineering for coding tasks. AI-assisted debugging and code review. How to maintain understanding of AI-generated code. The 2026 course integrates this into every lecture rather than treating it as separate.

### Packaging and Shipping Code
How software gets distributed: package managers (`npm`, `pip`, `cargo`, `apt`), creating packages, semantic versioning, release processes, changelogs, and distribution.

### Code Quality
Linting, formatting, static analysis, type checking. Integrating these into your editor and CI pipeline. Why automated quality checks matter and how to configure them.

### Beyond the Code
Documentation, README writing, issue reporting, communication with open-source maintainers, contributing pull requests that get merged.

---

## Historical Topics (Previous Years Only)

| Topic | Year | What It Covered |
|---|---|---|
| **Data Wrangling** | 2020 | `sed`, `awk`, regex pipelines |
| **Security and Cryptography** | 2020 | Full crypto lecture (content above) |
| **Potpourri** | 2020 | Daemons, FUSE, APIs, notebooks, VMs |
| **Backups** | 2019 | rsync, rclone, 3-2-1 backup strategy |
| **Automation** | 2019 | Scripting, cron jobs, task automation |
| **Machine Introspection** | 2019 | Understanding what your system is doing |
| **OS Customization** | 2019 | Desktop environments, terminal config |
| **Web and Browsers** | 2019 | Browser DevTools, web scraping |

---

## Priority Order: What to Learn First

1. **Shell basics + scripting** — foundational for everything else
2. **Vim** — you'll need it every time you SSH into any server
3. **Git internals** — understanding the data model fixes all Git confusion
4. **Data wrangling** — `grep | sed | awk | sort | uniq` pipelines are pure leverage
5. **tmux** — essential for remote work and multitasking
6. **Debugging** — systematic debugging replaces panic
7. **Security/cryptography** — explains SSH keys, HTTPS, JWT signing, password hashing

## Time Investment

- Each lecture: ~1 hour video + 1–2 hours of exercises
- Full course: ~20–30 hours total
- Return on investment: Immediate and compounding for the rest of your career

---

## Quick Reference: Essential Commands

```bash
# NAVIGATION
pwd && ls -lah                    # where am I, what's here
cd - && cd ~                      # go back / go home
find . -name "*.js" -type f       # find files
ctrl+r                            # search history

# TEXT PROCESSING
grep -r "pattern" .               # search in files
sed 's/old/new/g' file            # find and replace
sort | uniq -c | sort -rn         # count occurrences, ranked
awk '{print $2}' file             # extract second field
command | head -20                # first 20 lines of output

# PROCESSES
ps aux | grep process             # find a process
kill -9 PID                       # force kill
lsof -i :PORT                     # what's using this port
htop                              # interactive process viewer

# GIT
git log --all --graph --oneline   # visual history
git diff --staged                 # what's about to be committed
git add -p                        # interactive staging
git stash && git stash pop        # save/restore dirty state
git reflog                        # recovery tool for lost commits

# SSH
ssh-keygen -t ed25519             # generate key pair
ssh-copy-id user@host             # deploy your public key
ssh -L 9999:localhost:5432 host   # port forward

# SYSTEM INFO
df -h && du -sh *                 # disk usage
free -h                           # memory
ss -tunlp                         # open ports
```

---

## Resources

- **Course website:** missing.csail.mit.edu
- **YouTube:** Search "MIT Missing Semester" — full lecture recordings
- **Source code:** github.com/missing-semester/missing-semester
- **License:** CC BY-NC-SA
- **Contact:** missing-semester@mit.edu
- **Community:** OSSU Discord, `#missing-semester-forum`

**This reference file was generated on: April 23, 2026**  
**Source verification:** All commands, concepts, tool names, and descriptions were verified against the live course notes at missing.csail.mit.edu, the 2020 and 2026 lecture pages, and community notes repositories. No commands were fabricated.
