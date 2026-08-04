---
title: 【开发工具】Linux 文本处理常用命令
tags:
  - Linux
  - 命令行工具
categories:
  - 开发工具
comments: true
toc: true
toc_number: false
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 13dcfb97
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-08-03 09:19:35
updated: 2026-08-04 09:29:39
---
awk、grep、sed 是 Linux 操作文本的三大利器，合称“文本三剑客”，也是必须掌握的 Linux 命令之一。三者的功能都是处理文本，但侧重点各不相同，其中属 awk 功能最强大，但也最复杂。三者定位如下：

|  命令  |    定位    |          核心能力           |
| :--: | :------: | :---------------------: |
| grep | 数据查找与定位  |   基于正则表达式搜索文本，打印匹配的行    |
| sed  | 数据编辑与修改  | 流式编辑文本，支持替换、删除、插入、追加等操作 |
| awk  | 数据切片与格式化 |  按字段处理文本，适合格式化、筛选和汇总数据  |

> 简单概括：**grep 用于查找，sed 用于编辑，awk 用于格式化**。

## 一、grep —— 文本搜索工具

### 1 命令概述

grep（Global Regular Expression Print，全局正则表达式打印）是一种强大的文本搜索工具，它能使用正则表达式搜索文本，并把匹配的行打印出来。grep 的基本格式为：

```bash
grep [选项] '模式' [文件]
```

grep 的返回值可用于 Shell 脚本的自动化控制：
- 搜索成功返回 0
- 搜索不成功返回 1
- 搜索的文件不存在返回 2

即便不熟悉这个命令，大多数用户也用过查询进程的命令：

```bash
ps -ef | grep xxxx
```

### 2 常用选项

|    选项     |               功能描述                |                    示例                    |
| :-------: | :-------------------------------: | :--------------------------------------: |
|   `-i`    |               忽略大小写               |        `grep -i "error" log.txt`         |
|   `-v`    |           反向匹配，显示不匹配的行            |        `grep -v "DEBUG" app.log`         |
|   `-n`    |             显示匹配行的行号              |        `grep -n "error" log.txt`         |
|   `-c`    |             仅输出匹配的行数              |        `grep -c "error" log.txt`         |
|   `-w`    |              匹配整个单词               |       `grep -w "user" /etc/passwd`       |
|   `-o`    |            仅显示匹配到的字符串             |       `grep -o "[0-9]\+" data.txt`       |
|   `-r`    |              递归搜索子目录              |      `grep -r "TODO" /home/project`      |
|   `-l`    |           仅显示包含匹配内容的文件名           |         `grep -l "error" *.log`          |
|   `-q`    |           静默模式，不输出任何信息            | `grep -q "pattern" file && echo "found"` |
|   `-s`    |              不显示错误信息              |      `grep -s "pattern" /nonexist`       |
|   `-e`    |            指定多个模式（逻辑或）            |  `grep -e "error" -e "warning" log.txt`  |
|   `-E`    |             使用扩展正则表达式             |    `grep -E "error\|warning" log.txt`    |
|   `-F`    |            将模式视为固定字符串             |         `grep -F "aa*" file.txt`         |
|   `-f`    |              从文件读取模式              |     `grep -f patterns.txt file.txt`      |
|  `-A n`   |           显示匹配行及其后 n 行            |        `grep -A2 "error" log.txt`        |
|  `-B n`   |           显示匹配行及其前 n 行            |        `grep -B2 "error" log.txt`        |
|  `-C n`   |          显示匹配行及其前后各 n 行           |        `grep -C2 "error" log.txt`        |
|   `-a`    |           将二进制文件当作文本处理            |      `grep -a "pattern" binary.dat`      |
|   `-b`    |          在输出的每行前显示字节偏移量           |        `grep -b "error" log.txt`         |
|   `-d`    | 指定目录处理方式（`read`、`recurse`、`skip`） |     `grep -d recurse "pattern" dir/`     |
|   `-h`    |           搜索多文件时不显示文件名            |         `grep -h "error" *.log`          |
|   `-H`    |         搜索多文件时始终显示文件名（默认）         |         `grep -H "error" *.log`          |
|   `-I`    |           忽略二进制文件（不搜索）            |          `grep -I "pattern" *`           |
|   `-L`    |          仅显示不包含匹配内容的文件名           |         `grep -L "error" *.log`          |
|  `-m n`   |           最多匹配 n 行后停止读取           |       `grep -m 5 "error" log.txt`        |
|   `-x`    |         整行匹配（整行内容完全等于模式）          |     `grep -x "EXACT LINE" file.txt`      |
|   `-R`    |          同 `-r`，但会跟随符号链接          |        `grep -R "pattern" /path`         |
| `--color` |            高亮显示匹配的字符串             |   `grep --color=auto "error" log.txt`    |

### 3 示例

准备测试文件 `test.txt`，内容如下：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
This is a linux testfile!
Linux test
This is LinuxSystem
```

**（1）基本搜索**

```bash
grep "Linux" test.txt
```

输出：

```text
Linux is a free unix-type operating system.
Linux test
This is LinuxSystem
```

**（2）-i：忽略大小写**

```bash
grep -i "linux" test.txt
```

输出所有包含 "linux"（不区分大小写）的行：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
This is a linux testfile!
Linux test
This is LinuxSystem
```

**（3）-n：显示行号**

```bash
grep -n "Linux" test.txt
```

输出：

```text
2:Linux is a free unix-type operating system.
4:Linux test
5:This is LinuxSystem
```

**（4）-v：反向匹配**

```bash
grep -v "Linux" test.txt
```

输出不包含 "Linux" 的行：

```text
HELLO LINUX!
This is a linux testfile!
```

**（5）-c：统计匹配行数**

```bash
grep -c "Linux" test.txt
```

输出：`3`

**（6）-w：匹配整个单词**

```bash
grep -w "Linux" test.txt
```

只匹配作为独立单词的 "Linux"，不匹配 "Linux" 作为子串的情况：

```text
Linux is a free unix-type operating system.
Linux test
```

**（7）-o：仅显示匹配内容**

```bash
grep -o "Linux" test.txt
```

输出每个匹配到的 "Linux"，每行一个：

```text
Linux
Linux
Linux
```

**（8）-e：多个模式（逻辑或）**

```bash
grep -e "Linux" -e "free" test.txt
```

输出包含 "Linux" 或 "free" 的行：

```text
Linux is a free unix-type operating system.
Linux test
This is LinuxSystem
```

**（9）-A/-B/-C：显示上下文**

```bash
grep -A2 "free" test.txt
```

显示匹配行及其后 2 行（`-B2` 显示前 2 行，`-C2` 显示前后各 2 行）：

```text
Linux is a free unix-type operating system.
This is a linux testfile!
Linux test
```

**（10）-r：递归搜索**

```bash
grep -r "pattern" /path/to/dir
```

在指定目录及其子目录中递归搜索。

**（11）-a：处理二进制文件**

```bash
grep -a "error" binary.log   # 将二进制文件当文本读取
```

输出（假设 `binary.log` 中包含文本 `error`）：

```text
... error ...   # 将二进制中的可读文本按行输出
```

**（12）-b：显示字节偏移**

```bash
grep -b "Linux" test.txt
```

输出（偏移量根据文件实际计算，此处为示例）：

```text
13:Linux is a free unix-type operating system.
83:Linux test
94:This is LinuxSystem
```

**（13）-L：显示不包含匹配内容的文件**

```bash
grep -L "Linux" *.txt   # 列出所有不含 "Linux" 的 .txt 文件
```

输出（假设当前目录有 `a.txt` 不含 "Linux"）：

```text
a.txt
```

**（14）-m：限制匹配行数**

```bash
grep -m 2 "Linux" test.txt   # 最多匹配2行后停止
```

输出（只输出前两个匹配行）：

```text
Linux is a free unix-type operating system.
Linux test
```

**（15）-x：整行匹配**

```bash
grep -x "Linux test" test.txt   # 仅匹配整行内容完全相同的行
```

输出：

```text
Linux test
```

## 二、sed —— 流编辑器

### 1 命令概述

sed（Stream Editor，流编辑器）是一个非交互式的流编辑器，它逐行读取文本，根据预设的规则对每行进行处理，并将结果输出到标准输出。sed 默认不修改原始文件，如需直接修改文件可使用 `-i` 选项。

sed 的基本格式为：

```bash
sed [选项] '模式 动作' [文件]
```

|    选项    |       功能描述        |                 示例                 |
| :------: | :---------------: | :--------------------------------: |
|   `-n`   | 关闭默认输出，仅打印显式指定的内容 |        `sed -n '1,5p' file`        |
| `-i[后缀]` | 原地编辑文件，可指定后缀生成备份  |  `sed -i.bak 's/old/new/g' file`   |
|   `-E`   |     使用扩展正则表达式     |   `sed -E 's/[0-9]+/NUM/g' file`   |
|   `-e`   |      执行多个脚本       | `sed -e 's/a/b/' -e 's/c/d/' file` |
|   `-f`   |      从文件读取脚本      |      `sed -f script.sed file`      |

sed 的动作命令（基础）：

| 命令  |        功能         |               示例                |
| :-: | :---------------: | :-----------------------------: |
| `a` |     在当前行之后追加      |     `sed '3a\newline' file`     |
| `i` |     在当前行之前插入      |     `sed '3i\newline' file`     |
| `d` |       删除指定行       |        `sed '2,4d' file`        |
| `c` |       替换整行        | `sed '/pattern/c\newline' file` |
| `p` | 打印指定行（常与 `-n` 配合） |      `sed -n '1,5p' file`       |
| `s` |       替换字符串       |    `sed 's/old/new/g' file`     |

附加动作命令：

| 命令  |       功能       |                 示例                 |
| :-: | :------------: | :--------------------------------: |
| `y` |   字符转换（一一对应）   |      `sed 'y/abc/ABC/' file`       |
| `=` |  打印当前行号（另起一行）  |      `sed -n '/error/=' log`       |
| `q` | 退出 sed（可指定退出码） |   `sed '10q' file`  # 打印前10行后退出    |
| `r` |   读取文件内容并插入    |  `sed '/pattern/r data.txt' file`  |
| `w` |    将匹配行写入文件    | `sed '/pattern/w output.txt' file` |
| `!` |   对不匹配的行执行动作   |      `sed '/pattern/!d' file`      |

### 2 示例

沿用测试文件 `test.txt`：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
This is a linux testfile!
Linux test
```

**（1）追加（a）：在指定行后添加内容**

在第三行后追加 "newline"：

```bash
sed '3a\newline' test.txt
```

输出：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
This is a linux testfile!
newline
Linux test
This is LinuxSystem
```

在匹配 "Linux" 的行后追加：

```bash
sed '/Linux/a\newline' test.txt
```

输出：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
newline
This is a linux testfile!
Linux test
newline
This is LinuxSystem
newline
```

**（2）插入（i）：在指定行前插入内容**

在第三行前插入 "newline"：

```bash
sed '3i\newline' test.txt
```

输出：

 ```text
HELLO LINUX!
Linux is a free unix-type operating system.
newline
This is a linux testfile!
Linux test
This is LinuxSystem
 ```

**（3）删除（d）：删除匹配的行**

删除所有包含 "Linux" 的行：

```bash
sed '/Linux/d' test.txt
```

输出：

```text
HELLO LINUX!
This is a linux testfile!
```

删除第 2 到第 4 行：

```bash
sed '2,4d' test.txt
```

输出：

```text
HELLO LINUX!
This is LinuxSystem
```

**（4）替换（c）：整行替换**

将包含 "Linux" 的行替换为 "Windows"：

```bash
sed '/Linux/c\Windows' test.txt
```

输出：

```text
HELLO LINUX!
Windows
This is a linux testfile!
Windows
Windows
```

**（5）替换（s）：字符串替换**

将 "Linux" 替换为 "Windows"：

```bash
sed 's/Linux/Windows/g' test.txt
```

输出：

```text
HELLO LINUX!
Windows is a free unix-type operating system.
This is a linux testfile!
Windows test
This is WindowsSystem
```

`/g` 表示全局替换，即替换行内所有匹配项。不加 `g` 则只替换每行第一个匹配项。

**（6）行首和行尾添加内容**

在每行行首添加 "###"：

```bash
sed 's/^/###/g' test.txt
```

输出：

```text
###HELLO LINUX!
###Linux is a free unix-type operating system.
###This is a linux testfile!
###Linux test
###This is LinuxSystem
```

在每行行尾添加 "---"：

```bash
sed 's/$/---/g' test.txt
```

输出：

```text
HELLO LINUX!---
Linux is a free unix-type operating system.---
This is a linux testfile!---
Linux test---
This is LinuxSystem---
```

**（7）指定行范围操作**

对第 1 到第 2 行执行操作：

```bash
sed '1,2a\newline' test.txt
```

输出：

```text
HELLO LINUX!
newline
Linux is a free unix-type operating system.
newline
This is a linux testfile!
Linux test
This is LinuxSystem
```

**（8）多个编辑（-e）**

依次执行两个替换：

```bash
sed -e 's/Linux/Windows/g' -e 's/Windows/Mac/g' test.txt
```

输出：

```text
HELLO LINUX!
Mac is a free unix-type operating system.
This is a linux testfile!
Mac test
This is MacSystem
```

**（9）直接修改文件（-i）**

```bash
sed -i.bak 's/Linux/Windows/g' test.txt
```

直接修改文件，并生成 `.bak` 备份文件。

**（10）字符转换（y）**

```bash
sed 'y/abc/ABC/' test.txt   # 将 a→A, b→B, c→C
```

输出（仅替换小写 a,b,c）：

```text
HELLO LINUX!
Linux is A free unix-type operAting system.
This is A linux testfile!
Linux test
This is LinuxSystem
```

**（11）打印行号（=）**

```bash
sed -n '/Linux/=' test.txt   # 显示包含 "Linux" 的行号
```

输出：

```text
2
4
5
```

**（12）退出（q）**

```bash
sed '3q' test.txt   # 打印前3行后退出
```

输出：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
This is a linux testfile!
```

**（13）读取文件（r）**
假设存在 `insert.txt` 内容为 `INSERTED TEXT`。

```bash
sed '/Linux/r insert.txt' test.txt   # 在匹配 "Linux" 的行后插入 insert.txt 内容
```

输出：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
INSERTED TEXT
This is a linux testfile!
Linux test
INSERTED TEXT
This is LinuxSystem
INSERTED TEXT
```

**（14）写入文件（w）**

```bash
sed '/Linux/w output.txt' test.txt   # 将包含 "Linux" 的行写入 output.txt
```

该命令无标准输出，但会创建 `output.txt`，内容为：

```text
Linux is a free unix-type operating system.
Linux test
This is LinuxSystem
```

## 三、awk —— 文本分析与格式化工具

### 1 命令概述

awk 是一个强大的文本分析工具，其名字来源于创始人 Alfred Aho、Peter Weinberger 和 Brian Kernighan 的姓氏首字母。awk 把文件逐行读入，以指定的分隔符将每行切片，切开的部分再进行各种分析处理。与 grep 和 sed 主要处理文本行不同，awk 允许按照字段来处理文本，非常适合格式化、筛选和汇总数据。

awk 的基本格式为：

```bash
awk [选项参数] '脚本' [文件]
```

或：

```bash
awk [选项参数] -f 脚本文件 [文件]
```

### 2 常用选项

|       选项        |      功能描述      |                   示例                    |
| :-------------: | :------------: | :-------------------------------------: |
|     `-F fs`     |   指定输入字段分隔符    |   `awk -F: '{print $1}' /etc/passwd`    |
| `-v var=value`  |    定义变量并赋值     | `awk -v num=10 '{print $1 + num}' file` |
| `-f scriptfile` | 从脚本文件读取 awk 命令 |        `awk -f script.awk file`         |

### 3 内置变量

|     变量      |        描述        |                  示例                  |
| :---------: | :--------------: | :----------------------------------: |
|    `$0`     |       整行内容       |       `awk '{print $0}' file`        |
| `$1` ~ `$n` | 当前行的第 1 到第 n 个字段 |      `awk '{print $1,$3}' file`      |
|    `NF`     |   当前行的字段个数（列数）   |       `awk '{print $NF}' file`       |
|    `NR`     | 当前处理的行号（从 1 开始）  |      `awk '{print NR,$0}' file`      |
|    `FNR`    |    各文件分别计数的行号    |  `awk '{print FNR,$0}' file1 file2`  |
| `FILENAME`  |      当前文件名       |   `awk '{print FILENAME,$0}' file`   |
|    `FS`     |  输入字段分隔符，默认为空格   |     `awk -F: '{print $1}' file`      |
|    `OFS`    |  输出字段分隔符，默认为空格   | `awk -v OFS=, '{print $1,$2}' file`  |
|    `RS`     |  输入记录分隔符，默认为换行符  |    `awk -v RS='' '{print}' file`     |
|    `ORS`    |  输出记录分隔符，默认为换行符  |  `awk -v ORS='---' '{print}' file`   |
|   `ARGC`    |     命令行参数个数      |      `awk '{print ARGC}' file`       |
|   `ARGV`    | 命令行参数数组（下标从0开始）  |  `awk 'BEGIN{print ARGV[1]}' file`   |
|  `ENVIRON`  |      环境变量数组      | `awk 'BEGIN{print ENVIRON["HOME"]}'` |

### 4 内置函数

|          函数           |              描述               |                          示例                          |
| :-------------------: | :---------------------------: | :--------------------------------------------------: |
|     `length([s])`     |      返回字符串长度，缺省时返回当前行长度       |           `awk '{print length($0)}' file`            |
|  `substr(s, i, [n])`  |    截取字符串 s 从 i 开始长度为 n 的子串    |         `awk '{print substr($1,1,3)}' file`          |
| `split(s, a, [sep])`  | 按分隔符 sep 拆分字符串 s 到数组 a，返回元素个数 |     `awk '{split($0, arr, ":"); print arr[2]}'`      |
|   `gsub(r, s, [t])`   | 在目标 t 中全局替换 r 为 s（无 t 则默认 $0） |            `awk 'gsub(/old/,"new")' file`            |
|   `sub(r, s, [t])`    |           替换第一个匹配项            |          `awk 'sub(/old/,"new", $1)' file`           |
|     `index(s, t)`     |     返回子串 t 在 s 中的位置（从1开始）     |       `awk '{print index($0, "Linux")}' file`        |
|     `match(s, r)`     |        匹配正则 r，返回匹配位置或0        | `awk '{match($0, /[0-9]+/); print RSTART, RLENGTH}'` |
|     `tolower(s)`      |             转换为小写             |           `awk '{print tolower($0)}' file`           |
|     `toupper(s)`      |             转换为大写             |           `awk '{print toupper($0)}' file`           |
| `sprintf(fmt, expr)`  |       格式化输出（类似 printf）        |            `awk '{sprintf("%03d", $1)}'`             |
|       `int(x)`        |              取整               |               `awk '{print int($1)}'`                |
| `rand()`  / `srand()` |          随机数生成与种子设置           |         `awk 'BEGIN{srand(); print rand()}'`         |

### 5 条件与循环语句

awk 支持 C 风格的流程控制，可在脚本中使用：

- **if-else**：`if (条件) {动作} else {动作}`
- **for**：`for (初始化; 条件; 递增) {动作}` 或 `for (变量 in 数组) {动作}`
- **while**：`while (条件) {动作}`
- **do-while**：`do {动作} while (条件)`
- **break / continue**：循环控制
- **next**：跳过当前记录，继续下一条
- **exit**：退出 awk 程序

### 6 示例

准备测试文件 `test.txt`：

```text
2 this is a test
3 Are you like awk
This's a test
10 There are orange,apple,mongo
```

**（1）基本打印**

打印每行的第 1 和第 4 个字段：

```bash
awk '{print $1,$4}' test.txt
```

输出：

```text
2 a
3 like
This's
10 orange,apple,mongo
```

`$0` 表示整行。

**（2）-F：指定分隔符**

以逗号作为分隔符，打印第 2 个字段：

```bash
awk -F, '{print $2}' test.txt
```

输出：

```text



apple
```

**（3）多个分隔符**

同时使用空格和逗号作为分隔符：

```bash
awk -F '[ ,]' '{print $1,$2,$5}' test.txt
```

输出：

```text
2 this test
3 Are awk
This's a 
10 There apple
```

**（4）模式匹配**

匹配以 "This" 开头的行：

```bash
awk '/^This/' test.txt
```

输出：

```text
This's a test
```

**（5）反向匹配**

不包含 "is" 的行：

```bash
awk '$0 !~ /is/' test.txt
```

输出：

```text
3 Are you like awk
10 There are orange,apple,mongo
```

**（6）$NF：打印最后一个字段**

```bash
awk '{print $NF}' test.txt
```

输出每行的最后一个字段：

```text
test
awk
test
orange,apple,mongo
```

**（7）条件过滤**

打印第二个字段大于 "t" 的行：

```bash
awk '{if ($2 > "t") print $1}' test.txt
```

输出：

```text
2
```

**（8）BEGIN 和 END**

在所有行处理前和处理后执行操作：

```bash
awk 'BEGIN {print "Start"} {print $0} END {print "End"}' test.txt
```

输出：

```text
Start
2 this is a test
3 Are you like awk
This's a test
10 There are orange,apple,mongo
End
```

**（9）统计与汇总**

统计每行字符数：

```bash
awk '{print length($0)}' test.txt
```

输出：

```text
16
18
13
31
```

**（10）从文件读取脚本**

```bash
awk -f script.awk test.txt
```

将 awk 命令写入 `script.awk` 文件后执行。

**（11）if-else 示例**

```bash
awk '{if ($1 > 5) print $0 " is large"; else print $0 " is small"}' test.txt
```

输出：

```text
2 this is a test is small
3 Are you like awk is small
This's a test is small
10 There are orange,apple,mongo is large
```

**（12）for 循环示例**

```bash
awk '{for (i=1; i<=NF; i++) printf "%s ", $i; printf "\n"}' test.txt
```

输出（原样输出每行，但末尾可能有空格，此处为示意）：

```text
2 this is a test 
3 Are you like awk 
This's a test 
10 There are orange,apple,mongo 
```

**（13）while 循环示例**

```bash
awk '{i=1; while(i<=NF) {print $i; i++}}' test.txt
```

输出（每个字段单独一行）：

```text
2
this
is
a
test
3
Are
you
like
awk
This's
a
test
10
There
are
orange,apple,mongo
```

**（14）数组与统计（统计每个字段出现次数）**

```bash
awk '{for(i=1;i<=NF;i++) count[$i]++} END{for(k in count) print k, count[k]}' test.txt
```

输出（顺序不定）：

```text
2 1
this 1
is 1
a 2
test 2
3 1
Are 1
you 1
like 1
awk 1
This's 1
10 1
There 1
are 1
orange,apple,mongo 1
```

**（15）next 跳过记录**

```bash
awk '{if ($1 == 2) next; print $0}' test.txt   # 跳过第一字段为2的行
```

输出：

```text
3 Are you like awk
This's a test
10 There are orange,apple,mongo
```

**（16）使用内置函数**

```bash
awk '{print toupper($0)}' test.txt          # 转大写
```

输出：

```text
2 THIS IS A TEST
3 ARE YOU LIKE AWK
THIS'S A TEST
10 THERE ARE ORANGE,APPLE,MONGO
```

```bash
awk '{print substr($1,1,2)}' test.txt      # 取第一字段前2字符
```

输出：

```text
2
3
Th
10
```

```bash
awk '{split($0, arr, ","); print arr[1]}' test.txt  # 按逗号拆分，打印第一部分
```

输出：

```text
2 this is a test
3 Are you like awk
This's a test
10 There are orange
```


## 四、三剑客的组合使用

在实际工作中，三剑客经常组合使用。

**示例 1：从日志中提取错误信息并统计**

```bash
grep "ERROR" app.log | awk '{print $1,$3}' | sort | uniq -c
```

先用 grep 筛选错误行，再用 awk 提取特定字段，最后用 sort 和 uniq 统计。

**示例 2：批量修改配置文件**

```bash
grep -l "old_host" *.conf | xargs sed -i 's/old_host/new_host/g'
```

先用 grep 找出包含目标字符串的文件，再用 sed 批量替换。

**示例 3：数据格式化**

```bash
awk '{print $1,$3}' data.txt | sed 's/^/Record: /'
```

先用 awk 提取字段，再用 sed 添加前缀。

**示例 4：使用 awk 和 sed 联合处理 CSV**

```bash
awk -F, '{print $2,$3}' data.csv | sed 's/^/Name: /; s/$/ /'   # 提取并加前缀
```

假设 `data.csv` 内容为：

```text
id,name,age
1,Alice,30
2,Bob,25
```

输出：

```text
Name: Alice 30 
Name: Bob 25 
```

## 五、补充——正则表达式基础

正则表达式是文本处理的核心，grep、sed、awk 均支持。下表列出常用元字符和 POSIX 字符类：

### 1 常用元字符

|   元字符   |           含义           |
| :-----: | :--------------------: |
|   `.`   |     匹配任意单个字符（除换行符）     |
|   `^`   |         匹配行的开头         |
|   `$`   |         匹配行的结尾         |
|  `[ ]`  |       匹配括号内的任意字符       |
| `[^ ]`  |      匹配不在括号内的任意字符      |
|   `*`   |   匹配前面的字符 0 次或多次（贪婪）   |
|   `+`   |  匹配前面的字符 1 次或多次（扩展正则）  |
|   `?`   | 匹配前面的字符 0 次或 1 次（扩展正则） |
|  `{n}`  |  匹配前面的字符恰好 n 次（扩展正则）   |
| `{n,}`  |  匹配前面的字符至少 n 次（扩展正则）   |
| `{n,m}` | 匹配前面的字符 n 到 m 次（扩展正则）  |
|  `\|`   |       逻辑或（扩展正则）        |
|  `( )`  |        分组（扩展正则）        |
|   `\`   |    转义字符，使元字符失去特殊含义     |

### 2 POSIX 字符类

> 这些字符类在 `grep -E` 或 `awk` 中可用，需使用 `[[:xxx:]]` 形式（如 `[[:alnum:]]`）。

|      字符类       |                等效描述                 |
| :------------: | :---------------------------------: |
| `[[:alnum:]]`  |        字母和数字（`[0-9a-zA-Z]`）         |
| `[[:alpha:]]`  |           字母（`[a-zA-Z]`）            |
| `[[:upper:]]`  |            大写字母（`[A-Z]`）            |
| `[[:lower:]]`  |            小写字母（`[a-z]`）            |
| `[[:blank:]]`  |            空白字符（空格和制表符）             |
| `[[:space:]]`  | 水平和垂直的空白字符（比 `blank` 范围更广，包括换行、回车等） |
| `[[:cntrl:]]`  |        不可打印的控制字符（退格、删除、警铃等）         |
| `[[:digit:]]`  |           十进制数字（`[0-9]`）            |
| `[[:xdigit:]]` |        十六进制数字（`[0-9a-fA-F]`）        |
| `[[:graph:]]`  |           可打印的非空白字符（不含空格）           |
| `[[:print:]]`  |             可打印字符（含空格）              |
| `[[:punct:]]`  |        标点符号（如 `. , ; ! ?` 等）        |

**示例**：查找包含大写字母的行

```bash
grep -E '[[:upper:]]' test.txt
```

输出：

```text
HELLO LINUX!
Linux is a free unix-type operating system.
This is a linux testfile!
Linux test
This is LinuxSystem
```

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [性能工具之linux三剑客awk、grep、sed详解](https://developer.aliyun.com/article/1455252)
<strong style="color: #db8ef7;">[2]</strong> [Linux文本处理三剑客：grep、sed 和 awk](https://cloud.tencent.com.cn/developer/article/2475563)
<strong style="color: #db8ef7;">[3]</strong> [Linux grep命令专业总结](https://cloud.tencent.com.cn/developer/article/2517379)
<strong style="color: #db8ef7;">[4]</strong> [Linux sed命令详细教程](https://developer.aliyun.com/article/1710933)
<strong style="color: #db8ef7;">[5]</strong> [Linux awk命令详细教程](https://cloud.tencent.cn/developer/article/2397225)
<strong style="color: #db8ef7;">[6]</strong> [Linux awk命令详解(含义、语法、参数、用法、示例)](https://www.juhe.cn/news/index/id/9154)
<strong style="color: #db8ef7;">[7]</strong> [Linux 文本处理三剑客：grep、awk、sed 全面学习笔记](https://www.cnblogs.com/xxx/p/xxx.html)
<strong style="color: #db8ef7;">[8]</strong> [grep(1)](https://manpages.debian.org/testing/grep/grep.1.en.html)
<strong style="color: #db8ef7;">[9]</strong> [POSIX 字符类参考](https://www.gnu.org/software/grep/manual/html_node/Character-Classes-and-Bracket-Expressions.html)