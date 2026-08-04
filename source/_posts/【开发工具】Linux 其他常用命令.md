---
title: 【开发工具】Linux 其他常用命令
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
abbrlink: aa951e57
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-08-03 14:23:01
updated: 2026-08-04 09:24:27
---
Linux 系统提供了丰富的命令，用于文件管理、系统监控、磁盘操作、网络配置等日常任务。

> **建议**：通过大量实践加深记忆，并善于利用 `--help` 或 `man` 查找不熟悉的选项。
## 一、文件与目录操作

### 1 `cd` —— 切换当前工作目录

**命令概述**
`cd`（Change Directory）用于切换当前工作目录。它是 Shell 内置命令，几乎每天都会用到。

**基本格式**

```bash
cd [目录路径]
```

**常用用法**

|        用法         |     说明      |       示例        |
| :---------------: | :---------: | :-------------: |
|   `cd` 或 `cd ~`   | 切换到当前用户的主目录 |      `cd`       |
|      `cd -`       | 切换到上一个工作目录  |     `cd -`      |
|      `cd ..`      |   切换到上级目录   |     `cd ..`     |
|      `cd /`       |   切换到根目录    |     `cd /`      |
| `cd /path/to/dir` |  切换到指定绝对路径  | `cd /etc/nginx` |

**示例**

```bash
# 切换到 /var/log 目录
cd /var/log
# 返回上一个目录
cd -
# 进入当前用户的家目录
cd ~
```

### 2 `pwd` —— 显示当前工作目录的绝对路径

**命令概述**
`pwd`（Print Working Directory）输出当前所在目录的完整绝对路径。

**基本格式**

```bash
pwd [选项]
```

**常用选项**

|  选项  |       功能描述        |    示例    |
| :--: | :---------------: | :------: |
| `-L` | 显示逻辑路径（跟随符号链接，默认） | `pwd -L` |
| `-P` |   显示物理路径，忽略符号链接   | `pwd -P` |

**示例**

```bash
# 显示当前目录
pwd
# 输出示例：/home/user/projects

# 若当前目录是符号链接，显示真实物理路径
pwd -P
```

### 3 `mkdir` —— 创建目录

**命令概述**
`mkdir`（Make Directory）用于创建新目录。

**基本格式**

```bash
mkdir [选项] 目录名...
```

**常用选项**

|  选项  |         功能描述          |         示例         |
| :--: | :-------------------: | :----------------: |
| `-p` | 递归创建多层目录，若父目录不存在则自动创建 | `mkdir -p a/b/c/d` |
| `-v` |      显示创建过程的详细信息      | `mkdir -v newdir`  |

**示例**

```bash
# 创建单个目录
mkdir myfolder

# 递归创建多级目录
mkdir -p project/src/main/java

# 创建多个目录
mkdir dir1 dir2 dir3
```

### 4 `rmdir` —— 删除空目录

**命令概述**
`rmdir`（Remove Directory）用于删除**空**目录。若目录非空，需使用 `rm -rf`。

**基本格式**

```bash
rmdir [选项] 目录名...
```

**常用选项**

|  选项  |      功能描述       |        示例        |
| :--: | :-------------: | :--------------: |
| `-p` | 递归删除父目录（若父目录为空） | `rmdir -p a/b/c` |

**示例**

```bash
# 删除空目录
rmdir empty_folder

# 递归删除空目录链
rmdir -p project/src/main   # 若 main、src、project 均为空则全部删除
```

### 5 `ls` —— 列出目录内容

**命令概述**
`ls`（List）是最常用的文件查看命令，用于显示目录中的文件和子目录。

**基本格式**

```bash
ls [选项] [目录或文件]
```

**常用选项**

|    选项     |          功能描述          |        示例         |
| :-------: | :--------------------: | :---------------: |
|   `-l`    | 以长格式显示详细信息（权限、大小、时间等）  |      `ls -l`      |
|   `-a`    | 显示所有文件（包括以`.`开头的隐藏文件）  |      `ls -a`      |
|   `-h`    | 人类可读的尺寸格式（与 `-l` 结合使用） |     `ls -lh`      |
|   `-R`    |       递归列出子目录内容        |      `ls -R`      |
|   `-S`    |      按文件大小从大到小排序       |     `ls -lS`      |
|   `-t`    |      按修改时间从新到旧排序       |     `ls -lt`      |
|   `-r`    |          反向排序          |     `ls -lr`      |
| `--color` |       高亮显示不同类型文件       | `ls --color=auto` |

**示例**

```bash
# 详细列出当前目录所有文件（含隐藏）
ls -la

# 按大小排序并显示人类可读大小
ls -lhS

# 递归查看目录树
ls -R /home/project
```

### 6 `cp` —— 复制文件或目录

**命令概述**
`cp`（Copy）用于复制文件或目录。

**基本格式**

```bash
cp [选项] 源 目标
```

**常用选项**

|  选项  |          功能描述          |            示例             |
| :--: | :--------------------: | :-----------------------: |
| `-r` |   递归复制目录（复制目录时必须使用）    | `cp -r src_dir/ dst_dir/` |
| `-i` |       覆盖前交互式提示确认       |    `cp -i file1 file2`    |
| `-u` |  仅当源文件比目标新或目标不存在时才复制   |   `cp -u source target`   |
| `-p` |   保留源文件的属性（权限、时间戳等）    |    `cp -p file1 file2`    |
| `-a` | 存档模式，等价于 `-dpR`，保留所有属性 |     `cp -a dir1 dir2`     |
| `-v` |       显示复制过程详细信息       |    `cp -v file1 file2`    |

**示例**

```bash
# 复制单个文件
cp file.txt /tmp/

# 复制整个目录（递归）
cp -r myproject /backup/

# 复制并保留权限和时间
cp -p config.conf config.bak
```

### 7 `mv` —— 移动或重命名文件/目录

**命令概述**
`mv`（Move）用于移动文件/目录到目标位置，也可用于重命名。

**基本格式**

```bash
mv [选项] 源 目标
```

**常用选项**

|  选项  |        功能描述         |          示例           |
| :--: | :-----------------: | :-------------------: |
| `-i` |     覆盖前交互式提示确认      |    `mv -i old new`    |
| `-u` | 仅当源文件比目标新或目标不存在时才移动 | `mv -u source target` |
| `-v` |     显示移动过程详细信息      |  `mv -v file /tmp/`   |

**示例**

```bash
# 重命名文件
mv oldname.txt newname.txt

# 移动文件到另一个目录
mv report.pdf ~/Documents/

# 移动多个文件到目录
mv file1 file2 file3 /target_dir/
```

### 8 `rm` —— 删除文件或目录

**命令概述**
`rm`（Remove）用于删除文件或目录。**注意：删除操作不可恢复，请谨慎使用。**

**基本格式**

```bash
rm [选项] 目标...
```

**常用选项**

|  选项  |         功能描述         |        示例        |
| :--: | :------------------: | :--------------: |
| `-r` | 递归删除目录及其内容（删除目录必须使用） |  `rm -r mydir/`  |
| `-f` | 强制删除，不提示确认，忽略不存在的文件  | `rm -f file.log` |
| `-i` |      删除前逐个交互式确认      |  `rm -i *.txt`   |
| `-v` |      显示删除过程详细信息      |   `rm -v file`   |

**示例**

```bash
# 删除单个文件
rm test.txt

# 递归强制删除目录（慎用！）
rm -rf /tmp/cache/

# 交互式删除所有 .log 文件
rm -i *.log
```

## 二、文件传输与网络

### 1 `scp` —— 安全远程文件复制（基于 SSH）

**命令概述**
`scp`（Secure Copy）用于在本地和远程主机之间安全地复制文件或目录，数据传输通过 SSH 加密。

**基本格式**

```bash
scp [选项] 源 目标
```

**常用选项**

|  选项  |      功能描述       |                   示例                   |
| :--: | :-------------: | :------------------------------------: |
| `-r` |    递归复制整个目录     | `scp -r /local/dir user@host:/remote/` |
| `-P` | 指定 SSH 端口（大写 P） |     `scp -P 2222 file user@host:/`     |
| `-i` |  指定私钥文件进行身份验证   |    `scp -i key.pem file user@host:`    |
| `-C` |   启用压缩以加快传输速度   |     `scp -C largefile user@host:`      |
| `-v` |  显示调试信息（用于排错）   |        `scp -v file user@host:`        |

**示例**

```bash
# 将本地文件复制到远程主机
scp report.txt user@192.168.1.100:/home/user/

# 从远程主机复制文件到本地
scp user@192.168.1.100:/var/log/syslog /tmp/

# 递归复制整个目录（指定端口）
scp -r -P 2222 project/ user@remote:/backup/
```

### 2 `ifconfig` —— 网络接口配置（已逐渐被 `ip` 替代，但仍常用）

**命令概述**
`ifconfig`（Interface Configuration）用于查看和配置网络接口参数。在最新 Linux 发行版中推荐使用 `ip` 命令，但 `ifconfig` 仍广泛使用。

**基本格式**

```bash
ifconfig [网络接口] [选项]
```

**常用用法**

|           用法            |      描述      |              示例              |
| :---------------------: | :----------: | :--------------------------: |
|       `ifconfig`        | 显示所有活动网络接口信息 |          `ifconfig`          |
|      `ifconfig -a`      | 显示所有接口（含非活动） |        `ifconfig -a`         |
| `ifconfig eth0 up/down` |  启用/禁用指定接口   |     `ifconfig eth0 down`     |
|   `ifconfig eth0 IP`    | 为接口设置 IP 地址  | `ifconfig eth0 192.168.1.10` |

**示例**

```bash
# 查看所有网卡信息
ifconfig

# 查看特定网卡（如 eth0）
ifconfig eth0

# 启用网卡
ifconfig eth0 up
```

## 三、磁盘与文件系统管理

### 1 `mkfs` —— 创建文件系统（格式化）

**命令概述**
`mkfs`（Make FileSystem）用于在磁盘分区上创建文件系统（如 ext4、xfs、fat32 等）。

**基本格式**

```bash
mkfs [选项] 设备名
```

**常用文件系统类型**

|     命令      | 文件系统类型 |          示例           |
| :---------: | :----: | :-------------------: |
| `mkfs.ext4` |  ext4  | `mkfs.ext4 /dev/sdb1` |
| `mkfs.xfs`  |  xfs   | `mkfs.xfs /dev/sdc1`  |
| `mkfs.vfat` | FAT32  | `mkfs.vfat /dev/sdd1` |

**常用选项**

|  选项  |           功能描述            |               示例               |
| :--: | :-----------------------: | :----------------------------: |
| `-t` | 指定文件系统类型（与 `mkfs` 命令一起使用） |    `mkfs -t ext4 /dev/sdb1`    |
| `-L` |           设置卷标            | `mkfs.ext4 -L data /dev/sdb1`  |
| `-V` |          显示详细模式           | `mkfs -V -t ext3 -c /dev/sda1` |
| `-c` |          检查是否有坏轨          | `mkfs -V -t ext3 -c /dev/sda1` |

**示例**

```bash
# 格式化 /dev/sdb1 为 ext4
mkfs.ext4 /dev/sdb1

# 格式化并设置卷标
mkfs.xfs -L mydata /dev/sdc1

# 未分区创建文件系统，检查坏道并详细显示
mkfs -V -t ext3 -c /dev/sda1
```

### 2 `fdisk` —— 磁盘分区工具

**命令概述**
`fdisk` 是传统的磁盘分区管理工具，用于创建、删除、查看磁盘分区表。

**基本格式**

```bash
fdisk [选项] 设备
```

**常用选项和子命令**

| 命令/选项  |    功能描述    |     示例     |
| :----: | :--------: | :--------: |
|  `-l`  | 列出所有磁盘的分区表 | `fdisk -l` |
| 进入交互后： |            |            |
|  `m`   |   显示帮助菜单   |  交互内按 `m`  |
|  `p`   |  打印当前分区表   |  交互内按 `p`  |
|  `n`   |    新建分区    |  交互内按 `n`  |
|  `d`   |    删除分区    |  交互内按 `d`  |
|  `w`   |   保存并退出    |  交互内按 `w`  |
|  `q`   |   不保存退出    |  交互内按 `q`  |

**示例**

```bash
# 查看所有磁盘分区情况
sudo fdisk -l

# 对 /dev/sdb 进行分区
sudo fdisk /dev/sdb
# 进入交互界面，依次按 n, p, 1, 回车, 回车, w
```

### 3 `dd` —— 数据转换与复制（低级拷贝）

**命令概述**
`dd` 用于按块复制文件或设备，常用于备份、恢复磁盘镜像、制作启动盘等。它直接操作底层数据，功能强大但使用不当可能造成数据丢失。

**基本格式**

```bash
dd [选项]
```

**常用选项**

|        选项         |       功能描述       |          示例          |
| :---------------: | :--------------: | :------------------: |
|      `if=文件`      |     输入文件（源）      |    `if=/dev/sda`     |
|      `of=文件`      |     输出文件（目标）     | `of=/tmp/backup.img` |
|      `bs=大小`      | 设置读写块大小（如 bs=1M） |       `bs=4M`        |
|    `count=块数`     |      复制的块数       |      `count=10`      |
|     `skip=块数`     |    跳过输入开头的若干块    |      `skip=100`      |
|     `seek=块数`     |    跳过输出开头的若干块    |      `seek=50`       |
| `status=progress` |   显示进度（较新版 dd）   |  `status=progress`   |

**示例**

```bash
# 将本地的 /dev/hdb 整盘备份到/ dev/hdd
dd if=/dev/hdb of=/dev/hdd

# 备份 /dev/hdb 全盘数据，并利用 gzip 工具进行压缩，保存到指定路径
dd if=dev/hdb | gzip>/root/image.gz

# 将备份文件恢复到指定盘
dd if=/root/image of=/dev/hdb


# 备份整个磁盘到镜像文件
dd if=/dev/sda of=/backup/disk.img bs=4M status=progress

# 将镜像写入 U 盘（制作启动盘）
dd if=ubuntu.iso of=/dev/sdb bs=4M status=progress

# 仅备份分区前 10 个块（每个块 512 字节）
dd if=/dev/sda1 of=partition_header bs=512 count=10
```

### 4 `df` —— 查看磁盘空间使用情况

**命令概述**
`df`（Disk Free）显示文件系统的总容量、已用空间、可用空间及挂载点信息。

**基本格式**

```bash
df [选项] [文件或目录]
```

**常用选项**

|    选项     |        功能描述        |      示例      |
| :-------: | :----------------: | :----------: |
|   `-h`    |   人类可读格式（GB、MB）    |   `df -h`    |
|   `-T`    |      显示文件系统类型      |   `df -T`    |
|   `-i`    | 显示 inode 使用情况而非磁盘块 |   `df -i`    |
|   `-a`    | 显示所有文件系统（含虚拟文件系统）  |   `df -a`    |
| `--total` |       显示总计行        | `df --total` |

**示例**

```bash
# 以可读格式查看磁盘空间
df -h

# 查看 /home 所在分区的文件系统类型和使用情况
df -hT /home

# 查看 inode 使用情况
df -i
```

## 四、进程与系统监控

### 1 `top` —— 实时系统进程监控

**命令概述**
`top` 提供系统进程、CPU、内存等资源的实时动态视图，是常用的性能监控工具。

**基本格式**

```bash
top [选项]
```

**常用选项与交互命令**

|  选项/交互   |     功能描述      |      示例       |
| :------: | :-----------: | :-----------: |
| `-u 用户`  |  仅显示指定用户的进程   | `top -u root` |
| `-p PID` |    仅显示指定进程    | `top -p 1234` |
|   `-H`   |    显示线程模式     |   `top -H`    |
|  交互命令：   |               |               |
|   `P`    |  按 CPU 使用率排序  |   交互内按 `P`    |
|   `M`    |   按内存使用率排序    |   交互内按 `M`    |
|   `k`    | 终止进程（需输入 PID） |   交互内按 `k`    |
|   `q`    |    退出 top     |   交互内按 `q`    |

**示例**

```bash
# 启动 top
top

# 只查看特定用户的进程
top -u mysql
```

### 2 `htop` —— top 的增强版（需额外安装）

**命令概述**
`htop` 是 top 的改进版，界面更友好，支持颜色、鼠标操作、垂直/水平滚动，功能更强大。

**基本格式**

```bash
htop [选项]
```

**常用选项**

|    选项    |  功能描述   |       示例       |
| :------: | :-----: | :------------: |
| `-u 用户`  | 仅显示指定用户 | `htop -u root` |
| `-p PID` | 仅显示指定进程 | `htop -p 1234` |

**示例**

```bash
# 启动 htop
htop

# 显示特定用户进程
htop -u www-data
```

### 3 `uname` —— 系统信息查询

**命令概述**
`uname`（Unix Name）显示操作系统和硬件相关信息。

**基本格式**

```bash
uname [选项]
```

**常用选项**

|  选项  |      功能描述      |     示例     |
| :--: | :------------: | :--------: |
| `-a` |     显示所有信息     | `uname -a` |
| `-s` |      内核名称      | `uname -s` |
| `-n` |     网络主机名      | `uname -n` |
| `-r` |      内核版本      | `uname -r` |
| `-v` |   内核版本（编译信息）   | `uname -v` |
| `-m` | 硬件架构（如 x86_64） | `uname -m` |
| `-p` |     处理器类型      | `uname -p` |
| `-i` |      硬件平台      | `uname -i` |
| `-o` |     操作系统名称     | `uname -o` |

**示例**

```bash
# 显示所有系统信息
uname -a
# 输出示例：Linux hostname 5.10.0-13-amd64 #1 SMP Debian 5.10.106-1 (2022-03-17) x86_64 GNU/Linux

# 只查看内核版本
uname -r
```

### 4 `history` —— 查看命令历史

**命令概述**
`history` 显示当前 Shell 会话中执行过的命令列表，常用于重复执行或查阅操作记录。

**基本格式**

```bash
history [选项] [n]
```

**常用选项**

|  选项  |    功能描述     |      示例      |
| :--: | :---------: | :----------: |
| `-c` | 清空当前会话的历史记录 | `history -c` |
| `-w` |  将历史写入历史文件  | `history -w` |
| `-r` | 从历史文件读取历史记录 | `history -r` |
| `数字` | 显示最近 n 条命令  | `history 10` |

**示例**

```bash
# 显示所有历史命令
history

# 显示最近 5 条
history 5

# 清空历史
history -c

# 执行历史中的第 100 条命令
!100

# 重新执行上一条命令
!!
```

## 五、文本查看与处理（辅助类）

### 1 `less` —— 分页查看文件内容

**命令概述**
`less` 是 `more` 的增强版，允许向前/向后滚动查看文件内容，支持搜索和多种交互操作。

**基本格式**

```bash
less [选项] 文件
```

**常用选项**

|     选项      |      功能描述       |           示例           |
| :---------: | :-------------: | :--------------------: |
|    `-N`     |      显示行号       |   `less -N file.log`   |
|    `-S`     | 禁用自动换行（长行可横向滚动） |   `less -S file.log`   |
|    `-g`     |     高亮搜索匹配项     |   `less -g file.log`   |
| `+/pattern` |  打开文件后立即搜索指定模式  | `less +/error log.txt` |

**常用交互命令**

|      命令       |   功能    |
| :-----------: | :-----: |
| `Space` 或 `f` |  向下翻一页  |
|      `b`      |  向上翻一页  |
|      `d`      |  向下翻半页  |
|      `u`      |  向上翻半页  |
| `Enter` 或 `j` |  向下翻一行  |
|      `k`      |  向上翻一行  |
|      `g`      | 跳转到文件开头 |
|      `G`      | 跳转到文件末尾 |
|  `/pattern`   | 向下搜索模式  |
|  `?pattern`   | 向上搜索模式  |
|      `n`      | 下一个匹配项  |
|      `N`      | 上一个匹配项  |
|      `q`      |   退出    |
|      `h`      |   帮助    |

**多文件交互命令（`less a.long b.long`）**

|  命令  |         功能         |
| :--: | :----------------: |
| `:e` | 打开指定文件（示例：e a.log） |
| `:n` |       浏览下个文件       |
| `:p` |       浏览上个文件       |

**示例**

```bash
# 查看系统日志
less /var/log/syslog

# 带行号查看配置文件
less -N /etc/nginx/nginx.conf
```

### 2 `tail` —— 查看文件尾部内容（常用于实时日志）

**命令概述**
`tail` 显示文件的末尾部分，常用 `-f` 选项实时跟踪文件更新。

**基本格式**

```bash
tail [选项] 文件
```

**常用选项**

|   选项   |         功能描述          |                 示例                  |
| :----: | :-------------------: | :---------------------------------: |
| `-n n` |   显示最后 n 行（默认 10 行）   |        `tail -n 20 file.log`        |
|  `-f`  |  实时追踪文件新增内容（常用于监控日志）  | `tail -f /var/log/nginx/access.log` |
|  `-F`  | 类似于 `-f`，但文件被轮转后会重新打开 |          `tail -F app.log`          |
|  `-q`  |     不显示文件名（多文件时）      |        `tail -q file1 file2`        |

**示例**

```bash
# 查看最后 10 行
tail file.txt

# 实时查看日志
tail -f /var/log/syslog

# 查看最后 50 行并持续刷新
tail -n 50 -f access.log
```

### 3 `cat` —— 连接文件并输出到标准输出

**命令概述**
`cat`（Concatenate）常用于查看小文件、合并文件或快速创建文件。

**基本格式**

```bash
cat [选项] 文件...
```

**常用选项**

|  选项  |      功能描述      |        示例         |
| :--: | :------------: | :---------------: |
| `-n` |   显示行号（包括空行）   | `cat -n file.txt` |
| `-b` |    仅对非空行编号     | `cat -b file.txt` |
| `-s` |   压缩连续的空行为一行   | `cat -s file.txt` |
| `-E` | 在每行末尾显示 `$` 符号 | `cat -E file.txt` |

**示例**

```bash
# 查看文件内容
cat /etc/hosts

# 合并两个文件并输出
cat file1.txt file2.txt > merged.txt

# 快速创建文件（Ctrl+D 结束）
cat > newfile.txt
```

## 六、权限与属性管理

### 1 `chmod` —— 修改文件或目录的权限

**命令概述**
`chmod`（Change Mode）用于更改文件或目录的读、写、执行权限。

**基本格式**

```bash
chmod [选项] 权限 文件...
```

**权限表示方式**
- **符号模式**：`u`(用户), `g`(组), `o`(其他), `a`(全部)；`+`(添加), `-`(移除), `=`(设置)；`r`(读), `w`(写), `x`(执行)
  示例：`chmod u+x file`（给所有者添加执行权限）
- **数字模式**：三位八进制数，每位分别表示所有者、组、其他，各数字为 `r=4, w=2, x=1` 之和。
  示例：`755` = `rwxr-xr-x`

**常用选项**

|        选项        |     功能描述      |                   示例                   |
| :--------------: | :-----------: | :------------------------------------: |
|       `-R`       | 递归修改目录及其下所有文件 |        `chmod -R 755 /path/dir`        |
|       `-v`       |    显示修改过程     |          `chmod -v 644 file`           |
| `--reference=文件` | 以指定文件的权限为参考设置 | `chmod --reference=ref.txt target.txt` |

**示例**

```bash
# 给脚本添加执行权限
chmod +x script.sh

# 设置文件权限为 rw-r--r--
chmod 644 config.conf

# 递归修改目录及文件权限
chmod -R 750 /home/project
```

### 2 `chown` —— 修改文件或目录的所有者和所属组

**命令概述**
`chown`（Change Owner）用于更改文件或目录的用户所有权。

**基本格式**

```bash
chown [选项] 所有者[:组] 文件...
```

**常用用法**

|       用法        |          描述           |                  示例                   |
| :-------------: | :-------------------: | :-----------------------------------: |
|  `chown 用户 文件`  |     更改文件的所有者为指定用户     |         `chown john file.txt`         |
|  `chown :组 文件`  | 更改文件的所属组为指定组（保留所有者不变） |        `chown :staff file.txt`        |
| `chown 用户:组 文件` |      同时更改所有者和所属组      |      `chown john:staff file.txt`      |
|      `-R`       |      递归修改目录及其内容       | `chown -R www-data:www-data /var/www` |

**示例**

```bash
# 更改文件所有者
sudo chown alice report.pdf

# 更改文件所属组
sudo chown :developers project.conf

# 递归更改目录所有权
sudo chown -R user:group /home/user/data
```

## 七、压缩与归档

### 1 `tar` —— 归档工具（常与压缩结合）

**命令概述**
`tar`（Tape Archive）用于创建和解压归档文件（.tar），常配合 gzip、bzip2、xz 等压缩。

**基本格式**

```bash
tar [选项] [归档文件] [源文件/目录]
```

**常用选项**

|     选项      |           功能描述           |                        示例                        |
| :---------: | :----------------------: | :----------------------------------------------: |
|    `-c`     |          创建归档文件          |           `tar -cf archive.tar /path`            |
|    `-x`     |          解压归档文件          |              `tar -xf archive.tar`               |
|    `-t`     |         查看归档文件内容         |              `tar -tf archive.tar`               |
|    `-z`     |  通过 gzip 压缩/解压（.tar.gz）  |          `tar -czf archive.tar.gz dir/`          |
|    `-j`     | 通过 bzip2 压缩/解压（.tar.bz2） |         `tar -cjf archive.tar.bz2 dir/`          |
|    `-J`     |   通过 xz 压缩/解压（.tar.xz）   |          `tar -cJf archive.tar.xz dir/`          |
|    `-v`     |   显示处理过程详细信息（verbose）    |              `tar -xvf archive.tar`              |
|    `-p`     |          保留文件权限          |           `tar -cpf archive.tar /etc`            |
|    `-C`     |         指定解压目标目录         |         `tar -xf archive.tar -C /target`         |
| `--exclude` |        排除特定文件/目录         | `tar -czf backup.tar.gz --exclude='*.log' /home` |

**示例**

```bash
# 创建 tar.gz 压缩包
tar -czvf project.tar.gz project/

# 解压 tar.gz 到当前目录
tar -xzvf project.tar.gz

# 解压到指定目录
tar -xvf archive.tar -C /tmp/out/

# 查看压缩包内容
tar -tzvf archive.tar.gz
```

### 2 `zip` / `unzip` —— ZIP 压缩/解压

**命令概述**
`zip` 和 `unzip` 用于处理 ZIP 格式的压缩包，在 Windows/Linux 间交换文件时常用。

**基本格式**

```bash
zip [选项] 压缩包名 源文件...
unzip [选项] 压缩包名
```

**常用选项**

|   命令    |  选项  |     功能描述     |               示例               |
| :-----: | :--: | :----------: | :----------------------------: |
|  `zip`  | `-r` |    递归压缩目录    |   `zip -r archive.zip dir/`    |
|         | `-q` | 静默模式（不输出信息）  |     `zip -q file.zip file`     |
|         | `-d` |  从压缩包中删除文件   | `zip -d archive.zip file.txt`  |
| `unzip` | `-l` |  查看压缩包内容列表   |     `unzip -l archive.zip`     |
|         | `-d` |    指定解压目录    | `unzip archive.zip -d /target` |
|         | `-o` | 覆盖已存在的文件而不提示 |     `unzip -o archive.zip`     |

**示例**

```bash
# 压缩目录
zip -r backup.zip /home/user/docs

# 解压到指定目录
unzip backup.zip -d /tmp/restore/

# 查看压缩包内容
unzip -l archive.zip
```

## 八、时间与日期

### 1 `date` —— 显示或设置系统日期时间

**命令概述**
`date` 用于显示当前日期和时间，也可根据指定格式输出，管理员可用来设置系统时间。

**基本格式**

```bash
date [选项] [+格式]
date -s "时间字符串"
```

**常用格式符**

| 格式符  |                  含义                  |      示例      |
| :--: | :----------------------------------: | :----------: |
| `%Y` |               年份（四位数）                |    `2026`    |
| `%m` |              月份（01-12）               |     `08`     |
| `%d` |              日期（01-31）               |     `03`     |
| `%H` |              小时（00-23）               |     `14`     |
| `%M` |              分钟（00-59）               |     `30`     |
| `%S` |               秒（00-60）               |     `45`     |
| `%A` |               星期几（完整）                |   `Monday`   |
| `%B` |               月份名称（完整）               |   `August`   |
| `%s` | 自 1970-01-01 00:00:00 UTC 以来的秒数（时间戳） | `1691087445` |

**示例**

```bash
# 默认显示
date
# 输出示例：Mon Aug  3 14:30:45 CST 2026

# 自定义格式
date "+%Y-%m-%d %H:%M:%S"
# 输出：2026-08-03 14:30:45

# 显示时间戳
date +%s

# 设置系统时间（需要 root）
sudo date -s "2026-08-03 15:00:00"
```

### 2 `cal` —— 显示日历

**命令概述**
`cal`（Calendar）在终端显示日历，可指定月份和年份。

**基本格式**

```bash
cal [选项] [[月份] 年份]
```

**常用选项**

|  选项  |       功能描述        |    示例    |
| :--: | :---------------: | :------: |
| `-3` |  显示前一个月、本月、下一个月   | `cal -3` |
| `-y` |    显示当前年份的完整日历    | `cal -y` |
| `-m` |    以星期一作为每周第一天    | `cal -m` |
| `-j` | 显示儒略日（从1月1日起算的天数） | `cal -j` |

**示例**

```bash
# 显示当前月的日历
cal

# 显示 2026 年 12 月的日历
cal 12 2026

# 显示整个 2026 年日历
cal -y 2026
```

### 3 `bc` —— 命令行计算器

**命令概述**
`bc`（Basic Calculator）是一款支持任意精度算术和表达式的命令行计算器，支持变量、函数、逻辑运算等。

**基本格式**

```bash
bc [选项] [文件]
```

**常用选项**

|  选项  |               功能描述                |   示例    |
| :--: | :-------------------------------: | :-----: |
| `-l` | 加载标准数学库（支持 `s()`, `c()`, `l()` 等） | `bc -l` |
| `-q` |           安静模式（不显示版权信息）           | `bc -q` |
| `-s` |           使用 POSIX 标准模式           | `bc -s` |

**示例**

```bash
# 启动交互式计算器
bc
# 输入表达式，如 1+2，回车显示结果；输入 quit 退出

# 非交互式计算
echo "scale=2; 10/3" | bc   # 输出 3.33
echo "sqrt(100)" | bc -l    # 输出 10.00000000000000000000
```

## 九、系统控制与关停

### 1 `shutdown` —— 系统关机或重启

**命令概述**
`shutdown` 用于安全地关闭系统、重启或进入单用户模式。需要 root 权限。

**基本格式**

```bash
shutdown [选项] [时间] [消息]
```

**常用选项**

|  选项  |     功能描述      |                   示例                   |
| :--: | :-----------: | :------------------------------------: |
| `-h` |   停止系统（关机）    |           `shutdown -h now`            |
| `-r` |     重启系统      |        `shutdown -r +5`（5分钟后重启）        |
| `-c` |   取消已经计划的关机   |             `shutdown -c`              |
| `-k` | 仅发送警告消息，不实际关机 | `shutdown -k now "System will reboot"` |

**示例**

```bash
# 立即关机
sudo shutdown -h now

# 在今天的 20:00 关机
sudo shutdown -h 20:00

# 10 分钟后重启
sudo shutdown -r +10

# 指定具体时间重启（如 23:00）
sudo shutdown -r 23:00

# 取消关机计划
sudo shutdown -c
```

### 2 `poweroff` —— 立即切断电源关机

**命令概述**
`poweroff` 直接发送 ACPI 信号关闭系统电源，相当于 `shutdown -h now` 的快捷方式。通常用于快速关机，但不会给其他用户发送警告，也不会等待后台进程安全结束（不如 `shutdown` 优雅）。

**基本格式**

```bash
poweroff [选项]
```

**常用选项**

|  选项  |               功能描述               |      示例       |
| :--: | :------------------------------: | :-----------: |
| `-f` |   强制关机，不调用 `shutdown`，直接切换运行级别   | `poweroff -f` |
| `-w` | 仅写入 wtmp 日志（/var/log/wtmp），不实际关机 | `poweroff -w` |

**示例**

```bash
# 立即关机（推荐使用 shutdown 更安全）
sudo poweroff

# 强制关机（绕过正常关机流程，可能丢失数据）
sudo poweroff -f
```

### 3 `reboot` —— 重启系统

**命令概述**
`reboot` 直接重启系统，相当于 `shutdown -r now` 的快捷方式。同样地，建议优先使用 `shutdown -r` 以便给用户提醒。

**基本格式**

```bash
reboot [选项]
```

**常用选项**

|  选项  |        功能描述         |     示例      |
| :--: | :-----------------: | :---------: |
| `-f` | 强制重启，不调用 `shutdown` | `reboot -f` |
| `-p` |   重启后切断电源（若硬件支持）    | `reboot -p` |

**示例**

```bash
# 立即重启
sudo reboot

# 强制重启
sudo reboot -f
```

### 4 `halt` —— 停止所有 CPU 活动（停止系统）

**命令概述**
`halt` 停止所有进程并让系统进入停机状态，但通常不切断电源（与 `poweroff` 区别在于后者会关电）。在现代系统中，`halt` 默认行为与 `poweroff` 类似，但具体取决于系统配置。

**基本格式**

```bash
halt [选项]
```

**常用选项**

|  选项  |         功能描述          |    示例     |
| :--: | :-------------------: | :-------: |
| `-f` |  强制停机，不调用 `shutdown`  | `halt -f` |
| `-p` | 停机后切断电源（等同于 poweroff） | `halt -p` |

**示例**

```bash
# 停止系统（不关电）
sudo halt

# 停止并关电
sudo halt -p
```