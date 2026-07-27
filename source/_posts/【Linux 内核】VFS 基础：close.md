---
title: 【Linux 内核】VFS 基础：close
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
abbrlink: 3a98d6d7
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-24 10:50:01
updated: 2026-07-27 16:05:31
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从用户空间到内核：close 系统调用

用户程序通过 `close` 函数关闭一个已经打开的文件描述符，释放与其关联的资源：

```c
int ret = close(fd);
```

`close` 是标准 C 库提供的函数，它内部会触发系统调用，将控制权从用户空间转移到内核空间。内核根据系统调用号在系统调用表中查找对应的处理函数——对于 `close`，这个函数是 `sys_close`。

## 二、close 系统调用的内核入口

### 1 sys_close：系统调用的定义

在 Linux 内核源码 `fs/open.c` 中，`close` 系统调用通过 `SYSCALL_DEFINE1` 宏定义：

```c
SYSCALL_DEFINE1(close, unsigned int, fd)
{
    int retval = __close_fd(current->files, fd);
    /* can't restart close syscall because file table entry was cleared */
    if (unlikely(retval == -ERESTARTSYS || retval == -ERESTARTNOINTR ||
                 retval == -ERESTARTNOHAND || retval == -ERESTART_RESTARTBLOCK))
        retval = -EINTR;
    return retval;
}
```

`SYSCALL_DEFINE1` 表示该系统调用有一个参数：
- `fd`：要关闭的文件描述符

`sys_close` 的核心工作是调用 `__close_fd`，并将当前进程的文件描述符表（`current->files`）作为参数传入。

### 2 close 的特殊性：不能重启

注意代码中的注释："can't restart close syscall because file table entry was cleared"。

与许多其他系统调用不同，`close` 不能被重启。原因在于：一旦文件描述符表中的条目被清除，就没有办法恢复它。如果 `close` 在等待某些操作时被信号中断，内核不能简单地重试，因为文件描述符已经不再有效。

## 三、__close_fd：核心关闭逻辑

`__close_fd` 是 `close` 系统调用的核心实现，它完成文件描述符的解除绑定和资源的释放准备：

```c
int __close_fd(struct files_struct *files, unsigned fd)
{
    struct file *file;
    struct fdtable *fdt;

    spin_lock(&files->file_lock);
    fdt = files_fdtable(files);
    if (fd >= fdt->max_fds)
        goto out_unlock;
    file = fdt->fd[fd];
    if (!file)
        goto out_unlock;
    rcu_assign_pointer(fdt->fd[fd], NULL);
    __put_unused_fd(files, fd);
    spin_unlock(&files->file_lock);

    return filp_close(file, files);

out_unlock:
    spin_unlock(&files->file_lock);
    return -EBADF;
}
```

这个函数主要完成以下工作：
1. **获取文件描述符表锁：**`spin_lock(&files->file_lock)` 加锁保护文件描述符表的并发访问。
2. **获取文件描述符表：**`files_fdtable(files)` 获取当前进程的文件描述符表。
3. **验证文件描述符：** 检查 `fd` 是否超出表的最大范围（`max_fds`），如果超出则返回 `-EBADF`。
4. **获取 file 结构：**`file = fdt->fd[fd]` 从文件描述符表中取出对应的 `struct file` 指针。如果为 `NULL`，说明该文件描述符已经关闭，返回 `-EBADF`。
5. **清除文件描述符表项：**`rcu_assign_pointer(fdt->fd[fd], NULL)` 将文件描述符表中的对应项置为 `NULL`。这一步使用了 RCU（Read-Copy-Update）机制，确保正在进行的读操作不会访问到已释放的内存。
6. **释放文件描述符：**`__put_unused_fd(files, fd)` 将该文件描述符标记为可用。同时，清除 `close_on_exec` 位图中的对应位。
7. **解锁并关闭文件：**`spin_unlock(&files->file_lock)` 释放锁，然后调用 `filp_close(file, files)` 执行文件关闭的后续操作。

## 四、filp_close：调用文件系统的 flush 方法

`filp_close` 是文件关闭的核心函数，它负责调用文件系统的 `flush` 方法和最终的文件释放：

```c
int filp_close(struct file *filp, fl_owner_t id)
{
    int retval = 0;

    if (filp->f_op && filp->f_op->flush) {
        retval = filp->f_op->flush(filp, id);
        if (retval)
            return retval;
    }

    fput(filp);
    return retval;
}
```

这个函数主要完成以下工作：

**调用 flush 方法：** 如果文件操作表（`file_operations`）中定义了 `flush` 方法，则调用它。
`flush` 方法与 `release` 方法不同：
- `flush` 在每次 `close` 调用时都会执行，无论是否是最后一次关闭
- `flush` 主要用于将缓冲区的数据刷新到磁盘，并等待未完成的 I/O 操作完成
- 如果 `flush` 返回错误，`close` 会将这个错误返回给用户

**释放文件引用：**`fput(filp)` 减少文件的引用计数。只有当引用计数降为 0 时，文件资源才会被真正释放。

## 五、引用计数与文件释放

### 1 f_count：文件引用计数

每个 `struct file` 结构都有一个 `f_count` 字段，用于记录当前有多少个引用指向这个文件。引用计数机制确保了：只要还有进程在使用这个文件，文件资源就不会被提前释放。

引用计数的变化场景：
- **文件打开时**：`open` 系统调用成功创建 `struct file` 后，`f_count` 初始化为 1
- **文件描述符复制时**：`dup` 或 `fork` 会通过 `fget` 增加引用计数
- **文件关闭时**：`close` 系统调用会通过 `fput` 减少引用计数

### 2 fput：减少引用计数

`fput` 是减少文件引用计数的核心函数：

```c
void fput(struct file *file)
{
    if (atomic_dec_and_test(&file->f_count)) {
        /* 引用计数降为 0，需要释放文件 */
        if (file->f_op && file->f_op->release)
            file->f_op->release(inode, file);
        /* ... 更多清理工作 ... */
    }
}
```

`fput` 的执行逻辑：
1. **原子递减并测试**：`atomic_dec_and_test` 原子地将 `f_count` 减 1，并检查结果是否为 0
2. **如果引用计数不为 0**：说明还有其他进程在使用这个文件，直接返回，不做任何清理
3. **如果引用计数为 0**：说明这是最后一个引用，需要释放文件资源

### 3 延迟释放：fput 的异步化

在实际的内核实现中，`fput` 并不总是立即释放文件资源。为了优化性能，`fput` 可能会将释放操作延迟到进程返回用户空间时执行。

这种延迟释放机制通过 `task_work` 实现：
1. `fput` 将 `____fput` 函数注册为当前进程的任务工作（task work）
2. 当进程从内核态返回用户态时，内核会执行所有注册的任务工作
3. `____fput` 最终调用 `__fput` 完成文件的真正释放

延迟释放的好处是：
- 减少内核栈的深度，避免递归释放导致的栈溢出
- 允许在更安全的上下文中执行释放操作
- 避免在持有锁的情况下执行可能阻塞的操作

### 4 __fput：真正释放文件资源

`__fput` 是最终释放文件资源的函数：

```c
static void __fput(struct file *file)
{
    might_sleep();
    fsnotify_close(file);
    /* 调用文件系统的 release 方法 */
    if (file->f_op && file->f_op->release)
        file->f_op->release(inode, file);
    /* 释放 file 结构占用的其他资源 */
    /* ... */
    kmem_cache_free(filp_cachep, file);
}
```

`__fput` 的主要工作：
1. 调用文件系统的 `release` 方法（如果存在）
2. 释放与文件关联的其他资源（如地址空间、锁等）
3. 将 `struct file` 结构归还给 slab 分配器

## 六、release 与 flush 的区别

在文件操作表（`struct file_operations`）中，有两个与关闭相关的方法：`flush` 和 `release`。

### 1 flush：每次关闭都调用

- 在每次 `close` 系统调用时都会调用
- 主要用于刷新缓冲数据、等待未完成的 I/O 操作
- 如果 `flush` 失败，错误会返回给用户程序
- 对于普通文件，`flush` 通常用于刷新页缓存中的数据

### 2 release：仅最后一次关闭时调用

- 仅当文件的引用计数降为 0 时才调用
- 用于释放文件占用的所有资源
- `release` 的返回值通常被忽略
- 对于普通文件，`release` 用于释放 `struct file` 结构

### 3 为什么需要区分

这种设计的核心原因在于**引用计数**：一个文件可以被多个进程同时打开（通过 `open` 或 `dup`），每个打开操作都会增加引用计数。当其中一个进程关闭文件时，不能立即释放文件资源，因为其他进程可能还在使用。

- `flush` 在每次关闭时都执行，确保数据及时写入磁盘
- `release` 只在最后一次关闭时执行，确保资源不会提前释放

## 七、特殊文件类型的 close 处理

`close` 系统调用不仅用于关闭普通文件，还用于关闭设备文件和 socket。

### 1 普通文件的 close

对于 ext4、xfs 等普通文件系统：
- `flush` 方法通常调用 `filemap_flush` 或类似函数，将页缓存中的脏数据写回磁盘
- `release` 方法释放 `struct file` 结构，并减少 inode 的引用计数

### 2 Socket 的 close

当关闭 socket 时，VFS 会调用 socket 文件系统注册的 `release` 方法：

```c
/* socket 文件系统的 release 方法 */
static int sock_close(struct inode *inode, struct file *filp)
{
    return sock_release(SOCKET_I(inode));
}
```

`sock_release` 最终会调用传输层的 `close` 方法：
- 对于 TCP，调用 `tcp_close`，触发四次挥手过程
- 对于 UDP，调用 `udp_close`，直接释放资源

对于 TCP 连接，如果接收缓冲区中还有未读取的数据，内核会先清空接收缓冲区。如果设置了 `SO_LINGER` 选项，内核会等待指定时间后再关闭连接。

### 3 设备文件的 close

对于字符设备和块设备：
- `flush` 方法通常调用设备驱动的 `flush` 回调
- `release` 方法调用设备驱动的 `release` 回调，释放设备资源

## 八、忘记 close 的后果

如果用户程序忘记调用 `close` 关闭文件描述符，会导致以下问题：
1. **资源泄漏**：文件描述符是有限资源（受 `RLIMIT_NOFILE` 限制），长期泄漏会导致进程无法打开新文件
2. **内存泄漏**：`struct file` 结构和相关的页缓存不会被释放
3. **数据丢失**：页缓存中的脏数据可能不会被写回磁盘

当进程退出时，内核会自动关闭所有打开的文件描述符。但对于长期运行的服务器程序，忘记关闭文件描述符会导致严重的资源泄漏。

**【检测文件描述符泄漏】** 可以使用 `lsof` 工具检测进程的文件描述符泄漏：

```bash
lsof -p <pid>
```

该命令会列出进程打开的所有文件，帮助定位泄漏源。

## 九、close_range：批量关闭文件描述符

除了单独的 `close` 系统调用，Linux 还提供了 `close_range` 系统调用，用于高效地关闭一段范围内的文件描述符：

```c
int close_range(unsigned int first, unsigned int last, unsigned int flags);
```

`close_range` 的主要特点：
- 可以一次性关闭从 `first` 到 `last` 的所有文件描述符
- 比循环调用 `close` 更高效
- 支持 `CLOSE_RANGE_UNSHARE` 标志，在关闭前先复制文件描述符表

## 十、完整调用链总结

从用户空间的 `close` 函数到最终释放文件资源，完整的调用链如下：

```text
用户空间: close(fd)
    ↓ (系统调用)
内核入口: sys_close()                         [fs/open.c]
    ↓
__close_fd()                                  [fs/file.c]
    ├── spin_lock(&files->file_lock)         // 锁定文件描述符表
    ├── files_fdtable(files)                 // 获取文件描述符表
    ├── fdt->fd[fd] = NULL                   // 清除文件描述符表项 (RCU)
    ├── __put_unused_fd(files, fd)           // 释放文件描述符
    │   ├── FD_CLR(fd, fdt->close_on_exec)  // 清除 close_on_exec 位
    │   └── 标记 fd 为可用
    ├── spin_unlock(&files->file_lock)              // 解锁
    └── filp_close(file, files)                     // 关闭文件
        ├── filp->f_op->flush()                     // 调用 flush 方法（每次关闭都执行）
        │   └── 刷新缓冲数据，等待 I/O 完成
        └── fput(filp)                         // 减少引用计数
            ├── atomic_dec_and_test(&f_count)  // 原子递减并测试
            ├── 如果 f_count > 0: 直接返回
            └── 如果 f_count == 0: 释放文件
                ├── 注册 task_work (延迟释放)
                └── (返回用户空间时) __fput()
                    ├── fsnotify_close()                 // 通知文件系统事件
                    ├── filp->f_op->release()            // 调用 release 方法
                    │   └── 释放文件系统特定资源
                    └── kmem_cache_free()                // 释放 struct file
```

## 十一、总结

Linux VFS 的 `close` 系统调用通过以下设计实现了安全、高效的文件关闭操作：
1. **系统调用入口**：通过 `SYSCALL_DEFINE1` 定义系统调用，使用 `__close_fd` 作为核心实现
2. **文件描述符表管理**：通过自旋锁保护文件描述符表的并发访问，使用 RCU 机制安全地清除表项
3. **引用计数机制**：通过 `f_count` 引用计数跟踪文件的打开次数，确保只有在最后一个引用关闭时才释放资源
4. **flush 与 release 分离**：`flush` 在每次关闭时执行（刷新数据），`release` 仅在最后引用关闭时执行（释放资源）
5. **延迟释放**：通过 `task_work` 机制将文件释放操作延迟到进程返回用户空间时执行，减少内核栈深度
6. **特殊文件类型支持**：通过文件操作表的多态机制，支持普通文件、socket、设备文件等不同类型的关闭操作

整个 `close` 流程体现了 VFS 作为**中间层**的核心设计思想：通过统一的接口（`flush` 和 `release` 方法）抽象不同文件类型的关闭行为，让上层应用通过相同的系统调用关闭不同类型的文件，同时利用引用计数和延迟释放机制在安全性和性能之间取得平衡。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [关闭文件](https://blog.csdn.net/Scroll_C/article/details/123240392)
<strong style="color: #db8ef7;">[2]</strong> [聊聊Posix语义之open和close系统调用](https://cloud.tencent.com.cn/developer/article/2074603)
<strong style="color: #db8ef7;">[3]</strong> [Linux环境编程：从应用到内核](https://book.qq.com/book-read/831302/28)
<strong style="color: #db8ef7;">[4]</strong> [关于关闭一个还有没发送数据完的TCP连接思考区](https://cloud.tencent.com.cn/developer/article/1755504)
<strong style="color: #db8ef7;">[5]</strong> [Linux内核源码 - fs/open.c (close系统调用)](https://elixir.bootlin.com/linux/latest/source/fs/open.c)
<strong style="color: #db8ef7;">[6]</strong> [Linux内核源码 - fs/file.c (文件描述符管理)](https://elixir.bootlin.com/linux/latest/source/fs/file.c)