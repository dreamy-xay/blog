---
title: 【Shell】Linux Shell 脚本语法详解
tags:
  - 编程语言
  - 脚本语言
categories:
  - Shell
comments: true
toc: true
toc_number: false
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 2456c593
keywords: ''
description: ''
top_img: ''
cover: ''
date: 2026-09-21 19:38:56
updated: 2026-09-21 19:41:07
---

Shell 脚本是 Linux 系统管理和自动化运维的核心工具。它将一系列命令组织成可执行的程序，支持变量、流程控制、函数、数组等编程语言特性，同时天然具备调用系统命令和管道处理的能力。以下从基础到高级逐步展开 Shell 脚本的语法体系。

## 一、脚本结构与执行

### 1 Shebang 行

每个 Shell 脚本的第一行通常是 `#!`（Shebang），用于指定解释器：

```bash
#!/bin/bash
```

这行告诉系统使用 `/bin/bash` 来解释后续代码。常用的解释器还包括 `#!/bin/sh`、`#!/usr/bin/env bash` 等。`#!/usr/bin/env bash` 的方式更具可移植性，它会从 `PATH` 中查找 `bash` 的位置。

### 2 脚本的执行方式

```bash
# 方式一：赋予执行权限后直接运行
chmod +x script.sh
./script.sh

# 方式二：显式指定解释器
bash script.sh

# 方式三：在当前 Shell 中执行（不创建子进程）
source script.sh
# 或
. script.sh
```

方式一和方式二会在子进程中执行脚本，脚本中定义的变量不会影响当前 Shell。方式三在当前 Shell 中执行，脚本中定义的变量和函数会保留下来。

## 二、变量

### 1 变量定义与赋值

Shell 变量无需声明类型，直接赋值即可：

```bash
name="Alice"
age=25
```

{% note warning modern %}
等号两边不能有空格，这是 Shell 变量赋值的一条硬性规则。
{% endnote %}

### 2 变量引用

引用变量时在变量名前加 `$`，推荐使用 `${}` 形式以明确变量边界：

```bash
name="Alice"
echo "$name"
echo "${name}"
echo "Hello, ${name}Script"   # 花括号避免歧义
```

如果不加花括号，`$nameScript` 会被解释为变量 `nameScript`，而非 `name` 加字符串 `Script`。

### 3 只读变量与删除变量

```bash
readonly PI=3.14
# PI=3.15  # 报错：只读变量不可修改

unset name   # 删除变量
```

`readonly` 将变量设为只读，`unset` 删除变量（但不能删除只读变量）。

### 4 特殊变量

|     变量      |      含义       |            示例             |
| :---------: | :-----------: | :-----------------------: |
|    `$0`     |     脚本名称      |     `echo "脚本名: $0"`      |
| `$1` ~ `$9` |     位置参数      |    `echo "第一个参数: $1"`     |
|    `$#`     |     参数个数      |     `echo "参数个数: $#"`     |
|    `$@`     |  所有参数（分别引用）   | `for arg in "$@"; do ...` |
|    `$*`     | 所有参数（作为单个字符串） |        `echo "$*"`        |
|    `$?`     |  上一条命令的退出状态   |   `echo "上条命令退出码: $?"`    |
|    `$$`     |   当前进程 PID    |     `echo "PID: $$"`      |

**示例**：

```bash
#!/bin/bash
echo "脚本名: $0"
echo "参数个数: $#"
echo "所有参数: $@"
```

执行 `./test.sh hello world` 输出：

```text
脚本名: ./test.sh
参数个数: 2
所有参数: hello world
```

### 5 变量默认值

Shell 提供了参数扩展语法来为变量设置默认值：

```bash
name="${1:-guest}"        # 如果 $1 未设置或为空，使用 guest
config="${CONFIG_PATH:-/etc/app.conf}" # 如果变量 CONFIG_PATH 未设置或为空，使用 -/etc/app.conf
```

### 6 命令替换

将命令的输出赋值给变量：

```bash
current_date=$(date)
echo "当前时间: ${current_date}"

# 旧式反引号写法（不推荐）
current_date=`date`
```

`$()` 语法可嵌套使用，且更易读。

## 三、字符串操作

### 1 获取字符串长度

```bash
str="Hello, World"
echo ${#str}    # 输出 12
```

### 2 字符串截取

```bash
str="Hello, World"

echo ${str:0:5}     # 输出 "Hello"（从索引 0 开始取 5 个字符）
echo ${str:7}       # 输出 "World"（从索引 7 开始到末尾）
echo ${str: -5}     # 输出 "World"（从末尾倒数 5 个字符）【其他写法：`${str:0-5}` 和 `${str:(-5)}`】
```

{% note warning modern %}
表达式 `${str: -5}` 中 `-5` 之前必须有空格，否则会被解析成默认值语法（`:-`）。
{% endnote %}

### 3 字符串替换

```bash
str="Hello, World"

echo ${str/World/Shell}     # 输出 "Hello, Shell"（替换第一个匹配）
echo ${str//o/0}            # 输出 "Hell0, W0rld"（替换所有匹配）
```

`/pattern/replacement` 替换第一个匹配项，`//pattern/replacement` 替换所有匹配项。

### 4 删除前缀与后缀

```bash
file="/home/user/test.tar.gz"

echo ${file#*/}       # 删除第一个 / 及其左侧: home/user/test.tar.gz
echo ${file##*/}      # 删除最后一个 / 及其左侧: test.tar.gz
echo ${file%.*}       # 删除最后一个 . 及其右侧: /home/user/test.tar
echo ${file%%.*}      # 删除第一个 . 及其右侧: /home/user/test
```

## 四、算术运算

Shell 支持整数算术运算，常用 `$(( ))` 语法：

```bash
a=10
b=3

echo $((a + b))    # 13
echo $((a - b))    # 7
echo $((a * b))    # 30
echo $((a / b))    # 3（整数除法）
echo $((a % b))    # 1（取余）

# 自增自减
((a++))
((a--))

# 赋值运算
((a += 5))
```

`$(( ))` 是 Shell 内置的算术运算，不依赖外部命令，效率高。Shell 本身不支持浮点运算，如需浮点计算可使用 `bc` 或 `awk`。

## 五、条件判断

### 1 test 命令与 \[ \]

`[ ]` 是 `test` 命令的简写形式，用于条件判断：

```bash
if [ "$age" -gt 18 ]; then
    echo "成年人"
fi
```

### 2 常用测试运算符

**数值比较**：

|  运算符  |  含义  |       示例        |
| :---: | :--: | :-------------: |
| `-eq` |  等于  | `[ $a -eq $b ]` |
| `-ne` | 不等于  | `[ $a -ne $b ]` |
| `-gt` |  大于  | `[ $a -gt $b ]` |
| `-ge` | 大于等于 | `[ $a -ge $b ]` |
| `-lt` |  小于  | `[ $a -lt $b ]` |
| `-le` | 小于等于 | `[ $a -le $b ]` |

**字符串比较**：

| 运算符  |  含义   |         示例         |
| :--: | :---: | :----------------: |
| `=`  |  等于   | `[ "$a" = "$b" ]`  |
| `!=` |  不等于  | `[ "$a" != "$b" ]` |
| `-z` | 字符串为空 |  `[ -z "$str" ]`   |
| `-n` | 字符串非空 |  `[ -n "$str" ]`   |

**文件测试**：

| 运算符  |   含义    |        示例        |
| :--: | :-----: | :--------------: |
| `-f` | 是否为普通文件 | `[ -f "$file" ]` |
| `-d` |  是否为目录  | `[ -d "$dir" ]`  |
| `-e` |  是否存在   | `[ -e "$path" ]` |
| `-r` |  是否可读   | `[ -r "$file" ]` |
| `-w` |  是否可写   | `[ -w "$file" ]` |
| `-x` |  是否可执行  | `[ -x "$file" ]` |

### 3 逻辑运算

```bash
# 逻辑与
if [ "$score" -ge 90 ] && [ "$attendance" -eq 100 ]; then
    echo "优秀"
fi

# 逻辑或
if [ "$user" = "root" ] || [ "$user" = "admin" ]; then
    echo "有权限"
fi

# 逻辑非
if [ ! -f "$file" ]; then
    echo "文件不存在"
fi
```

### 4 双括号 [[ ]]

`[[ ]]` 是 Bash 的扩展语法，支持模式匹配和更安全的字符串比较：

```bash
if [[ "$name" == A* ]]; then
    echo "名字以 A 开头"
fi

if [[ "$file" == *.txt ]]; then
    echo "这是一个文本文件"
fi
```

`[[ ]]` 在字符串比较时无需担心变量为空或包含空格的问题。

### 5 case 语句

`case` 适合多分支匹配：

```bash
case "$1" in
    start)
        echo "启动服务"
        ;;
    stop)
        echo "停止服务"
        ;;
    restart)
        echo "重启服务"
        ;;
    *)
        echo "用法: $0 {start|stop|restart}"
        ;;
esac
```

每个分支以 `)` 结束，`;;` 表示该分支结束，`*)` 匹配所有其他情况。

## 六、循环结构

### 1 for 循环

**遍历列表**：

```bash
for fruit in apple banana orange; do
    echo "水果: $fruit"
done
```

**遍历数字范围**：

```bash
for i in {1..5}; do
    echo "数字: $i"
done
```

**C 语言风格**：

```bash
for ((i=0; i<10; i++)); do
    echo "i = $i"
done
```

**遍历数组**：

```bash
arr=("one" "two" "three")
for item in "${arr[@]}"; do
    echo "$item"
done
```

### 2 while 循环

```bash
count=1
while [ $count -le 5 ]; do
    echo "计数: $count"
    ((count++))
done
```

**逐行读取文件**：

```bash
while IFS= read -r line; do
    echo "行: $line"
done < file.txt
```

### 3 until 循环

`until` 与 `while` 相反，条件为假时循环，条件为真时退出：

```bash
count=5
until [ $count -le 0 ]; do
    echo "倒计时: $count"
    ((count--))
done
```

### 4 循环控制

```bash
for i in {1..10}; do
    if [ $i -eq 3 ]; then
        continue    # 跳过本次循环
    fi
    if [ $i -eq 7 ]; then
        break       # 终止循环
    fi
    echo "$i"
done
```

## 七、函数

### 1 函数定义与调用

```bash
greet() {
    echo "Hello, $1!"
}

greet "Alice"    # 调用函数
```

函数可以通过 `function` 关键字或直接 `函数名()` 的方式定义，通过函数名直接调用，不需要加括号。

### 2 函数参数

函数内部通过 `$1`、`$2` 等访问参数，通过 `$#` 获取参数个数：

```bash
func1() {
    echo "第一个参数: $1"
    echo "第二个参数: $2"
    echo "参数个数: $#"
}

func1 12 34 56
```

### 3 函数返回值

Shell 函数的返回值有两种方式：

**return 返回整数状态码**（0 表示成功，非 0 表示失败）：

```bash
is_even() {
    if (( $1 % 2 == 0 )); then
        return 0
    else
        return 1
    fi
}

if is_even 4; then
    echo "是偶数"
fi
```

**通过 echo 输出返回值**：

```bash
add() {
    echo $(( $1 + $2 ))
}

result=$(add 3 5)
echo "结果: $result"
```

Shell 函数的 `return` 只能返回 0~255 的整数，不能返回字符串。

### 4 局部变量

函数内使用 `local` 声明局部变量，避免污染全局作用域：

```bash
my_func() {
    local name="Bob"
    echo "函数内: $name"
}

my_func
echo "函数外: $name"    # 空值
```

## 八、数组

### 1 普通数组

**定义**：

```bash
arr=(one two three)
```

**访问元素**：

```bash
echo ${arr[0]}       # one
echo ${arr[2]}       # three
```

**获取所有元素**：

```bash
echo ${arr[@]}       # one two three
echo ${arr[*]}
```

{% note primary no-icon flat %}
<strong style="color: #6F42C1;">💡 `[@]` 和 `[*]` 的区别</strong>
<span style="display: inline-block; padding-left: 3em;"><span style="display: inline-block; text-indent: -2em; transform: scale(0.4); opacity: 0.5;">●</span><strong>`"${arr[@]}"`：</strong>每个元素单独一个词，展开成：`"one" "two" "three"`</span>
<span style="display: inline-block; padding-left: 3em;"><span style="display: inline-block; text-indent: -2em; transform: scale(0.4); opacity: 0.5;">●</span><strong>`"${arr[*]}"`：</strong>所有元素合成一个词，展开成：`"one two three"`</span>
{% endnote %}


**获取数组长度**：

```bash
echo ${#arr[@]}      # 5
```

**遍历数组**：

```bash
for item in "${arr[@]}"; do
    echo "$item"
done
```

### 2 关联数组

关联数组使用字符串作为键，需要 Bash 4.0 及以上版本，使用 `declare -A` 声明：

```bash
declare -A site
site["google"]="www.google.com"
site["taobao"]="www.taobao.com"
site["runoob"]="www.runoob.com"

echo ${site["google"]}    # www.google.com
```

**遍历关联数组**：

```bash
for key in "${!site[@]}"; do
    echo "$key -> ${site[$key]}"
done
```

`${!site[@]}` 获取所有键，`${site[$key]}` 获取对应的值。

## 九、重定向与管道

### 1 文件描述符

| 描述符 |      名称      | 默认目标 |
| :-: | :----------: | :--: |
|  0  | 标准输入（stdin）  |  键盘  |
|  1  | 标准输出（stdout） |  终端  |
|  2  | 标准错误（stderr） |  终端  |

### 2 常用重定向

```bash
# 输出重定向（覆盖）
command > file.txt

# 输出重定向（追加）
command >> file.txt

# 错误重定向
command 2> error.txt

# 同时重定向 stdout 和 stderr
command > output.txt 2>&1

# 丢弃所有输出
command > /dev/null 2>&1

# 输入重定向
command < input.txt
```

`2>&1` 的含义是将文件描述符 2（stderr）重定向到文件描述符 1（stdout）当前指向的位置。

### 3 Here Document

Here Document 用于向命令提供多行输入：

```bash
cat << EOF
第一行
第二行
第三行
EOF
```

常用于生成配置文件或传递多行内容给命令。

### 4 管道

管道 `|` 将前一个命令的标准输出作为后一个命令的标准输入：

```bash
ps -ef | grep nginx
cat access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10
```

管道中的每个命令都在独立的子进程中执行。

## 十、正则表达式

### 1 常用元字符

|   元字符   |      含义       |             示例              |
| :-----: | :-----------: | :-------------------------: |
|   `^`   |      行首       |    `^root` 匹配以 root 开头的行    |
|   `$`   |      行尾       |    `root$` 匹配以 root 结尾的行    |
|   `.`   |    任意单个字符     |   `l..e` 匹配 l 和 e 之间有两个字符   |
|   `*`   | 前导字符出现 0 次或多次 | `lo*se` 匹配 lse、lose、loose 等 |
|  `[]`   |     字符集合      |     `[abc]` 匹配 a、b 或 c      |
|  `[^]`  |    排除字符集合     |   `[^abc]` 匹配非 a、b、c 的字符    |
| `\{n\}` | 前导字符恰好出现 n 次  |    `[0-9]\{4\}` 匹配 4 位数字    |

### 2 grep 中的正则

```bash
# 匹配以 root 开头的行
grep "^root" /etc/passwd

# 匹配以 bash 结尾的行
grep "bash$" /etc/passwd

# 匹配包含 4 位数字的行
grep "[0-9]\{4\}" data.txt

# 忽略大小写
grep -i "error" log.txt

# 扩展正则表达式
grep -E "error|warning" log.txt
```

### 3 sed 中的正则

```bash
# 替换行首的数字
sed 's/^[0-9]*//' file.txt

# 删除空行
sed '/^$/d' file.txt

# 匹配并替换
sed 's/\(.*\)=\(.*\)/key=\1, value=\2/' config.txt
```

### 4 awk 中的正则

```bash
# 匹配包含 error 的行
awk '/error/' log.txt

# 按逗号分隔，打印第二个字段
awk -F, '{print $2}' data.csv

# 条件过滤
awk '$3 > 100 {print $0}' data.txt

# 使用正则过滤
awk '/^This/' file.txt
```

## 十一、子 Shell 与进程替换

### 1 子 Shell

用圆括号 `( )` 包围的命令在子 Shell 中执行，子 Shell 中的变量修改不会影响父 Shell：

```bash
(cd /tmp && ls)     # 在子 Shell 中切换目录
pwd                 # 仍在原目录
```

子 Shell 常用于临时改变环境而不影响当前 Shell。

### 2 进程替换

进程替换允许将一个命令的输出作为文件使用：

```bash
# 将 ls -l 的输出作为 cat 的输入
cat <(ls -l)

# 将 find 的结果发送给 grep 处理
find . -type f > >(grep ".txt")
```

进程替换使用 `<()` 和 `>()` 语法，生成特殊的文件描述符，在内存中操作，不产生磁盘 I/O 开销。

## 十二、信号处理与 trap

`trap` 命令用于捕获信号并执行指定操作：

```bash
trap 'echo "收到中断信号"; exit 1' SIGINT SIGTERM

trap 'rm -f /tmp/tempfile' EXIT
```

`EXIT` 信号在脚本退出时触发，无论正常退出还是异常退出。这是清理临时文件的常用方式。

**常用信号**：

|    信号     |    说明     |
| :-------: | :-------: |
| `SIGINT`  | Ctrl+C 中断 |
| `SIGTERM` |   终止信号    |
|  `EXIT`   |   脚本退出    |
|  `DEBUG`  | 每条命令执行前触发 |
|   `ERR`   |  命令失败时触发  |

## 十三、错误处理与调试

### 1 set 命令

```bash
#!/bin/bash
set -euo pipefail
```

三个选项的含义：
- `-e`（errexit）：命令失败时立即退出脚本
- `-u`（nounset）：引用未定义变量时报错退出
- `-o pipefail`：管道中任一命令失败时，整个管道返回失败状态

`set -euo pipefail` 是编写健壮 Shell 脚本的推荐实践。如果不使用 `pipefail`，管道 `cmd1 | cmd2` 的退出状态仅由最后一个命令决定，前面命令的失败会被忽略。

### 2 调试模式

```bash
# 在脚本中启用
set -x

# 或在执行时启用
bash -x script.sh
```

`set -x` 会在每条命令执行前打印命令及其参数，便于跟踪脚本执行流程。

### 3 退出状态检查

```bash
if ! command; then
    echo "命令执行失败" >&2
    exit 1
fi

# 使用 || 和 && 处理
command || { echo "失败"; exit 1; }
command && echo "成功"
```

`$?` 保存上一条命令的退出状态，0 表示成功，非 0 表示失败。

## 十四、实战示例

### 1 参数解析

```bash
#!/bin/bash
while [[ $# -gt 0 ]]; do
    case "$1" in
        -f|--file)
            file="$2"
            shift 2
            ;;
        -v|--verbose)
            verbose=true
            shift
            ;;
        -h|--help)
            echo "用法: $0 [-f file] [-v]"
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            exit 1
            ;;
    esac
done
```

### 2 日志记录

```bash
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

log INFO "服务启动"
log ERROR "连接失败"
```

### 3 文件遍历与处理

```bash
#!/bin/bash
set -euo pipefail

for file in *.txt; do
    [ -e "$file" ] || continue
    echo "处理: $file"
    wc -l "$file"
done
```

使用 `[ -e "$file" ] || continue` 防止在没有匹配文件时 `*.txt` 被当作字面字符串处理。

### 4 检查命令是否存在

```bash
if ! command -v git &> /dev/null; then
    echo "git 未安装" >&2
    exit 1
fi
```

### 5 使用数组存储命令结果

```bash
readarray -t lines < <(grep "ERROR" log.txt)
for line in "${lines[@]}"; do
    echo "错误: $line"
done
```

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [Unix脚本编程，入门指南在这里！](https://m.yisu.com/zixun/1067389.html)
<strong style="color: #db8ef7;">[2]</strong> [Shell 脚本编写的详细指南](https://blog.csdn.net/qq_45657541/article/details/146314081)
<strong style="color: #db8ef7;">[3]</strong> [Linux系统-Shell脚本基本使用(数组、函数、字符串处理)](https://bbs.huaweicloud.com/blogs/315410)
<strong style="color: #db8ef7;">[4]</strong> [Shell语言高级用法探索](https://cloud.tencent.cn/developer/article/2456701)
<strong style="color: #db8ef7;">[5]</strong> [在Shell编程中，进程替换](https://developer.aliyun.com/article/1409527)
<strong style="color: #db8ef7;">[6]</strong> [通过变量间接访问bash关联数组](https://cloud.tencent.cn/developer/information/%E9%80%9A%E8%BF%87%E5%8F%98%E9%87%8F%E9%97%B4%E6%8E%A5%E8%AE%BF%E9%97%AEbash%E5%85%B3%E8%81%94%E6%95%B0%E7%BB%84)
<strong style="color: #db8ef7;">[7]</strong> [Shell 教程](https://www.runoob.com/linux/linux-shell.html)
<strong style="color: #db8ef7;">[8]</strong> [Shell 变量](https://m.runoob.com/linux/linux-shell-variable.html)
<strong style="color: #db8ef7;">[9]</strong> [Shell标准输出、标准错误 >/dev/null 2>&1](https://developer.aliyun.com/article/518378)
<strong style="color: #db8ef7;">[10]</strong> [linux shell 脚本调试技巧](https://developer.aliyun.com/article/1605282)