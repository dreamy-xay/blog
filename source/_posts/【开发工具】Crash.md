---
title: 【开发工具】Crash
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
date: 2026-07-17 15:37:28
updated: 2026-07-27 15:57:14
---


## 一、Crash 简介

Crash 是 Red Hat 工程师开发的一款强大的内核调试工具，被广泛用于分析 Linux 内核崩溃（Kernel Panic）问题。在 Linux 生产环境中，当系统发生严重错误（如空指针解引用、死锁、内存越界等）时，内核会触发 Panic。此时，如果预先配置了 **kdump** 服务，系统会切换到一个预先保留的“捕获内核”（crashkernel），将崩溃时刻的内存快照保存为 **vmcore** 文件。Crash 工具则配合内核调试符号（vmlinux）对 vmcore 进行离线分析，帮助开发者快速定位问题根源。

相较于仅查看日志，Crash 能够提供崩溃时刻完整的寄存器状态、调用栈、内存数据、进程信息等，是解决“疑难杂症”的必备利器。

## 二、Crash 工作原理（理解数据来源）

Crash 工具本身是一个命令行交互式解析器，其工作依赖两个核心输入：

- **vmcore**：由 kdump 生成的物理内存转储文件，包含了崩溃时所有 CPU 的上下文、进程列表、内核数据结构、页表等原始二进制数据。
- **vmlinux**：带调试符号的内核映像（通常位于 `/usr/lib/debug/.../vmlinux`），其中存储了内核函数、变量、数据结构的符号表及源代码行号信息。

Crash 的工作流程可以概括为：
1. 用户输入命令（如 `bt`、`log`、`ps`）。
2. Crash 根据命令类型，在 vmlinux 中查找对应符号的地址和数据结构布局。
3. 根据查到的地址，从 vmcore 中读取实际的内存数据（如栈帧、进程描述符、内存页等）。
4. 将原始数据解析成人类可读的形式（函数名、偏移量、变量值、源代码位置）并输出。

因此，即使没有实机环境，只要有正确的 vmcore 和匹配的 vmlinux，就可以在任何安装了 crash 工具的主机上复现分析。

## 三、如何使用 Crash 分析 vmcore

### 1 启动 Crash

当系统发生 Panic 并生成 vmcore 后（通常位于 `/var/crash/` 或 `/data/crash/`），我们可以通过以下命令进入 Crash 交互界面：

```bash
crash /path/to/vmcore /usr/lib/debug/usr/lib/modules/$(uname -r)/vmlinux
```

如果系统已配置好调试符号，且当前内核版本与 vmcore 一致，也可以简写为：

```bash
crash vmcore
```

此时 Crash 会自动尝试匹配当前系统的 vmlinux。启动成功后会显示类似如下的提示符：

```text
crash> 
```

表示已进入分析环境。

### 2 基础交互

Crash 支持大量的子命令，大部分与常见 Linux 调试工具（如 gdb）类似，但专门针对内核数据结构进行了优化。可以通过 `help` 查看所有命令列表，或 `help <命令>` 查看具体用法。

## 四、常用命令详解与实战

### 1 `bt` – 查看崩溃堆栈（最重要）

`bt`（backtrace）用于显示崩溃时刻的调用栈，是定位问题的第一步。执行：

```text
crash> bt
```

输出会列出从最底层硬件上下文到最顶层系统调用的完整函数调用链。通常编号 `#0` 是最后执行的位置（即崩溃发生点），编号越大越接近用户态入口。

**重点观察：**

- **`RIP` 或 `exception RIP`**：指示出错指令的地址。
- **栈帧中的函数名**：可快速定位是哪个模块或子系统出了问题。

示例分析：

```text
crash> bt
...
#10 [ffff88007e5c3b98] sysrq_handle_crash at ffffffff90a61bf6
...
```

表示崩溃发生在 `sysrq_handle_crash` 函数中，RIP 值为 `ffffffff90a61bf6`。

接着使用 `dis` 查看该地址处的汇编及对应的源代码：

```text
crash> dis -rl ffffffff90a61bf6
/usr/src/debug/.../drivers/tty/sysrq.c:145
0xffffffff90a61bf6 <sysrq_handle_crash+22>: movb   $0x1,0x0
```

可见错误指令是向地址 `0x0` 写入数据，触发空指针异常。结合函数名可知这是通过 `echo c > /proc/sysrq-trigger` 手动触发的测试 Panic。

### 2 `log` – 查看内核日志

`log` 命令显示崩溃前内核环形缓冲区（dmesg）的内容，包含 Panic 发生前后的关键信息，往往与 `bt` 配合使用。

```text
crash> log
```

可以重定向到文件方便查阅：

```text
crash> log > crash_log.txt
```

### 3 `ps` – 查看进程状态

`ps` 列出系统崩溃时的所有进程，包括进程 PID、状态、命令名等。常用参数：

- `ps -p <PID>`：查看特定进程。
- `ps -r`：只显示运行中的进程。
- `ps -l`：显示更详细的信息（如父进程、优先级等）。

通过观察哪些进程正在运行或处于 D 状态（不可中断睡眠），可以帮助判断是否存在资源竞争或死锁。

### 4 `set` – 切换上下文

Crash 默认使用崩溃发生的 CPU 上下文（或当前活动进程）。若要分析其他进程的堆栈或内存空间，可以使用 `set` 切换：

```text
crash> set <PID>
```

切换后，`bt` 会显示该进程的调用栈，`vm` 会显示该进程的虚拟内存映射。

### 5 `files` – 查看进程打开的文件

当怀疑某个进程因文件操作导致崩溃时，可先用 `ps` 找到 PID，再执行：

```text
crash> files <PID>
```

输出该进程的文件描述符列表，包括文件路径、偏移量、权限等，有助于排查文件系统或设备驱动问题。

### 6 `vm` – 查看进程的虚拟内存区域（VMA）

`vm` 命令显示进程的地址空间布局，包括各个 VMA 的起始地址、权限、文件映射等。例如：

```text
crash> vm <PID>
```

可检查堆、栈、代码段是否异常，或某些内存区域是否被意外覆盖。

### 7 `kmem` – 查看内核内存分配情况

`kmem` 是分析内存泄漏或内存碎片的重要命令。常用子命令：

- `kmem -i`：查看总体内存信息（总内存、已用、空闲等）。
- `kmem -s`：显示 slab 缓存的使用状况。
- `kmem -f`：查看空闲内存区域。

通过对比正常状态和崩溃时的内存统计数据，可以定位是否因内存耗尽触发 Panic。

### 8 `mod` – 查看加载的内核模块

当 Panic 发生在内核模块中时，`mod` 命令可以显示所有已加载模块的基地址和大小，便于结合 `bt` 中的偏移量计算模块内函数位置。

```text
crash> mod
```

### 9 `foreach` – 对所有进程执行同一命令

例如，查看所有进程的堆栈：

```text
crash> foreach bt
```

该命令会遍历所有进程并打印其调用栈，对排查全局性死锁或阻塞非常有用。

## 五、实战分析流程

当拿到一个 vmcore 后，建议按以下步骤逐步推进：

1. **查看日志**：`log` 快速了解 Panic 前系统状态，是否有 OOM、硬件错误、时间戳等。
2. **查看堆栈**：`bt` 定位出错的函数和指令地址。
3. **反汇编定位代码行**：`dis -rl RIP` 查看出错指令对应的源码行。
4. **检查相关进程**：`ps` 查看当前进程上下文，`set <PID>` 切换后再次 `bt`，了解调用链全貌。
5. **检查内存状态**：`kmem -i` 确认剩余内存是否充足。
6. **检查模块**：如果堆栈中出现非内核核心函数（如驱动），用 `mod` 确认模块版本。
7. **深入数据结构**：根据出错函数的变量名，可使用 `struct` 或 `union` 命令查看某个内核数据结构的具体内容（例如 `struct task_struct` 或 `struct inode`）。例如 `crash> struct task_struct 0xffff88007e5c0000` 可打印该进程描述符的成员值。

## 六、额外进阶技巧

### 1 使用 `alias` 简化高频命令

在 Crash 中可以为复杂命令设置简写，例如：

```text
crash> alias btfull "bt -f -l"
```

之后只需输入 `btfull` 即可显示完整堆栈及文件名行号。

### 2 批量执行命令脚本

将多条分析命令写入文本文件（如 `cmds.txt`），然后通过 `-i` 参数批量执行：

```bash
crash vmcore -i cmds.txt
```

适合自动化生成报告。

### 3 比较不同 vmcore 的差异

如果问题可复现，可先后生成两个 vmcore（正常与异常），利用 Crash 的 `diff` 功能（结合外部工具）对比关键数据结构的变化，或分别导出日志再比较。

### 4 使用 `gdb` 模式

Crash 内置了 GDB 兼容模式，可以在命令前加 `gdb` 来执行标准的 GDB 命令（如 `info registers`、`x` 等），便于熟悉 GDB 的用户快速上手。

## 七、常见问题与注意事项

- **符号不匹配**：分析时必须确保 vmlinux 与 vmcore 来源于**同一内核版本**，否则 `bt` 或 `dis` 会给出错误地址解析。建议保留内核调试包和 vmcore 一同备份。
- **内存预留不足**：若 kdump 未预留足够内存（`crashkernel=auto` 可能不够），可能导致 vmcore 生成失败。需根据实际物理内存调整启动参数，如 `crashkernel=512M`。
- **手动触发 Panic**：使用 `echo c > /proc/sysrq-trigger` 仅适用于测试环境，生产环境切勿操作，否则会立即重启。
- **调试信息缺失**：若内核编译时未开启 `CONFIG_DEBUG_INFO`，vmlinux 不含调试符号，Crash 功能将受限。建议发行版内核通常默认开启，定制内核需注意。

## 参考资料

<strong style="color: #db8ef7;">[1]</strong> [linux系统奔溃之vmcore：kdump 的亲密战友 crash](https://cloud.tencent.com/developer/article/1645411)
<strong style="color: #db8ef7;">[2]</strong> [crash调试内核入门](https://blog.csdn.net/py199122/article/details/120525497)
<strong style="color: #db8ef7;">[3]</strong> [调试：crash使用方法](https://www.cnblogs.com/dongxb/p/17364995.html)
<strong style="color: #db8ef7;">[4]</strong> [CRASH安装和调试](https://www.cnblogs.com/Linux-tech/p/14110330.html)
<strong style="color: #db8ef7;">[5]</strong> [crash 工具的使用](https://zhuanlan.zhihu.com/p/707500778)