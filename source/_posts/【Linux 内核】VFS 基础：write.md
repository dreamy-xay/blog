---
title: 【Linux 内核】VFS 基础：write
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
abbrlink: 54f22d4c
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-22 14:42:27
updated: 2026-07-27 15:58:10
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从用户空间到内核：write 系统调用

当我们编写 C 程序时，使用 `write` 函数向文件写入数据是最常见的操作之一：

```c
ssize_t written = write(fd, buffer, count);
```

`write` 是标准 C 库提供的函数，它内部会触发系统调用，将控制权从用户空间转移到内核空间。在 x86_64 架构上，系统调用通过 `syscall` 指令实现，将 CPU 从用户态切换到内核态，并跳转到内核中预定义的系统调用入口。内核根据系统调用号（`write` 的系统调用号是 1）在系统调用表中查找对应的处理函数 `sys_write`。

## 二、write 系统调用的内核入口

### 1 sys_write：系统调用的定义

在 Linux 内核源码 `fs/read_write.c` 中，`write` 系统调用通过 `SYSCALL_DEFINE3` 宏定义：

```c
SYSCALL_DEFINE3(write, unsigned int, fd, const char __user *, buf, size_t, count)
{
    return ksys_write(fd, buf, count);
}
```

`SYSCALL_DEFINE3` 表示该系统调用有三个参数：
- `fd`：文件描述符，标识要写入哪个打开的文件
- `buf`：用户空间缓冲区指针，存放要写入的数据
- `count`：要写入的字节数

### 2 ksys_write：核心分发函数

`ksys_write` 是 `write` 系统调用的核心实现：

```c
ssize_t ksys_write(unsigned int fd, const char __user *buf, size_t count)
{
    struct fd f = fdget_pos(fd);
    ssize_t ret = -EBADF;

    if (f.file) {
        loff_t pos, *ppos = file_ppos(f.file);
        if (ppos) {
            pos = *ppos;
            ppos = &pos;
        }
        ret = vfs_write(f.file, buf, count, ppos);
        if (ret >= 0 && ppos)
            f.file->f_pos = pos;
        fdput_pos(f);
    }
    return ret;
}
```

这个函数主要完成以下工作：
1. **获取文件对象：**`fdget_pos` 根据文件描述符 `fd` 从当前进程的文件描述符表中获取对应的 `struct file` 结构。如果文件描述符无效，返回 `-EBADF`。
2. **获取文件偏移：**`file_ppos` 获取当前文件的读写位置（`f_pos`）。对于普通文件，每次读写操作都会更新这个位置。
3. **调用 VFS 写入：**`vfs_write` 是 VFS 层提供的统一写入接口，负责调用具体文件系统的写入方法。
4. **更新文件偏移：** 如果写入成功，将新的文件位置写回 `f_pos`。
5. **释放文件引用：**`fdput_pos` 减少文件对象的引用计数。

## 三、vfs_write：VFS 层的统一写入接口

`vfs_write` 是 VFS 层提供的核心写入函数，它屏蔽了不同文件系统的差异，为上层提供统一的写入接口。

```c
ssize_t vfs_write(struct file *file, const char __user *buf, size_t count, loff_t *pos)
{
    ssize_t ret;

    /* 1. 检查文件是否可写 */
    if (!(file->f_mode & FMODE_WRITE))
        return -EBADF;
    if (!(file->f_mode & FMODE_CAN_WRITE))
        return -EINVAL;

    /* 2. 检查用户空间缓冲区是否可访问 */
    if (unlikely(!access_ok(buf, count)))
        return -EFAULT;

    /* 3. 验证写入区域（文件锁、大小限制等） */
    ret = rw_verify_area(WRITE, file, pos, count);
    if (ret)
        return ret;

    /* 4. 限制单次写入大小 */
    if (count > MAX_RW_COUNT)
        count = MAX_RW_COUNT;

    /* 5. 开始写入（处理文件系统 freeze 等状态） */
    file_start_write(file);

    /* 6. 调用具体文件系统的写入方法 */
    if (file->f_op->write)
        ret = file->f_op->write(file, buf, count, pos);
    else if (file->f_op->write_iter)
        ret = new_sync_write(file, buf, count, pos);
    else
        ret = -EINVAL;

    /* 7. 通知文件系统修改（用于 inotify 等机制） */
    if (ret > 0) {
        fsnotify_modify(file);
        add_wchar(current, ret);
    }

    inc_syscw(current);
    file_end_write(file);
    return ret;
}
```

### 1 权限检查

`vfs_write` 首先检查文件是否以可写方式打开：
- `FMODE_WRITE` 表示文件是以写模式打开的
- `FMODE_CAN_WRITE` 表示文件操作表支持写操作

### 2 用户空间缓冲区检查

`access_ok` 验证用户空间传递的缓冲区指针是否有效，确保内核不会访问非法的用户空间地址。

### 3 区域验证

`rw_verify_area` 检查写入区域是否合法：
- 是否有其他进程对文件加锁
- 写入大小是否超过限制
- 是否超出文件系统支持的最大文件大小

### 4 调用具体文件系统的写入方法

`vfs_write` 根据 `file->f_op` 中注册的方法调用具体文件系统的写入实现：
- **优先使用 `write`**：如果文件系统实现了同步 `write` 方法，直接调用
- **其次使用 `write_iter`**：如果文件系统实现了 `write_iter`（新的异步写入接口），通过 `new_sync_write` 封装后调用
- **否则返回错误**：如果两者都没有实现，返回 `-EINVAL`

对于 ext4 等现代文件系统，通常实现的是 `write_iter` 方法（如 `ext4_file_write_iter`），而不是传统的 `write` 方法。

## 四、页缓存（Page Cache）：写入的核心机制

在理解具体文件系统的写入实现之前，需要先了解 Linux 页缓存（Page Cache）机制。

### 1 什么是页缓存

页缓存是 Linux 内核中用于缓存文件数据的内存区域。当应用程序向文件写入数据时，数据首先被写入页缓存，而不是直接写入磁盘。这种设计带来了两个重要好处：
1. **性能提升**：内存操作比磁盘 I/O 快几个数量级
2. **减少磁盘访问**：多次写入可以合并，减少磁盘磨损

页缓存以页（Page）为单位组织，每个页通常为 4KB。文件的内容被划分为多个页，每个页通过其在文件中的偏移量（索引）来定位。

### 2 address_space：页缓存的管理者

每个 inode 都有一个 `address_space` 结构（`inode->i_mapping`），它管理着该文件的所有页缓存。`address_space` 中的 `a_ops`（地址空间操作函数表）定义了页缓存的具体操作，如 `write_begin` 和 `write_end`。

## 五、generic_perform_write：通用的写入实现

大多数文件系统（包括 ext4、xfs 等）都使用 `generic_perform_write` 作为通用的写入实现。这个函数完成了从用户空间到页缓存的核心数据拷贝工作。

```c
ssize_t generic_perform_write(struct file *file, struct iov_iter *i, loff_t pos)
{
    struct address_space *mapping = file->f_mapping;
    const struct address_space_operations *a_ops = mapping->a_ops;
    ssize_t written = 0;
    long status = 0;

    do {
        struct page *page;
        unsigned long offset;   /* 页内偏移 */
        unsigned long bytes;    /* 本次要写入的字节数 */
        size_t copied;          /* 实际从用户空间复制的字节数 */
        void *fsdata;

        /* 1. 计算页内偏移：pos % PAGE_SIZE */
        offset = (pos & (PAGE_SIZE - 1));

        /* 2. 计算本次可写入的字节数（不超过一页） */
        bytes = min_t(unsigned long, PAGE_SIZE - offset, iov_iter_count(i));

        /* 3. 检查用户空间地址是否可读 */
        if (unlikely(iov_iter_fault_in_readable(i, bytes))) {
            status = -EFAULT;
            break;
        }

        /* 4. 检查是否有待处理的信号 */
        if (fatal_signal_pending(current)) {
            status = -EINTR;
            break;
        }

        /* 5. 准备写入：确保目标页在内存中 */
        status = a_ops->write_begin(file, mapping, pos, bytes, flags, &page, &fsdata);
        if (unlikely(status < 0))
            break;

        /* 6. 从用户空间拷贝数据到页缓存 */
        copied = iov_iter_copy_from_user_atomic(page, i, offset, bytes);

        /* 7. 完成写入 */
        status = a_ops->write_end(file, mapping, pos, bytes, copied, page, fsdata);
        if (unlikely(status < 0))
            break;

        copied = status;

        /* 8. 让出 CPU（如果需要） */
        cond_resched();

        /* 9. 更新位置和计数 */
        pos += copied;
        written += copied;

        /* 10. 检查脏页数量，必要时触发写回 */
        balance_dirty_pages_ratelimited(mapping);

    } while (iov_iter_count(i));

    return written ? written : status;
}
```

### 1 write_begin：准备写入

`write_begin` 是地址空间操作函数，负责为写入操作准备好目标页。大多数文件系统的 `write_begin` 最终会调用 `block_write_begin`：

```c
int block_write_begin(struct address_space *mapping, loff_t pos, unsigned len,
                      unsigned flags, struct page **pagep, get_block_t *get_block)
{
    /* 计算页索引：pos / PAGE_SIZE */
    pgoff_t index = pos >> PAGE_SHIFT;
    struct page *page;
    int status;

    /* 获取或创建对应的页 */
    page = grab_cache_page_write_begin(mapping, index, flags);
    if (!page)
        return -ENOMEM;

    /* 与块设备上的数据同步（如果页不在内存中，从磁盘读取） */
    status = __block_write_begin(page, pos, len, get_block);
    if (unlikely(status)) {
        unlock_page(page);
        put_page(page);
        page = NULL;
    }

    *pagep = page;
    return status;
}
```

`block_write_begin` 的核心逻辑：
1. 计算目标页在文件中的索引（`pos >> PAGE_SHIFT`）
2. 调用 `grab_cache_page_write_begin` 获取或创建对应的页
3. 调用 `__block_write_begin` 确保页的内容与磁盘同步（如果写入位置不在页的起始处，需要先读取磁盘上的数据）

对于 NFS 文件系统，`write_begin` 指向 `nfs_write_begin`。

```C
static int nfs_write_begin(struct file *file, struct address_space *mapping,
                           loff_t pos, unsigned len, unsigned flags,
                           struct page **pagep, void **fsdata)
{
    int ret;
    pgoff_t index = pos >> PAGE_CACHE_SHIFT;   /* 计算目标页在文件中的索引 */
    struct page *page;
    int once_thru = 0;

    /* 调试输出（可忽略） */
    dfprintk(PAGECACHE, "NFS: write_begin(%s/%s(%ld), %u@%lld)\n",
             file->f_path.dentry->d_parent->d_name.name,
             file->f_path.dentry->d_name.name,
             mapping->host->i_ino, len, (long long) pos);

start:
    /* 等待 NFS_INO_FLUSHING 标志清除（避免与正在进行的刷新冲突） */
    ret = wait_on_bit(&NFS_I(mapping->host)->flags, NFS_INO_FLUSHING,
                      nfs_wait_bit_killable, TASK_KILLABLE);
    if (ret)
        return ret;

    /* 获取或创建对应的缓存页，并加锁 */
    page = grab_cache_page_write_begin(mapping, index, flags);
    if (!page)
        return -ENOMEM;
    *pagep = page;

    /* 处理页内已有的不兼容写请求（如其他进程向同一页的不同偏移写入） */
    ret = nfs_flush_incompatible(file, page);
    if (ret) {
        unlock_page(page);
        page_cache_release(page);
    } else if (!once_thru &&
               nfs_want_read_modify_write(file, page, pos, len)) {
        /* 若需要执行 read‑modify‑write，则先从服务器读取整页数据 */
        once_thru = 1;
        ret = nfs_readpage(file, page);
        page_cache_release(page);
        if (!ret)
            goto start;   /* 读取后重新开始（因为页内容已改变） */
    }
    return ret;
}
```

`nfs_write_begin` 的核心逻辑：
1. 根据当前待写位置计算当前文件待写的页号：`pgoff_t index = pos >> PAGE_CACHE_SHIFT`
2. **等待刷新标志清除**：检查 `NFS_INO_FLUSHING` 标志，若客户端正在向服务器刷新数据，则等待其完成，避免并发冲突。
3. **获取或创建缓存页**：通过 `grab_cache_page_write_begin` 在页缓存中查找或新建目标页，并锁定该页。
4. **处理不兼容的写请求**：调用 `nfs_flush_incompatible` 处理页内已有的其他写操作（例如不同偏移的写入），确保数据一致性。
5. **按需执行 Read‑Modify‑Write**：如果当前写入仅覆盖页的一部分，且页中可能存在旧数据，则先通过 `nfs_readpage` 从服务器读取整页最新数据，再回到步骤 1 重新处理（此过程最多执行一次）。
### 2 iov_iter_copy_from_user_atomic：数据拷贝

`iov_iter_copy_from_user_atomic` 是将用户空间的数据拷贝到页缓存的核心函数。它使用原子操作，确保在拷贝过程中不会被中断。

### 3 write_end：完成写入

`write_end` 是 `write_begin` 的配对函数，在数据拷贝完成后调用。它负责：
- 标记页为脏（dirty），表示页的内容已被修改
- 更新 inode 的大小（如果写入位置超出文件末尾）
- 解锁页

对于 NFS 文件系统，`write_end` 指向 `nfs_write_end`。

```C
static int nfs_write_end(struct file *file, struct address_space *mapping,
                         loff_t pos, unsigned len, unsigned copied,
                         struct page *page, void *fsdata)
{
    unsigned offset = pos & (PAGE_CACHE_SIZE - 1);  /* 写入起始位置在页内的偏移 */
    int status;

    /* 调试输出（可忽略） */
    dfprintk(PAGECACHE, "NFS: write_end(%s/%s(%ld), %u@%lld)\n",
             file->f_path.dentry->d_parent->d_name.name,
             file->f_path.dentry->d_name.name,
             mapping->host->i_ino, len, (long long) pos);

    /*
     * 将页中未初始化的部分置零，并在文件扩展时标记页为最新
     */
    if (!PageUptodate(page)) {               /* 页内容不是最新的 */
        unsigned pglen = nfs_page_length(page);  /* 页中已有有效数据的长度 */
        unsigned end = offset + len;         /* 写入结束位置 */

        if (pglen == 0) {
            /* 页中无有效数据，将整个页置零（除了写入部分，待会会覆盖） */
            zero_user_segments(page, 0, offset,
                               end, PAGE_CACHE_SIZE);
            SetPageUptodate(page);           /* 标记页为最新 */
        } else if (end >= pglen) {
            /* 写入覆盖了原有数据的尾部，将尾部之后的部分置零 */
            zero_user_segment(page, end, PAGE_CACHE_SIZE);
            if (offset == 0)
                SetPageUptodate(page);       /* 如果从页首写入，则整页有效 */
        } else {
            /* 写入在页中间，将原有数据尾部之后的部分置零 */
            zero_user_segment(page, pglen, PAGE_CACHE_SIZE);
        }
    }

    /* 更新 NFS 请求结构，并将页标记为脏 */
    status = nfs_updatepage(file, page, offset, copied);

    unlock_page(page);                       /* 解锁页（write_begin 中加的锁） */
    page_cache_release(page);                /* 减少页引用计数 */

    if (status < 0)
        return status;
    NFS_I(mapping->host)->write_io += copied;
    return copied;
}
```

`nfs_write_end` 的核心逻辑：
1. **处理未初始化的页数据**：如果页尚未标记为最新（`!PageUptodate`），根据页内已有有效数据的长度和本次写入的范围，调用 `zero_user_segment` 将页中尚未被有效数据覆盖的部分置零，必要时标记页为最新（`SetPageUptodate`），确保读出时不会返回无效数据。
2. **更新 NFS 写请求并标记脏页**：调用 `nfs_updatepage`，该函数会创建或更新 NFS 后端的请求结构（`nfs_page`），并将对应的缓存页标记为脏，以便后续异步刷出到服务器。
3. **解锁并释放页**：解除 `write_begin` 中获得的页锁（`unlock_page`），并减少页的引用计数（`page_cache_release`），使页可以再次被其他操作访问或回收。
4. **统计写入字节数**：成功时在 inode 私有数据中累加本次写入的字节数（`write_io`），并返回实际拷贝的字节数（`copied`）。

### 4 balance_dirty_pages_ratelimited：脏页控制

每次写入后，内核会调用 `balance_dirty_pages_ratelimited` 检查系统中的脏页数量。如果脏页过多，内核会触发写回操作，将部分脏页写入磁盘，防止内存被脏页耗尽。

## 六、从页缓存到磁盘：数据回写

数据写入页缓存后，并不会立即写入磁盘。内核通过多种机制将脏页写回磁盘。

### 1 脏页标记

当 `write_end` 完成时，页会被标记为脏（PageDirty）。脏页表示页的内容已经被修改，但尚未写入磁盘。

`nfs_updatepage` 调用 `nfs_writepage_setup`，后者进一步调用 `nfs_setup_write_request` 创建 NFS 写请求。然后通过 `nfs_mark_request_dirty` 标记请求为脏。

`__set_page_dirty_nobuffers` 是标记脏页的核心函数。它执行两个关键操作：
1. **标记 radix tree 中的页为脏**：`radix_tree_tag_set(&mapping->page_tree, page_index(page), PAGECACHE_TAG_DIRTY)`
2. **标记 inode 为脏**：调用 `__mark_inode_dirty(mapping->host, I_DIRTY_PAGES)`
	- `I_DIRTY_PAGES` 标志该函数会将 inode 挂载到超级块的 bdi 脏链表中，等待后续的回写操作
### 2 主动回写：sync/fsync

用户程序可以调用 `sync()` 或 `fsync()` 系统调用强制将数据写回磁盘。`fsync` 会等待数据真正写入磁盘后才返回，而 `sync` 只是发起写回请求。

### 3 后台回写：pdflush

内核中的 `pdflush` 线程（或较新内核中的 `flush` 线程）会定期检查脏页，并将它们写回磁盘。当脏页数量超过 `vm_dirty_ratio` 阈值时，内核会加速回写。

### 4 写回路径

脏页写回磁盘的路径如下：
1. **write_cache_pages**：遍历文件的所有页缓存，找到脏页
2. **submit_bh_wbc**：为脏页创建 BIO（块 I/O 请求）
3. **BIO 提交**：BIO 被提交到块设备层的 I/O 调度队列
4. **设备驱动**：块设备驱动（如 AHCI 驱动）执行实际的磁盘写入

## 七、完整调用链总结

从用户空间的 `write` 函数到最终数据写入磁盘，完整的调用链如下：

```text
用户空间: write(fd, buf, count)
    ↓ (系统调用)
内核入口: sys_write()                      [fs/read_write.c]
    ↓
ksys_write()                                  [fs/read_write.c]
    ├── fdget_pos()                           // 获取文件对象
    ├── vfs_write()                            // VFS 层统一写入接口
    │   ├── 权限检查 (FMODE_WRITE)
    │   ├── access_ok()                     // 检查用户缓冲区
    │   ├── rw_verify_area()               // 检查写入区域
    │   ├── file_start_write()               // 开始写入
    │   └── file->f_op->write_iter()       // 具体文件系统的写入
    │       └── ext4_file_write_iter()     [fs/ext4/file.c]
    │           └── __generic_file_aio_write()
    │               └── generic_file_buffered_write()
    │                   └── generic_perform_write()    [mm/filemap.c]
    │                       ├── write_begin()                // 准备页
    │                       │   └── block_write_begin()
    │                       │       ├── grab_cache_page_write_begin()  // 获取/创建页
    │                       │       └── __block_write_begin()                // 同步磁盘数据
    │                       │   └── nfs_write_begin()
    │                       │       ├── grab_cache_page_write_begin()  // 获取/创建页
    │                       │       └── nfs_flush_incompatible()            // 处理不兼容的写请求
    │                       ├── iov_iter_copy_from_user_atomic()          // 拷贝数据
    │                       ├── write_end()        // 完成写入
    │                       │   └── nfs_write_end()
    │                       │       └── nfs_updatepage()
    │                       │           └── nfs_writepage_setup()
    │                       │               ├── nfs_setup_write_request()
    │                       │               └── nfs_mark_request_dirty()
    │                       │                   └── __set_page_dirty_nobuffers()
    │                       │                       ├── radix_tree_tag_set()  // 标记页脏
    │                       │                       └── __mark_inode_dirty()   // 标记 inode 脏
    │                       └── balance_dirty_pages_ratelimited() // 脏页控制
    ├── 更新 f_pos                         // 更新文件偏移
    └── fdput_pos()                        // 释放文件引用
    ↓ (异步回写)
后台回写: balance_dirty_pages / pdflush
    ↓
write_cache_pages()                        // 遍历脏页
    ↓
submit_bh_wbc()                            // 创建 BIO
    ↓
块设备层 / I/O 调度器
    ↓
设备驱动 (AHCI 等)
    ↓
物理磁盘
```

## 八、特殊写入模式

### 1 O_APPEND 模式

当文件以 `O_APPEND` 模式打开时，每次写入都会自动将数据追加到文件末尾。内核在 `vfs_write` 中会特殊处理：每次写入前都会将文件偏移设置为文件当前大小，确保多个进程同时写入时数据不会互相覆盖。

需要说明的是，该特殊处理实际并不在 `vfs_write` 中直接完成，而是在下层写入函数 `__generic_file_aio_write` （2.6.x / 3.x 内核函数，新内核函数实现不同本质相同）中实现：

```C
mutex_lock(&inode->i_mutex);           // 加锁
if (iocb->ki_flags & IOCB_APPEND)
    pos = i_size_read(inode);
// ... 执行写入操作 ...
mutex_unlock(&inode->i_mutex);       //解锁
```

内核先对 `inode` 加锁，再重新获取文件最新长度，保证多个进程同时追加写入时数据不会互相覆盖。

**非 O_APPEND 的并发问题**：不带该标志时，写入偏移量直接取自文件描述符中的保存值，获取偏移与写入操作无锁保护。多个进程同时向同一位置写入，后写数据会直接覆盖先写数据，引发竞争问题。
### 2 O_DIRECT 模式

当文件以 `O_DIRECT` 模式打开时，数据会绕过页缓存，直接写入磁盘。这种模式适用于需要保证数据持久性的场景（如数据库），但性能通常比使用页缓存要差。

### 3 非阻塞写入

当文件以 `O_NONBLOCK` 模式打开时，如果写入操作会阻塞（如管道满），`write` 会立即返回 `-EAGAIN`。

## 九、总结

Linux VFS 的 `write` 系统调用通过以下设计实现了高效、统一的文件写入操作：
1. **系统调用入口**：通过 `SYSCALL_DEFINE3` 定义系统调用，使用 `ksys_write` 作为核心分发函数
2. **VFS 统一接口**：`vfs_write` 屏蔽了不同文件系统的差异，提供统一的写入入口
3. **页缓存机制**：数据首先写入页缓存（Page Cache），大幅提升写入性能
4. **延迟回写**：脏页通过后台线程异步写回磁盘，减少对应用程序的阻塞
5. **文件系统抽象**：通过 `file_operations` 中的 `write_iter` 方法，让不同文件系统实现各自的写入逻辑
6. **通用写入实现**：`generic_perform_write` 提供了大多数文件系统可复用的写入实现

整个 `write` 流程体现了 VFS 作为**中间层**的核心设计思想：通过统一的接口抽象不同文件系统的差异，让上层应用通过相同的系统调用向不同类型的文件系统（ext4、xfs、NFS、块设备等）写入数据，同时利用页缓存机制在性能和持久性之间取得平衡。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [Linux VFS中write系统调用实现原理](https://developer.aliyun.com/article/375127)
<strong style="color: #db8ef7;">[2]</strong> [Linux VFS文件系统分析](https://blog.csdn.net/zouhaicheng/article/details/144662091)
<strong style="color: #db8ef7;">[3]</strong> [linux vfs_write](https://cloud.tencent.cn/developer/information/linux%2520vfs_write-article)
<strong style="color: #db8ef7;">[4]</strong> [linux-5.10.110内核源码分析 - 写磁盘(从VFS系统调用到I/O调度及AHCI写磁盘)](https://blog.csdn.net/arm7star/article/details/146635539)
<strong style="color: #db8ef7;">[5]</strong> [Kernel源码笔记之VFS：写文件](https://blog.csdn.net/jakelylll/article/details/123741908)
<strong style="color: #db8ef7;">[6]</strong> [NFS文件系统写操作解析](https://blog.csdn.net/xiaoqiaxiaoqi/article/details/77162259)
<strong style="color: #db8ef7;">[7]</strong> [Linux内核源码 - fs/read_write.c (read/write系统调用)](https://elixir.bootlin.com/linux/latest/source/fs/read_write.c)
<strong style="color: #db8ef7;">[8]</strong> [Linux内核源码 - mm/filemap.c (页缓存与generic_perform_write)](https://elixir.bootlin.com/linux/latest/source/mm/filemap.c)