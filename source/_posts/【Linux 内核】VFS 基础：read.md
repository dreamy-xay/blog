---
title: 【Linux 内核】VFS 基础：read
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
abbrlink: d8c9ca1e
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-23 13:35:12
updated: 2026-07-27 15:58:05
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从用户空间到内核：read 系统调用

用户程序通过 `read` 函数从文件中读取数据，这是最常用的文件操作之一：

```c
ssize_t bytes_read = read(fd, buffer, count);
```

`read` 是标准 C 库提供的函数，它内部会触发系统调用，将控制权从用户空间转移到内核空间。在 64 位 Linux 系统中，`read` 的系统调用号是 0。当用户程序调用 `read` 时，CPU 从用户态切换到内核态，根据系统调用号在系统调用表中查找对应的处理函数 `sys_read`。

## 二、read 系统调用的内核入口

### 1 sys_read：系统调用的定义

在 Linux 内核源码 `fs/read_write.c` 中，`read` 系统调用通过 `SYSCALL_DEFINE3` 宏定义：

```c
SYSCALL_DEFINE3(read, unsigned int, fd, char __user *, buf, size_t, count)
{
    return ksys_read(fd, buf, count);
}
```

`SYSCALL_DEFINE3` 表示该系统调用有三个参数：
- `fd`：文件描述符，标识要读取哪个打开的文件
- `buf`：用户空间缓冲区指针，用于存放读取的数据
- `count`：要读取的字节数

### 2 ksys_read：核心分发函数

`ksys_read` 是 `read` 系统调用的核心实现：

```c
ssize_t ksys_read(unsigned int fd, char __user *buf, size_t count)
{
    struct fd f = fdget_pos(fd);
    ssize_t ret = -EBADF;

    if (f.file) {
        loff_t pos, *ppos = file_ppos(f.file);
        if (ppos) {
            pos = *ppos;
            ppos = &pos;
        }
        ret = vfs_read(f.file, buf, count, ppos);
        if (ret >= 0 && ppos)
            f.file->f_pos = pos;
        fdput_pos(f);
    }
    return ret;
}
```

这个函数主要完成以下工作：
1. **获取文件对象：**`fdget_pos` 根据文件描述符 `fd` 从当前进程的文件描述符表中获取对应的 `struct file` 结构。如果文件描述符无效，返回 `-EBADF`。
2. **获取文件偏移：**`file_ppos` 获取当前文件的读写位置（`f_pos`）。对于普通文件，每次读写操作都会从这个位置开始。
3. **调用 VFS 读取：**`vfs_read` 是 VFS 层提供的统一读取接口，负责调用具体文件系统的读取方法。
4. **更新文件偏移：** 如果读取成功，将新的文件位置写回 `f_pos`。
5. **释放文件引用：**`fdput_pos` 减少文件对象的引用计数。

## 三、vfs_read：VFS 层的统一读取接口

`vfs_read` 是 VFS 层提供的核心读取函数，它屏蔽了不同文件系统的差异，为上层提供统一的读取接口。

```c
ssize_t vfs_read(struct file *file, char __user *buf, size_t count, loff_t *pos)
{
    ssize_t ret;

    /* 1. 检查文件是否可读 */
    if (!(file->f_mode & FMODE_READ))
        return -EBADF;
    if (!(file->f_mode & FMODE_CAN_READ))
        return -EINVAL;

    /* 2. 检查用户空间缓冲区是否可访问 */
    if (unlikely(!access_ok(buf, count)))
        return -EFAULT;

    /* 3. 验证读取区域（文件锁等） */
    ret = rw_verify_area(READ, file, pos, count);
    if (ret)
        return ret;

    /* 4. 限制单次读取大小 */
    if (count > MAX_RW_COUNT)
        count = MAX_RW_COUNT;

    /* 5. 调用具体文件系统的读取方法 */
    ret = __vfs_read(file, buf, count, pos);

    /* 6. 通知文件系统访问（用于 atime 更新等） */
    if (ret > 0) {
        fsnotify_access(file);
        add_rchar(current, ret);
    }

    inc_syscr(current);
    return ret;
}
```

### 1 权限检查

`vfs_read` 首先检查文件是否以可读方式打开：
- `FMODE_READ` 表示文件是以读模式打开的
- `FMODE_CAN_READ` 表示文件操作表支持读操作

### 2 用户空间缓冲区检查

`access_ok` 验证用户空间传递的缓冲区指针是否有效，确保内核不会向非法的用户空间地址写入数据。

### 3 区域验证

`rw_verify_area` 检查读取区域是否合法：
- 是否有其他进程对文件加锁
- 读取大小是否超过限制
- 读取位置是否在文件有效范围内

### 4 __vfs_read：调用具体文件系统的读取方法

`__vfs_read` 是实际调用具体文件系统读取方法的入口：

```c
ssize_t __vfs_read(struct file *file, char __user *buf, size_t count, loff_t *pos)
{
    if (file->f_op->read)
        return file->f_op->read(file, buf, count, pos);
    else if (file->f_op->read_iter)
        return new_sync_read(file, buf, count, pos);
    else
        return -EINVAL;
}
```

`__vfs_read` 根据 `file->f_op` 中注册的方法调用具体文件系统的读取实现：
- **优先使用 `read`**：如果文件系统实现了同步 `read` 方法，直接调用
- **其次使用 `read_iter`**：如果文件系统实现了 `read_iter`（新的异步读取接口），通过 `new_sync_read` 封装后调用
- **否则返回错误**：如果两者都没有实现，返回 `-EINVAL`

`file->f_op` 是在文件打开时，在 `do_dentry_open` 中赋值为 `inode->i_fop`。对于 ext2 文件系统，`inode->i_fop` 指向 `ext2_file_operations`，其中的 `.read_iter` 方法为 `ext2_file_read_iter`。大部分文件系统的读取过程，都是将 `read_iter` 设置为 `generic_file_read_iter` 来实现的。

## 四、页缓存（Page Cache）：读取的核心机制

页缓存是内存中缓存文件数据的关键机制，其核心价值在于加速读访问、减少磁盘 I/O。下文介绍管理页缓存的核心结构 `address_space` 在读取流程中的具体作用。

### 1 address_space：页缓存的管理者

每个 `inode` 都包含一个 `address_space` 结构（通过 `inode->i_mapping` 访问），它负责管理该文件全部已缓存的页。该结构中的 `a_ops`（地址空间操作函数表）定义了与页缓存交互的具体方法，其中与**读取**最密切相关的两个接口为：
- **`readpage`**：读取单个页（通常用于缺页异常或单页预读失败时的同步读）。
- **`readpages`**：批量读取多个页（用于预读机制，一次性填充多个缓存页，提升顺序读性能）。

> 这两个函数是文件系统（如 ext4、xfs）必须实现或利用通用 VFS 回调的底层操作，它们负责实际向块设备发出 I/O 请求，并将数据填入页缓存。

### 2 读取流程：先查缓存，再读磁盘

读取操作遵循“缓存优先”原则，完整流程如下：
1. **查找页缓存**：通过文件偏移量计算页索引，在 `address_space` 的基数树（radix tree / XArray）中查找对应页。
2. **缓存命中**：若页存在且数据有效（即 `PG_uptodate` 标志置位），则直接返回页数据给用户，流程结束。
3. **缓存未命中**：若页不存在或数据无效，则分配一个新页并插入 `address_space`，随后调用 `a_ops->readpage`（单页）或 `a_ops->readpages`（多页）发起磁盘读取。
4. **填充并返回**：I/O 完成后，将数据填入页缓存，设置 `PG_uptodate`，最后将页数据复制到用户空间（或通过 `mmap` 映射直接使用）

## 五、generic_file_read_iter：通用的读取实现

大部分文件系统（包括 ext2、ext4、xfs 等）都使用 `generic_file_read_iter` 作为通用的读取实现。它首先尝试从页缓存中读取数据，如果页缓存缺失，则发起磁盘 I/O。

### 1 generic_file_read_iter 的调用路径

对于 ext2 文件系统，调用路径为：

```text
ext2_file_read_iter() -> generic_file_read_iter()
```

对于 ext4 文件系统，同样是 `ext4_file_read_iter()` -> `generic_file_read_iter()`。

### 2 generic_file_read_iter 的核心逻辑

`generic_file_read_iter` 的核心逻辑可以分为两个路径：

**缓冲读路径（Buffered Read）**：这是最常用的路径。数据通过页缓存读取。如果数据在缓存中，直接拷贝到用户空间；如果不在，则触发磁盘 I/O 将数据读入缓存。

**直接 I/O 路径（Direct I/O）**：当文件以 `O_DIRECT` 模式打开时，数据绕过页缓存，直接从磁盘读取到用户缓冲区。

对于大多数应用场景，缓冲读路径是默认且最常用的方式。

### 3 generic_file_buffered_read：缓冲读取的实现

`generic_file_buffered_read` 是缓冲读取的核心实现函数。它逐页处理读取请求：
1. 根据当前读取位置计算目标页的索引和页内偏移
2. 调用 `find_get_page` 或 `page_cache_sync_readahead` 查找或预读页
3. 如果页不在缓存中，调用 `mapping->a_ops->readpage` 从磁盘读取
4. 等待页数据就绪（`wait_on_page_locked`）
5. 将页中的数据拷贝到用户空间缓冲区
6. 标记页为已访问（`mark_page_accessed`）
7. 更新读取位置，继续处理下一页

## 六、页缓存未命中：从磁盘读取数据

当请求的数据不在页缓存中时，内核需要从磁盘读取数据。这个过程涉及多个内核层次。

### 1 readpage：文件系统的读取方法

每个文件系统都实现了自己的 `readpage` 方法。对于基于块的文件系统（如 ext4），`readpage` 通常调用 `mpage_readpage` 或类似的函数。

### 2 mpage_readpage：多页读取

`mpage_readpage` 是块设备文件系统中常用的读取函数。它负责将文件系统的页读取请求转换为块 I/O 请求。`mpage_readpage` 的主要工作：
1. 确定文件数据在磁盘上的块位置
2. 构建一个或多个 BIO（Block I/O）请求
3. 将 BIO 提交给通用块层

### 3 从页缓存到块设备：完整的层次模型

`read` 系统调用在核心空间中所要经历的层次模型如下：
**【第一层】虚拟文件系统层（VFS Layer）：** 屏蔽下层具体文件系统操作的差异，为上层的操作提供一个统一的接口。
**【第二层】具体文件系统层（File System Layer）：** 不同的文件系统（如 ext2、ext4、xfs）定义了自己的操作集合。
**【第三层】页缓存层（Page Cache Layer）：** 在内存中缓存了磁盘上的部分数据。如果数据在缓存中且是最新的，直接返回。
**【第四层】通用块层（Generic Block Layer）：** 接收上层发出的磁盘请求，隐藏底层硬件块设备的特性，为块设备提供通用的抽象视图。
**【第五层】I/O 调度层（I/O Scheduler Layer）：** 接收通用块层发出的 I/O 请求，缓存请求并试图合并相邻的请求，根据调度算法处理请求。
**【第六层】块设备驱动层（Block Device Driver Layer）：** 最终对设备进行 I/O 操作。

## 七、BIO 与块设备 I/O

### 1 BIO：块 I/O 请求的基本单位

BIO（Block I/O）是 Linux 内核中块 I/O 请求的基本数据结构。每个 BIO 包含：
- 目标设备
- 起始扇区号
- 要传输的数据块数量
- 数据在内存中的位置（页数组）
- 操作类型（读/写）
- 完成回调函数

### 2 submit_bio：提交 BIO 到块设备层

`submit_bio` 是沟通文件系统和通用块层的接口。文件系统将读取请求封装成 BIO 结构后，通过 `submit_bio` 提交给通用块层。

通用块层的主要作用是处理 BIO 的合并与分发，这一层做了许多抽象的处理，使底层可以任意切换 I/O 调度器算法而上层不受任何影响。

### 3 I/O 调度与设备驱动

BIO 被提交到通用块层后，经过 I/O 调度层的排序和合并，最终由块设备驱动执行实际的磁盘读取操作。块设备驱动可以一次传输多个扇区，内核尽可能聚集多个扇区作为一次操作，减少磁头的移动。

## 八、read 系统调用的完整调用链

从用户空间的 `read` 函数到最终从磁盘读取数据，完整的调用链如下：

```text
用户空间: read(fd, buf, count)
    ↓ (系统调用)
内核入口: sys_read()                        [fs/read_write.c]
    ↓
ksys_read()                                    [fs/read_write.c]
    ├── fdget_pos()                           // 获取文件对象
    ├── vfs_read()                             // VFS 层统一读取接口
    │   ├── 权限检查 (FMODE_READ)
    │   ├── access_ok()                     // 检查用户缓冲区
    │   ├── rw_verify_area()               // 检查读取区域
    │   └── __vfs_read()                     // 调用具体文件系统的读取方法
    │       └── file->f_op->read_iter()    // 具体文件系统的读取
    │           └── generic_file_read_iter()      [mm/filemap.c]
    │               └── generic_file_buffered_read()
    │                   ├── 查找页缓存 (find_get_page)
    │                   ├── 如果页缓存命中
    │                   │   └── 拷贝数据到用户空间
    │                   ├── 如果页缓存未命中
    │                   │   ├── mapping->a_ops->readpage()
    │                   │   │   └── mpage_readpage()    [fs/mpage.c]
    │                   │   │       ├── 确定磁盘块位置
    │                   │   │       ├── 创建 BIO
    │                   │   │       └── submit_bio()         [block/blk-core.c]
    │                   │   ├── 通用块层处理
    │                   │   ├── I/O 调度层
    │                   │   └── 块设备驱动
    │                   └── 等待 I/O 完成
    ├── 更新 f_pos                         // 更新文件偏移
    └── fdput_pos()                        // 释放文件引用
```

## 九、文件操作表的注册时机

在阅读 `read` 的源码时，一个常见的问题是：`file->f_op` 是在什么时候被赋值的？

答案是：**在文件打开时**。当 `open` 系统调用成功返回时，`do_dentry_open` 函数会将 `inode->i_fop` 赋值给 `file->f_op`。

而 `inode->i_fop` 是在文件系统初始化 inode 时设置的。对于 ext2 文件系统，在 `ext2_iget` 中会将 `inode->i_fop` 赋值为 `&ext2_file_operations`。对于 ext4 文件系统，则是 `&ext4_file_operations`。

因此，当应用程序调用 `read` 时，内核通过 `file->f_op->read_iter` 调用的正是该文件系统注册的读取方法。

## 十、预读机制

为了提高顺序读取的性能，Linux 内核实现了预读（Readahead）机制。

### 1 什么是预读

预读是指文件系统为应用程序一次读出比预期更多的文件内容并缓存在页缓存中。这样，当下一次读取请求到来时，部分页面可以直接从页缓存读取，从而提高读取速度。

### 2 预读的触发

预读由 `page_cache_sync_readahead` 函数触发。当应用程序进行顺序读取时，内核会检测到访问模式并主动预读后续的数据页。

### 3 预读的好处

预读对应用程序透明——应用程序可能感觉下次读取的速度会更快。对于大文件的顺序读取，预读可以显著提高性能。

## 十一、总结

Linux VFS 的 `read` 系统调用通过以下设计实现了高效、统一的文件读取操作：
1. **系统调用入口**：通过 `SYSCALL_DEFINE3` 定义系统调用，使用 `ksys_read` 作为核心分发函数
2. **VFS 统一接口**：`vfs_read` 屏蔽了不同文件系统的差异，提供统一的读取入口
3. **页缓存机制**：数据首先从页缓存（Page Cache）中读取，大幅提升读取性能
4. **层次化处理**：从 VFS 层到具体文件系统层，再到页缓存层、通用块层、I/O 调度层和块设备驱动层，每一层都有明确的职责
5. **缓存优先策略**：先检查页缓存，命中则直接返回；未命中则从磁盘读取并填充缓存
6. **文件系统抽象**：通过 `file_operations` 中的 `read_iter` 方法，让不同文件系统实现各自的读取逻辑
7. **预读机制**：对于顺序读取，内核会自动预读后续数据，提高性能

整个 `read` 流程体现了 VFS 作为**中间层**的核心设计思想：通过统一的接口抽象不同文件系统的差异，让上层应用通过相同的系统调用从不同类型的文件系统（ext4、xfs、NFS、块设备等）读取数据，同时利用页缓存机制在性能和效率之间取得平衡。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [read系统调用源码分析](https://blog.csdn.net/weixin_45672701/article/details/134374950)
<strong style="color: #db8ef7;">[2]</strong> [linux内核源码分析之虚拟文件系统VFS](https://blog.csdn.net/wangyongzixue/article/details/123804025)
<strong style="color: #db8ef7;">[3]</strong> [read 系统调用剖析](https://developer.aliyun.com/article/364956)
<strong style="color: #db8ef7;">[4]</strong> [sys_read()/vfs_read()/vfs_write() Linux VFS文件系统之读写(read/write)文件](https://blog.csdn.net/lin111000713/article/details/24351397)
<strong style="color: #db8ef7;">[5]</strong> [图解｜Linux文件预读原理](https://developer.cloud.tencent.com/article/2408941)
<strong style="color: #db8ef7;">[6]</strong> [Linux内核源码 - fs/read_write.c (read系统调用)](https://elixir.bootlin.com/linux/latest/source/fs/read_write.c)
<strong style="color: #db8ef7;">[7]</strong> [Linux内核源码 - mm/filemap.c (页缓存与generic_file_read_iter)](https://elixir.bootlin.com/linux/latest/source/mm/filemap.c)
<strong style="color: #db8ef7;">[8]</strong> [Linux内核源码 - fs/mpage.c (多页读取)](https://elixir.bootlin.com/linux/latest/source/fs/mpage.c)