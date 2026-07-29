---
title: 【Linux 内核】VFS 基础：driect write
tags:
  - 虚拟文件系统
  - C
  - 源码分析
categories:
  - Linux 内核
  - VFS
comments: true
toc: true
toc_number: false
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 71fe51a6
keywords: ''
description: ''
top_img: ''
cover: ''
date: 2026-07-28 15:34:51
updated: 2026-07-29 15:40:34
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从缓冲写入到直接写入

在<a href="{% post_path '【Linux 内核】VFS 基础：write' %}">《【Linux 内核】VFS 基础：write》</a>中，详细分析了带页缓存（Page Cache）的缓冲写入（Buffered Write）流程。缓冲写入的核心思想是：数据先写入页缓存，标记为脏页，然后由内核后台线程异步写回磁盘。这种设计大幅提升了写入性能，但也带来了一些问题：
- **数据安全性**：数据在页缓存中停留期间，如果系统崩溃，数据可能丢失
- **双缓冲问题**：应用程序有自己的缓存，内核又有页缓存，造成内存浪费
- **性能不可预测**：脏页回写可能在任何时候触发，影响 I/O 延迟的确定性

为了解决这些问题，Linux 提供了 **O_DIRECT** 标志。当文件以 O_DIRECT 模式打开时，I/O 操作会绕过页缓存，直接将数据从用户空间传输到存储设备。

```c
int fd = open("/path/to/file", O_RDWR | O_DIRECT);
```

O_DIRECT 最初由 IRIX 系统在 XFS 文件系统中引入，主要服务于数据库工作负载。其设计目标是允许数据库绕过页缓存和缓冲区缓存，避免不必要的 I/O 重复。Linux 内核中的 O_DIRECT 实现由 Andrew Morton 于 2002 年 7 月 4 日完成初始版本。

## 二、O_DIRECT 与 Buffered Write 的核心区别

| 特性    | Buffered Write（页缓存） | O_DIRECT（直接 I/O）   |
| ----- | ------------------- | ------------------ |
| 数据路径  | 用户空间 → 页缓存 → 磁盘     | 用户空间 → 磁盘（绕过页缓存）   |
| 写回时机  | 延迟写回（后台线程）          | 立即提交到块设备层          |
| 数据安全性 | 崩溃可能丢失数据            | 提交后即持久（需配合 O_SYNC） |
| 内存使用  | 占用页缓存内存             | 不占用页缓存             |
| 对齐要求  | 无特殊要求               | 缓冲区、偏移、长度均需对齐      |
| 适用场景  | 通用文件操作              | 数据库、大数据等自管理缓存的应用   |

O_DIRECT 的关键特性是**绕过页缓存**。但 O_DIRECT 并不保证数据立即写入磁盘——数据可能仍然停留在块设备层的 I/O 队列中，或磁盘自身的硬件缓存中。如果需要确保数据真正落盘，必须结合 O_SYNC 标志或调用 fsync。

## 三、O_DIRECT 的对齐限制

O_DIRECT 最重要的使用限制是**对齐要求**。由于直接 I/O 涉及对块设备的直接访问，Linux 内核要求：
1. **缓冲区地址**：用户空间缓冲区必须对齐到块大小的整数倍
2. **文件偏移量**：写入的起始位置必须是块大小的整数倍
3. **传输长度**：待写入的数据长度必须是块大小的整数倍

这里的块大小通常指底层设备的物理块大小（通常是 512 字节或 4096 字节）。在 Linux 内核 2.6 以前，这项要求更加严格：在 Linux 内核 2.4 中，所有的操作都必须和文件系统的逻辑块大小对齐（一般是 4KB）。

不遵守上述任一限制，write 系统调用将返回 `-EINVAL` 错误。

从 Linux 6.1 开始，可以通过 `statx(2)` 系统调用配合 `STATX_DIOALIGN` 标志查询文件的 O_DIRECT 对齐限制。

为了满足对齐要求，应用程序通常使用 `memalign()` 或 `posix_memalign()` 函数分配对齐的内存。

## 四、O_DIRECT 在内核中的实现

### 1 从系统调用到 direct_IO

O_DIRECT 写入的调用链从用户空间的 `write` 开始，与缓冲写入共享前几层：

```text
用户空间: write(fd, buf, count)   // fd 以 O_DIRECT 打开
    ↓ (系统调用)
内核入口: sys_write()                      [fs/read_write.c]
    ↓
ksys_write()                               [fs/read_write.c]
    ├── fdget_pos()                        // 获取文件对象
    ├── vfs_write()                        // VFS 层统一写入接口
    │   ├── 权限检查
    │   ├── access_ok()                    // 检查用户缓冲区
    │   ├── rw_verify_area()               // 检查写入区域
    │   └── file->f_op->write_iter()       // 具体文件系统的写入
    │       └── ext4_file_write_iter()     [fs/ext4/file.c]
    │           └── (检测到 O_DIRECT)
    │               └── iomap_dio_rw()     [fs/iomap/direct-io.c]
    │                   或 do_blockdev_direct_IO() [fs/direct-io.c]
    ├── 更新 f_pos                         // 更新文件偏移
    └── fdput_pos()                        // 释放文件引用
```

关键的分叉点在于 `vfs_write` 调用具体文件系统的 `write_iter` 方法时。对于 ext4 文件系统，`ext4_file_write_iter` 会根据文件是否以 O_DIRECT 打开，选择不同的路径：
- **缓冲写入**：调用 `generic_file_buffered_write` → `generic_perform_write`
- **直接写入**：调用 `ext4_direct_IO` → `iomap_dio_rw` 或 `do_blockdev_direct_IO`

### 2 direct-io.c：传统直接 I/O 的核心实现

O_DIRECT 的传统核心实现位于 `fs/direct-io.c`。其设计围绕 `dio_block` 这一概念展开——`dio_block` 的大小介于硬件扇区大小和文件系统块大小之间，在每次调用时确定。

```c
/*
 * This code generally works in units of "dio_blocks". A dio_block is
 * somewhere between the hard sector size and the filesystem block size. it
 * is determined on a per-invocation basis.
 */
```

核心函数 `do_blockdev_direct_IO` 负责处理直接 I/O 的提交。其主要工作包括：
1. **检查对齐**：验证用户缓冲区、文件偏移量和数据长度是否满足对齐要求
2. **映射用户页面**：通过 `get_user_pages`（或更新的 `pin_user_pages_fast`）将用户空间的缓冲区页面固定（pin）在内存中，防止在 I/O 过程中被交换出去。`DIO_PAGES` 宏定义了单次调用映射的用户页数量
3. **构建 BIO**：将用户数据组织成块 I/O 请求（BIO），提交给块设备层
4. **处理完成**：I/O 完成后，释放固定的用户页面

`do_blockdev_direct_IO` 还会维护 `inode->i_dio_count` 计数器，用于保护文件在直接 I/O 进行中不被截断（truncate）。

### 3 iomap：现代文件系统的直接 I/O 路径

较新的内核版本中，许多文件系统（如 XFS、ext4、btrfs）使用 **iomap** 框架来处理直接 I/O。`iomap_dio_rw` 是这一框架的核心函数，它提供了比传统 `direct-io.c` 更灵活、更高效的直接 I/O 实现。

iomap 框架的优势在于：
- 统一了文件系统和块设备的 I/O 映射逻辑
- 更好地支持了现代存储特性（如原子写、稀疏文件等）
- 与 io_uring 等异步 I/O 接口的集成更紧密

许多文件系统已经从传统的 `__blockdev_direct_IO()` 切换到 `iomap_dio_rw()`。对于小块直接 I/O，iomap 框架还提供了简化的 DIO 路径来减少软件开销。

## 五、O_DIRECT 与 O_SYNC 的区别与结合

### 1 O_DIRECT ≠ 数据持久化

O_DIRECT 只保证**绕过页缓存**，并不保证数据已经写入物理磁盘。数据可能仍然停留在：
- 块设备层的 I/O 队列中
- 磁盘自身的硬件缓存中

### 2 O_SYNC：同步写入

O_SYNC 标志表示在进行写操作时，会采用 write-through 策略。这意味着在数据写入页面缓存后，系统会等待数据被安全地写入磁盘，然后再返回。

### 3 结合使用

同时使用 `O_DIRECT | O_SYNC` 可以实现**直接且同步**的写入：

- O_DIRECT 绕过页缓存
- O_SYNC 确保数据落盘

**性能权衡**：同时使用两个标志会显著降低性能，因为每次写入都既要绕过缓存又要等待磁盘确认。在实际应用中，数据库系统（如 MySQL/InnoDB）通常对数据文件使用 O_DIRECT，对 redo 日志使用 O_SYNC。

## 六、O_DIRECT 的适用场景与注意事项

### 1 适用场景

O_DIRECT 主要适用于以下场景：
- **数据库系统**（MySQL、PostgreSQL 等）：数据库有自己的缓存管理，不希望内核再做一次缓存
- **大数据处理**（Hadoop、Spark 等）：处理海量数据时需要高效的 I/O
- **需要可预测 I/O 延迟的应用**：避免页缓存带来的不确定性
- **自管理缓存的应用程序**：应用程序已经实现了自己的缓存策略

### 2 注意事项

**性能可能降低**：内核对页缓存做了大量优化（预读、簇写入、缓存共享等），绕过这些优化可能导致性能下降。

**缓存一致性问题**：如果同一文件被一个进程以 O_DIRECT 打开，另一个进程以普通（缓冲）方式打开，直接 I/O 读写的数据与页缓存中的数据之间不存在一致性。

**并非所有文件系统都支持**：某些文件系统或块设备可能不支持 O_DIRECT。

**对齐限制**：应用程序必须自行处理内存对齐、偏移对齐和长度对齐。

## 七、完整的 O_DIRECT 写入调用链

```text
用户空间: write(fd, buf, count)   // fd 以 O_DIRECT 打开
    ↓ (系统调用)
内核入口: sys_write()                      [fs/read_write.c]
    ↓
ksys_write()                               [fs/read_write.c]
    ├── fdget_pos()                        // 获取文件对象
    ├── vfs_write()                        // VFS 层统一写入接口
    │   ├── 权限检查
    │   ├── access_ok()                    // 检查用户缓冲区
    │   ├── rw_verify_area()               // 检查写入区域
    │   └── file->f_op->write_iter()       // 具体文件系统的写入
    │       └── ext4_file_write_iter()     [fs/ext4/file.c]
    │           └── (检测到 O_DIRECT)
    │               └── iomap_dio_rw()     [fs/iomap/direct-io.c]
    │                   或 do_blockdev_direct_IO() [fs/direct-io.c]
    │                       ├── 检查对齐要求
    │                       ├── get_user_pages() / pin_user_pages_fast()
    │                       │   └── 固定用户页面（防止被交换）
    │                       ├── 构建 BIO
    │                       ├── submit_bio()          // 提交到块设备层
    │                       └── 等待完成（同步）或返回（异步）
    ├── 更新 f_pos                         // 更新文件偏移
    └── fdput_pos()                        // 释放文件引用
    ↓ (块设备层)
块设备层 / I/O 调度器
    ↓
设备驱动
    ↓
物理磁盘
```

## 八、总结

O_DIRECT 是 Linux 提供给应用程序的一种特殊 I/O 模式，其核心特征是**绕过页缓存**，直接将数据从用户空间传输到存储设备。它与缓冲写入（Buffered Write）的主要区别在于：
1. **数据路径不同**：绕过页缓存，减少一次内存拷贝
2. **数据持久性语义不同**：O_DIRECT 本身不保证落盘，需配合 O_SYNC
3. **有严格的对齐要求**：缓冲区、偏移、长度均需对齐到块大小
4. **适用场景特定**：主要用于数据库等自管理缓存的应用

O_DIRECT 在内核中的实现经历了从传统的 `direct-io.c` 到现代 `iomap` 框架的演进。其核心逻辑围绕用户页面固定（get_user_pages）、BIO 构建和块设备提交展开。

对于大多数通用应用程序，缓冲写入是更好的选择——内核的页缓存优化（预读、簇写入、延迟回写等）能提供更好的综合性能。O_DIRECT 只有在应用程序有明确的低延迟、可预测 I/O 或自管理缓存需求时，才值得使用。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [Linux系统编程（第2版）- 2.5 直接I/O](https://developer.aliyun.com/article/103569)
<strong style="color: #db8ef7;">[2]</strong> [Linux系统：保证数据安全落盘](https://m.yisu.com/zixun/298583.html)
<strong style="color: #db8ef7;">[3]</strong> [Linux下的数据安全落盘：O_DIRECT与O_SYNC的深入解析](https://cloud.baidu.com/article/3077284)
<strong style="color: #db8ef7;">[4]</strong> [Linux内核源码 - fs/direct-io.c (O_DIRECT 传统实现)](https://archive.softwareheritage.org/browse/content/sha1_git:bbd05f1a21453b931f9e6f7547abbc3b577ff9f9/)
<strong style="color: #db8ef7;">[5]</strong> [Linux内核源码 - fs/iomap/direct-io.c (iomap DIO)](https://elixir.bootlin.com/linux/latest/source/fs/iomap/direct-io.c)
<strong style="color: #db8ef7;">[6]</strong> [Linux内核源码 - fs/read_write.c (read/write系统调用)](https://elixir.bootlin.com/linux/latest/source/fs/read_write.c)
<strong style="color: #db8ef7;">[7]</strong> [Direct IO alignment restrictions - Linux man pages](https://man7.org/linux/man-pages/man2/open.2.html)