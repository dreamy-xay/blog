---
title: 【存储初识】06-用户态文件系统FUSE
tags:
  - Linux
  - 文件系统
  - FUSE
categories:
  - 存储
  - 基本概念
comments: true
toc: true
toc_number: false
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 97daf1b0
date: 2026-07-06 16:44:22
updated: 2026-07-09 20:03:52
keywords:
description:
top_img:
cover:
---

## 一、单机文件系统：内核态与 VFS

**文件系统**作为操作系统中的核心底层组件，负责频繁操作存储设备，因此最初的设计完全**在内核空间中进行**。内核是拥有超级权限的代码，负责管理计算机的核心资源（如 CPU、内存、硬盘、网络等）。当内核代码运行时，程序进入内核态，可以完全访问和操作这些底层设备。而与**内核空间**形成对应的是**用户空间**（User space），这部分代码就是平时常见的各种应用程序，在**用户空间**里程序的**权限受到严格限制**，不能直接访问底层的重要资源。

<div align="center">
    <img src="https://cdn.jsdmirror.cn/gh/dreamy-xay/figurebed@main/2026-07/内核空间与用户空间_1783567886395.png" width="450px" />
    <strong style="color: #1fb9fb; margin: -20px 0px 20px 0px; display: block;">内核空间与用户空间示意图</strong>
</div>

如果应用程序需要使用文件系统，必须通过操作系统设计好的接口来进行访问，比如 **OPEN、READ、WRITE 等系统调用**。系统调用的作用是搭建起用户空间和内核空间的桥梁。当应用程序调用系统调用时，它就会进入一段内核空间代码，等执行完毕后，再把结果返回给用户空间。

<div align="center">
    <img src="https://cdn.jsdmirror.cn/gh/dreamy-xay/figurebed@main/2026-07/系统调用架构图_1783567891894.png" width="450px" />
    <strong style="color: #1fb9fb; margin: -20px 0px 20px 0px; display: block;">系统调用架构图</strong>
</div>

内核通过 VFS（Virtual File System，虚拟文件系统）封装了一套通用的虚拟文件系统接口，**向上**以系统调用的形式暴露给用户态，**向下**给底层的文件系统规定编程接口，底层文件系统需要按照 VFS 的格式来实现自己的文件系统接口。因此，用户态访问底层文件系统的标准流程一般是：**系统调用 → VFS → 底层文件系统 → 物理设备**。

{% note primary no-icon flat %}
<strong style="color: #6F42C1;">✨ 例如</strong>
<span style="display: inline-block; padding-left: 1.8em;">在应用程序中调用open，这个调用到达VFS层以后，VFS会根据路径在树状结构中逐级查找，最终找到对应的目标和所属的底层文件系统，然后将open调用传递给底层文件系统。</span>
{% endnote %}

Linux 内核支持数十种不同的文件系统，VFS 的可扩展性为后续 FUSE 在用户态实现调用内核态的功能提供了基础。

## 二、网络文件系统 NFS：首次突破内核态

单台计算机已难以满足不断增长的计算与存储需求，多机协同成为必然。在此背景下，**网络文件系统**（NFS）应运而生——它通过客户端-服务器模型，将远程服务器上的文件系统目录挂载到本地节点，使应用程序能够像访问本地存储一样，透明、无缝地访问远程数据，实现了跨网络的文件共享与统一访问。

<div align="center">
    <img src="https://cdn.jsdmirror.cn/gh/dreamy-xay/figurebed@main/2026-07/NFS架构图_1783567865628.png" width="600px" />
    <strong style="color: #1fb9fb; margin: -20px 0px 20px 0px; display: block;">NFS架构图</strong>
</div>

**NFS** 的出现具有重要的**里程碑意义**：它证明了文件系统不必严格绑定在本地内核中，而是可以通过网络协议在更广泛的范围内提供服务。这种“**突破内核态**”的思想为后来 **FUSE** 的设计提供了重要的借鉴——既然文件系统可以通过网络跨越机器边界，那么是否也可以跨越“内核态与用户态”的边界？这一思路最终促成了 FUSE 的诞生。

## 三、FUSE 的设计与实现

FUSE（Filesystem in Userspace）是一个允许用户在用户态创建自定义文件系统的接口，诞生于 2001 年。FUSE 的出现大大降低了文件系统开发的门槛，使得开发者能够在不修改内核代码的情况下实现创新的文件系统功能。

<div align="center">
    <img src="https://cdn.jsdmirror.cn/gh/dreamy-xay/figurebed@main/2026-07/FUSE操作示意图_1783567843304.png" width="500px" />
    <strong style="color: #1fb9fb; margin: -20px 0px 20px 0px; display: block;">FUSE操作示意图</strong>
</div>

### 1 FUSE 的组成

FUSE 主要由**三部分组成：**
- **FUSE 内核模块（fuse.ko）**：实现了和 VFS 的对接，实现了一个能被用户空间进程打开的设备。当 VFS 发来文件操作请求之后，将请求转化为特定格式，并通过设备传递给用户空间进程；用户空间进程处理完请求后，将结果返回给 fuse 内核模块，内核模块再将其还原为 Linux kernel 需要的格式，并返回给 VFS。
- **用户空间库 libfuse**：负责和内核空间通信，接收来自 /dev/fuse 的请求，并将其转化为一系列的函数调用，将结果写回到 /dev/fuse。libfuse 提供了两个 API：
	- **high-level 同步 API**：回调函数使用文件名和路径工作，使用简单，适合初学者。
	- **low-level 异步 API**：回调函数必须使用索引节点 inode 工作，灵活性更大，适合有经验的开发者。
- **挂载工具 fusermount**：一个 setuid-root 程序，实现用户态文件系统的挂载和卸载，普通用户通过它来执行这些操作。

### 2 FUSE 的工作流程

FUSE 的核心是一个内核模块和一个用户空间库，两者通过 /dev/fuse 设备进行通信。当运行一个 FUSE 文件系统程序时，完整的交互流程如下：
- **挂载阶段**：用户运行 FUSE 程序并指定挂载点，fusermount 工具将该程序注册为挂载点的文件系统提供者。此时，内核中的 fuse 模块与用户空间进程建立连接。
- **请求阶段**：当应用程序对挂载点下的文件发起系统调用（如 open、read、write）时，VFS 将请求转发给 fuse 内核模块。内核模块将请求封装成特定格式的消息，写入 /dev/fuse 设备。
- **处理阶段**：用户空间的 FUSE 程序（链接了 libfuse 库）通过 fuse_main 主循环持续从 /dev/fuse 读取请求消息，解析后调用开发者预先注册的回调函数（如 getattr、readdir、read 等）进行业务逻辑处理。
- **返回阶段**：回调函数执行完毕后，将结果（数据或错误码）通过 libfuse 写回 /dev/fuse 设备。fuse 内核模块读取该结果，将其还原为内核所需的格式，返回给 VFS，最终由 VFS 将结果返回给发起调用的应用程序。

<div align="center">
    <img src="https://cdn.jsdmirror.cn/gh/dreamy-xay/figurebed@main/2026-07/FUSE工作流程图_1783567852257.gif" width="600px" />
    <strong style="color: #1fb9fb; margin: -20px 0px 20px 0px; display: block;">FUSE工作流程图</strong>
</div>

FUSE 架构带来了**巨大灵活性：**
- 文件系统逻辑运行在用户空间，崩溃了也不会拖垮内核。
- 开发者可以用任何语言编写，只要该语言的 FUSE 绑定库能处理好与 libfuse 或 /dev/fuse 的通信。

## 四、FUSE 的使用

### 1 FUSE 的两种 API

FUSE 提供了两种接口：
- **fuse_operations（high-level API）**：较为上层的接口，使用简单、容易上手，适合初学者。回调函数使用文件名和路径工作。通过 `fuse_main` 函数将其传入 FUSE。
- **fuse_lowlevel_ops（low-level API）**：较底层的接口，灵活性大，但需要有 FS 开发经验。回调函数必须使用索引节点 inode 工作，响应发送必须显式使用单独的 API 函数。通过 `fuse_session_loop` 函数实现。

### 2 定义文件系统操作

使用 high-level API 时，需要定义一个 `fuse_operations` 结构体，并实现必要的回调函数：

```C
static struct fuse_operations myfs_ops = {
    .init      = myfs_init,
    .destroy   = myfs_destroy,
    .getattr   = myfs_getattr,
    .readdir   = myfs_readdir,
    .open      = myfs_open,
    .read      = myfs_read,
    .write     = myfs_write,
    .release   = myfs_release,
    // 其他操作函数...
};
```

**核心回调函数说明**：
- **getattr**：获取文件属性（如文件大小、权限、修改时间等）
- **readdir**：读取目录内容，通过 `filler` 函数将目录项返回给 FUSE 内核模块
- **open/read/write**：实现文件的打开、读取和写入操作
- **init/destroy**：文件系统初始化和销毁时的回调

### 3 编写主函数

使用 `fuse_main` 函数启动文件系统：

```C
int main(int argc, char *argv[]) {
    return fuse_main(argc, argv, &myfs_ops, NULL);
}
```

`fuse_main` 会启动 libfuse 的主循环，从 /dev/fuse 读取请求，根据注册的回调函数进行处理。

### 4 Hello World 示例

以下是一个极简的 Hello World 文件系统示例——当用户执行 `ls` 时，目录下只显示一个名为 "Hello-world" 的文件。

**实现 readdir**：

```C
static int cfs_readdir(const char* path, void* buf, fuse_fill_dir_t filler, 
                       off_t offset, struct fuse_file_info* fi) {
    // 只返回一个名为 "Hello-world" 的目录项
    return filler(buf, "Hello-world", NULL, 0);
}
```

**实现 getattr**：

```C
static int cfs_getattr(const char* path, struct stat *stbuf) {
    // 设置文件属性（如文件大小、权限等）
    // ...
}
```

### 5 编译 FUSE 程序

编译时需要链接 fuse 库：

```bash
gcc -o myfs myfs.c `pkg-config fuse3 --cflags --libs`
```

如果使用 FUSE 2.x：

```bash
gcc -o myfs myfs.c -lfuse
```

### 6 挂载文件系统

**创建挂载点**：

```bash
mkdir ~/mnt
```

**运行 FUSE 程序挂载**：

```bash
./myfs ~/mnt
```

FUSE 程序本身会处理挂载操作，挂载成功后，可以像访问普通文件系统一样操作挂载点下的文件。

**常用挂载选项**：
- `-f`：前台运行（便于调试）
- `-d`：开启调试模式，输出详细的调试信息

```bash
./myfs -f -d ~/mnt
```

### 7 卸载文件系统

使用 `fusermount` 命令卸载：

```bash
fusermount -u ~/mnt
```

对于 FUSE 3.x，使用 `fusermount3`：

```bash
fusermount3 -u ~/mnt
```

## 参考资料

{% note pink 'far fa-lightbulb' modern %}
推荐这篇关于 Linux 用户态文件系统的入门好文：[《FUSE，从内核到用户态文件系统的设计之路》](https://juicefs.com/zh-cn/blog/engineering/fuse-file-system-design)
{% endnote %}

<strong style="color: #db8ef7;">[1]</strong> [FUSE，从内核到用户态文件系统的设计之路](https://juicefs.com/zh-cn/blog/engineering/fuse-file-system-design)
<strong style="color: #db8ef7;">[2]</strong> [linux编程：用户态文件系统FUSE](https://www.cnblogs.com/sunbines/p/17628167.html)
<strong style="color: #db8ef7;">[3]</strong> [用户态文件系统框架FUSE的介绍及示例](https://zhuanlan.zhihu.com/p/59354174)
<strong style="color: #db8ef7;">[4]</strong> [自制文件系统 —— 02 开发者的福音，FUSE文件系统](https://xie.infoq.cn/article/655c0893ed150ff65f2b7a16f)
<strong style="color: #db8ef7;">[5]</strong> [FUSE的使用及示例](https://zhoubofsy.github.io/2017/01/13/linux/filesystem-userspace-usage/)

## 专有名词

{% note pink 'far fa-lightbulb' modern %}
其他专有名词的释义请提前参阅[《01-块、文件、对象存储》的专有名词]({% post_path 【存储初识】01-块、文件、对象存储 %}#专有名词)。
{% endnote %}