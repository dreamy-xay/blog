---
title: 【开发工具】GDB
tags:
  - C/C++
  - 调试工具
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
abbrlink: 77463f39
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-16 11:21:28
updated: 2026-07-27 15:57:20
---

## 一、 GDB 简介

GNU调试器（GNU Debugger，简称GDB）是GNU项目开发的一款功能强大的命令行调试工具，主要用于C、C++等编程语言的调试。作为Linux/Unix系统下最常用的调试器之一，GDB可以帮助开发者：
- 跟踪程序执行流程
- 设置断点观察程序状态
- 查看和修改变量值
- 分析程序崩溃时的核心转储（core dump）
- 检查函数调用栈
- 反向调试（从错误点回溯）

GDB支持多种编程语言（C、C++、Go、Rust等）和多种处理器架构（x86、ARM等），是系统程序员和应用程序开发者的必备工具。

## 二、安装与编译

|      发行版      |            安装命令            |
| :-----------: | :------------------------: |
| Debian/Ubuntu | `sudo apt-get install gdb` |
|  CentOS/RHEL  |   `sudo yum install gdb`   |
|    Fedora     |   `sudo dnf install gdb`   |
|  Arch Linux   |    `sudo pacman -S gdb`    |

编译时需添加 `-g` 生成调试信息，建议配合 `-O0` 禁用优化以避免断点失效：

```bash
gcc -g -O0 program.c -o program
g++ -g -O0 program.cpp -o program
```

## 三、基本命令与使用
### 1 启动与退出

| 命令                               | 说明            |
| -------------------------------- | ------------- |
| `gdb ./program`                  | 加载可执行文件       |
| `gdb -p PID`                     | 附加到运行中的进程     |
| `gdb ./program core`             | 分析core dump文件 |
| `gdb --args ./program arg1 arg2` | 带参数启动         |
| `quit` / `q`                     | 退出            |

### 2 基本命令速查

|       命令（缩写）       |                                   功能                                   |
| :----------------: | :--------------------------------------------------------------------: |
|    `run` (`r`)     |                                  开始执行                                  |
|  `continue` (`c`)  |                                继续至下一断点                                 |
|    `next` (`n`)    |                              单步执行（不进入函数）                               |
|    `step` (`s`)    |                               单步执行（进入函数）                               |
|      `finish`      |                               执行完当前函数并返回                               |
|    `list` (`l`)    |                                 显示源代码                                  |
|   `print` (`p`)    |                      打印变量/表达式值（可指定格式，如`p/x var`）                       |
| `backtrace` (`bt`) |                         显示调用栈（`bt full` 含局部变量）                         |
|   `frame` (`f`)    |                                  切换栈帧                                  |
|    `info` (`i`)    | 显示信息（`info breakpoints`, `info threads`, `info locals`, `info args` 等） |

### 3 断点管理

**设置断点**：

```bash
break main              # 函数入口
break 25                # 当前文件第25行
break file.c:10         # 指定文件行号
break *0x8048000        # 内存地址
break function if x==5  # 条件断点
break file.c:123 thread 2  # 仅在线程2上生效
```

**查看与操作**：

```bash
info breakpoints        # 列出所有断点
delete 2                # 删除编号2
disable 1 / enable 1    # 禁用/启用
```

### 4 变量与内存操作

```bash
print var                     # 打印值
set var var = 10              # 修改值
print array[10]@5             # 打印数组从索引10开始的5个元素
print *(int*)0x1234           # 读取内存地址的值
set {int}0x1234 = 10          # 修改内存地址的值
x/10xw &var                   # 以16进制查看内存
```

## 四、进阶调试技巧
### 1 多线程调试

```bash
info threads                 # 列出所有线程
thread 3                     # 切换到线程3
thread apply all backtrace   # 所有线程调用栈
set scheduler-locking on     # 仅当前线程执行（或 off/non-stop 模式）
set non-stop on              # 允许其他线程继续运行
```

### 2 观察点（Watchpoints）

```bash
watch var     # 变量被修改时中断
rwatch var    # 被读取时中断
awatch var    # 被读取或修改时中断
info watchpoints
```
### 3 信号处理

```bash
info signals                 # 查看信号处理策略
handle SIGSEGV stop          # 收到段错误时暂停
handle SIGINT print          # 打印信息但不停止
```

### 4 Core Dump调试

```bash
ulimit -c unlimited          # 启用core dump（shell中预先设置）
gdb <可执行文件路径> <core文件路径>           # 加载core文件
bt                           # 查看崩溃时调用栈
```

### 5 反向调试（需特定版本）

```bash
record                       # 开始记录执行历史
reverse-step                 # 反向单步
reverse-continue             # 反向继续
```

## 五、脚本自动化与图形前端

**命令文件**：将命令写入 `commands.gdb`，通过 `gdb -x commands.gdb --args ./program arg1 arg2` 自动执行。

**Python扩展**：支持在GDB内嵌入Python脚本，定义复杂断点逻辑等。

**图形前端**：GDB TUI（`gdb -tui`）、cgdb、DDD、Eclipse CDT、VS Code（插件）等。

## 六、典型实战场景

- **段错误调试**：运行后程序收到SIGSEGV，用 `bt` 查看调用栈，用 `print` 检查空指针等。
- **死锁调试**：使用 `gdb -p PID` 附加到卡住的进程，`info threads` 查看线程，`thread apply all bt` 查看各线程调用栈，可定位到 `pthread_mutex_lock` 等待位置。
- **数组越界**：配合 `watch arr[i]` 观察数组元素变化，定位越界写入位置。
- **递归函数**：在函数入口设断点，用 `bt` 观察递归深度和参数变化。
- **条件断点**：在循环内部设 `break 行号 if i == 50`，仅当满足条件时暂停。
- **结合Valgrind**：`valgrind --leak-check=full ./program` 检测内存泄漏，再使用GDB定位具体代码。
### 七、常见问题处理

|              问题              |                     解决方案                     |
| :--------------------------: | :------------------------------------------: |
| “No debugging symbols found” |                 重新编译时添加 `-g`                 |
|            断点不生效             |        检查是否启用优化（改用 `-O0`），或断点位置是否可执行         |
|           多线程调试困难            | 启用 `non-stop` 模式，或使用 `thread apply all` 批量操作 |

## 参考资料

<strong style="color: #db8ef7;">[1]</strong> [Linux gdb 命令](https://www.runoob.com/linux/linux-comm-gdb.html)
<strong style="color: #db8ef7;">[2]</strong> [GDB 实用命令](https://www.cnblogs.com/migrator/p/19173904)
<strong style="color: #db8ef7;">[3]</strong> [GDB调试完全指南：从入门到进阶](https://zhuanlan.zhihu.com/p/1961833750619988266)
<strong style="color: #db8ef7;">[4]</strong> [GDB保姆级调试指南（什么是GDB？GDB如何使用？）](https://blog.csdn.net/weixin_45031801/article/details/134399664)
<strong style="color: #db8ef7;">[5]</strong> [利用gdb对core dump文件进行debug](https://www.cnblogs.com/smartljy/p/18760184)