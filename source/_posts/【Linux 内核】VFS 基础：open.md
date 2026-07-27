---
title: 【Linux 内核】VFS 基础：open
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
abbrlink: e4ee08dd
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-21 15:33:23
updated: 2026-07-27 15:57:59
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从用户空间到内核：open 系统调用

用户程序通过 `open` 函数打开文件，这在 C 语言中是最常见的文件操作之一：

```c
int fd = open("/home/user/test.txt", O_RDONLY);
```

`open` 是标准 C 库提供的函数，它内部会触发系统调用，将控制权从用户空间转移到内核空间。系统调用是用户程序与内核交互的特定机制，通过它，程序可以请求内核执行特权操作。

在 x86 架构上，系统调用通过软中断（如 `int $0x80`）或更高效的 `sysenter` 指令实现，将 CPU 从用户态切换到内核态，并跳转到内核中预定义的系统调用入口。内核根据系统调用号在系统调用表中查找对应的处理函数——对于 `open`，这个函数是 `sys_open`。

## 二、open 系统调用的内核入口

### 1 sys_open：系统调用的定义

在 Linux 内核源码 `fs/open.c` 中，`open` 系统调用通过 `SYSCALL_DEFINE3` 宏定义：

```c
SYSCALL_DEFINE3(open, const char __user *, filename, int, flags, umode_t, mode)
{
    if (force_o_largefile())
        flags |= O_LARGEFILE;
    return do_sys_open(AT_FDCWD, filename, flags, mode);
}
```

`SYSCALL_DEFINE3` 表示该系统调用有三个参数：
- `filename`：用户空间传递的文件路径
- `flags`：打开标志（如 `O_RDONLY`、`O_CREAT` 等）
- `mode`：创建文件时的权限模式

`force_o_largefile()` 用于确定是否需要自动添加 `O_LARGEFILE` 标志——在 64 位系统上内核会自动添加，而在 32 位系统上需要显式设置才能操作大文件。

`AT_FDCWD` 是一个特殊值（-100），表示文件路径的查找起点是当前工作目录。

### 2 do_sys_open：核心分发函数

`do_sys_open` 是 `open` 系统调用的核心实现，它完成了打开文件的主要工作：

```c
long do_sys_open(int dfd, const char __user *filename, int flags, umode_t mode)
{
    struct open_flags op;
    int fd = build_open_flags(flags, mode, &op);
    struct filename *tmp;

    if (fd)
        return fd;

    tmp = getname(filename);
    if (IS_ERR(tmp))
        return PTR_ERR(tmp);

    fd = get_unused_fd_flags(flags);
    if (fd >= 0) {
        struct file *f = do_filp_open(dfd, tmp, &op);
        if (IS_ERR(f)) {
            put_unused_fd(fd);
            fd = PTR_ERR(f);
        } else {
            fsnotify_open(f);
            fd_install(fd, f);
        }
    }

    putname(tmp);
    return fd;
}
```

这个函数主要完成六个步骤：
1. **构建打开标志：**`build_open_flags` 将用户传入的 `flags` 和 `mode` 转换为内核内部使用的 `open_flags` 结构体，处理权限模式转换、特殊标志（`O_TRUNC`、`O_APPEND` 等）以及打开意图设置（`LOOKUP_OPEN`、`LOOKUP_CREATE` 等）。
2. **拷贝文件名：**`getname` 将用户空间的文件名字符串复制到内核空间，确保安全性。
3. **分配文件描述符：**`get_unused_fd_flags` 在当前进程的文件描述符表中找到一个空闲位置。文件描述符本质上是一个整数，它作为索引指向进程打开文件表中对应的 `struct file` 结构。
4. **执行实际打开：**`do_filp_open` 是打开文件的核心函数，负责构造并初始化 `struct file` 结构体。
5. **安装文件描述符：** 如果打开成功，`fd_install` 将文件描述符与 `struct file` 结构绑定。
6. **释放文件名并返回：** 释放内核空间的文件名副本，返回文件描述符。

## 三、do_filp_open：打开文件的核心

`do_filp_open` 函数是文件打开操作的核心入口，它接收文件描述符、文件名和打开标志，返回一个代表打开文件的 `struct file` 对象。

```c
struct file *do_filp_open(int dfd, struct filename *pathname,
                          const struct open_flags *op)
{
    struct nameidata nd;
    struct file *filp;

    set_nameidata(&nd, dfd, pathname);
    filp = path_openat(&nd, op, flags | LOOKUP_RCU);
    /* 如果 RCU 查找失败，回退到非 RCU 模式 */
    if (unlikely(filp == ERR_PTR(-ECHILD)))
        filp = path_openat(&nd, op, flags);
    restore_nameidata();
    return filp;
}
```

### 1 nameidata：路径查找的上下文

`struct nameidata` 是路径查找过程中的核心上下文结构，它记录了：
- 当前查找到的路径（`struct path`，包含 `vfsmount` 和 `dentry`）
- 当前正在处理的路径分量
- 查找标志（如是否跟随符号链接）
- 符号链接展开栈（用于处理嵌套符号链接）

### 2 path_openat：路径查找与打开

`path_openat` 是真正执行路径查找和文件打开的函数。它在 `do_filp_open` 中被调用，完成以下核心工作：

```c
static struct file *path_openat(struct nameidata *nd,
                                const struct open_flags *op,
                                unsigned flags)
{
    struct file *file;
    int error;

    file = alloc_empty_file(op->open_flag, current_cred());
    if (IS_ERR(file))
        return file;

    const char *s = path_init(nd, flags);
    while (!(error = link_path_walk(s, nd)) &&
           (s = open_last_lookups(nd, file, op)) != NULL)
        ;
    if (!error)
        error = do_open(nd, file, op);

    terminate_walk(nd);
    /* ... 错误处理 ... */
    return file;
}
```

1. **分配 file 结构：**`alloc_empty_file` 分配并初始化一个空的 `struct file` 结构，设置基本的权限和引用计数。
2. **路径初始化：**`path_init` 初始化路径查找的起点，根据 `dfd` 参数确定从根目录还是当前工作目录开始查找。
3. **路径遍历：**`link_path_walk` 逐级解析路径名中的每个分量。
4. **处理最后一个分量：**`open_last_lookups` 专门处理路径的最后一个分量，这是文件打开的关键步骤。
5. **执行打开：**`do_open` 执行最终的打开操作，调用具体文件系统的 `open` 方法。

## 四、路径遍历：link_path_walk

`link_path_walk` 是路径查找的核心函数，它从路径的起点开始，逐级解析每个路径分量。

### 1 路径分量的解析

路径名以 `/` 作为分隔符。`link_path_walk` 会依次处理每个分量：
- 对于空分量（连续的 `/`），直接跳过
- 对于 `.`，停留在当前目录
- 对于 `..`，向上移动到父目录
- 对于普通名称，通过 `walk_component` 查找对应的 dentry

### 2 walk_component：查找单个分量

`walk_component` 负责查找单个路径分量对应的 dentry。它包含两个查找路径：

**快速路径（lookup_fast）**：首先在 dentry 缓存中查找（使用 RCU 锁）。dentry 缓存通过全局哈希表 `dentry_hashtable` 管理，哈希键由父 dentry 地址和当前名称的哈希值共同计算。如果缓存命中，直接返回 dentry。

**慢速路径（lookup_slow）**：如果快速查找失败（例如 dentry 不在缓存中，或缓存已过期），则进入慢速路径。慢速路径会对父目录 inode 加锁，然后再次尝试从缓存查找，如果仍然失败，则调用底层文件系统的 `lookup` 方法。

### 3 lookup_real：调用文件系统的 lookup

当 dentry 不在缓存中时，`lookup_real` 会调用具体文件系统的 `lookup` 方法：

```c
dentry = dir->i_op->lookup(dir_inode, dentry, flags);
```

对于 ext4 文件系统，这会调用 `ext4_lookup`；对于 NFS，则调用 `nfs_lookup`。文件系统的 `lookup` 方法负责从磁盘或网络中读取目录项信息，创建 inode，并将 dentry 与 inode 关联起来。

### 4 follow_managed：处理挂载点

在路径遍历过程中，每找到一个 dentry，都会调用 `follow_managed` 检查该 dentry 是否是一个挂载点。如果是，`follow_managed` 会通过查找 `mount_hashtable` 找到对应的 `vfsmount`，然后用被挂载文件系统的根 dentry 替换当前路径中的 dentry。这正是上一篇文章[[02-VFS 基础：mount### 2 真相：mount_hashtable 与 follow_managed|《VFS基础：mount》]]中描述的挂载点跳转机制在路径查找中的应用。

## 五、打开最后一个分量：open_last_lookups

当 `link_path_walk` 完成除最后一个分量外的所有路径解析后，`open_last_lookups` 负责处理路径的最后一个分量。

### 1 lookup_open：查找或创建

`lookup_open` 是处理最后一个分量的核心函数，它执行 "lookup and maybe create" 操作：

```c
static struct dentry *lookup_open(struct nameidata *nd, struct file *file,
                                  const struct open_flags *op, bool got_write)
{
    struct dentry *dir = nd->path.dentry;
    struct inode *dir_inode = dir->d_inode;

    /* 1. 从 dentry 缓存中查找 */
    dentry = d_lookup(dir, &nd->last);

    /* 2. 如果缓存中有且是 positive（有 inode），直接返回 */
    if (dentry && dentry->d_inode)
        return dentry;

    /* 3. 如果需要创建文件（O_CREAT） */
    if (open_flag & O_CREAT) {
        /* 检查权限，准备创建 */
    }

    /* 4. 如果文件系统支持 atomic_open，调用它 */
    if (dir_inode->i_op->atomic_open) {
        dentry = atomic_open(nd, dentry, file, open_flag, mode);
        return dentry;
    }

    /* 5. 否则，调用文件系统的 lookup */
    if (d_in_lookup(dentry)) {
        dentry = dir_inode->i_op->lookup(dir_inode, dentry, nd->flags);
    }

    /* 6. 如果是 negative dentry 且需要创建，调用文件系统的 create */
    if (!dentry->d_inode && (open_flag & O_CREAT)) {
        error = dir_inode->i_op->create(dir_inode, dentry, mode, open_flag & O_EXCL);
    }

    return dentry;
}
```

`lookup_open` 的执行逻辑如下：
1. **d_lookup**：从 dentry 缓存中查找最后一个分量对应的 dentry
2. **缓存命中**：如果找到 positive dentry（已关联 inode），直接返回
3. **atomic_open**：如果文件系统实现了 `atomic_open`，调用它以原子方式完成查找和打开
4. **lookup**：如果 dentry 处于 "in-lookup" 状态，调用文件系统的 `lookup` 方法
5. **create**：如果是 negative dentry（不存在）且指定了 `O_CREAT`，调用文件系统的 `create` 方法创建文件

### 2 文件系统的 lookup 和 create

对于不同的文件系统，`lookup` 和 `create` 方法的实现各不相同：
- **ext4_lookup**：在 ext4 目录中查找文件，读取磁盘上的目录项，创建 inode
- **ext4_create**：在 ext4 目录中创建新文件，分配 inode，初始化磁盘数据结构

对于字符设备等特殊文件，`lookup` 可能会调用 `init_special_inode` 来设置特殊的 `i_fop`（如 `def_chr_fops`）。

## 六、执行打开：do_open 与 vfs_open

当路径查找完成并获得了目标文件的 dentry 后，`do_open` 负责执行最终的打开操作。

### 1 do_open：权限检查与打开准备

`do_open` 主要完成以下工作：
1. **权限检查**：调用 `may_open` 检查进程是否有权限以指定方式打开文件（读、写、执行等）
2. **截断处理**：如果指定了 `O_TRUNC` 且文件是普通文件，准备截断文件
3. **调用 vfs_open**：执行实际的打开操作

### 2 vfs_open：调用文件系统的 open 方法

`vfs_open` 是 VFS 层调用具体文件系统 `open` 方法的入口：

```c
int vfs_open(const struct path *path, struct file *file)
{
    file->f_path = *path;
    return do_dentry_open(file, d_backing_inode(path->dentry), NULL);
}
```

`do_dentry_open` 完成以下核心工作：
1. **初始化 file 结构**：设置 `f_inode`、`f_mapping` 等字段
2. **绑定文件操作表**：将 `inode->i_fop` 赋值给 `file->f_op`
3. **调用 open 回调**：如果 `file->f_op->open` 存在，调用它

```c
static int do_dentry_open(struct file *f, struct inode *inode,
                          int (*open)(struct inode *, struct file *))
{
    f->f_inode = inode;
    f->f_mapping = inode->i_mapping;

    /* 绑定文件操作表 */
    f->f_op = fops_get(inode->i_fop);

    /* 调用具体的 open 方法 */
    if (open)
        error = open(inode, f);

    f->f_mode |= FMODE_OPENED;
    return error;
}
```

对于 ext4 文件系统，`inode->i_fop` 指向 `ext4_file_operations`，其中的 `.open` 方法为 `ext4_file_open`。对于字符设备，`i_fop` 则指向设备驱动注册的 `file_operations`。

### 3 fd_install：安装文件描述符

当 `do_dentry_open` 成功返回后，`fd_install` 将文件描述符与 `struct file` 绑定：

```c
void fd_install(unsigned int fd, struct file *file)
{
    struct files_struct *files = current->files;
    struct fdtable *fdt;

    fdt = files_fdtable(files);
    rcu_assign_pointer(fdt->fd[fd], file);
}
```

`fd_install` 将 `struct file` 的指针存入当前进程的文件描述符表中对应下标的位置。此后，用户程序就可以通过文件描述符来访问这个打开的文件了。

## 七、struct file：打开文件的代表

`struct file` 是内核中代表一个打开文件的核心数据结构。每个 `open` 系统调用成功都会创建一个 `struct file` 实例。

```c
struct file {
    struct path f_path;           // 文件路径（dentry + vfsmount）
    struct inode *f_inode;        // 关联的 inode
    const struct file_operations *f_op;  // 文件操作函数表
    unsigned int f_flags;         // 打开标志（O_RDONLY、O_NONBLOCK 等）
    fmode_t f_mode;               // 文件模式（读/写）
    loff_t f_pos;                 // 当前文件偏移量
    atomic_long_t f_count;        // 引用计数
    /* ... 更多字段 ... */
};
```

**关键字段说明：**
- `f_path`：记录文件在目录树中的位置（挂载点 + dentry）
- `f_inode`：指向文件的 inode，包含文件元数据
- `f_op`：文件操作函数表，包含 `read`、`write`、`open`、`release` 等方法
- `f_pos`：当前读写位置，对于普通文件，每次 `read`/`write` 都会更新
- `f_count`：引用计数，多个文件描述符可以指向同一个 `struct file`

当一个进程打开同一个文件多次时，每次打开都会创建新的 `struct file` 实例（除非使用 `dup` 等特殊调用）。每个 `struct file` 有自己的 `f_pos`，因此多个文件描述符可以独立地读写同一个文件。

## 八、完整调用链总结

从用户空间的 `open` 函数到最终调用具体文件系统的打开方法，完整的调用链如下：

```text
用户空间: open()
    ↓ (系统调用)
内核入口: sys_open()                    [fs/open.c]
    ↓
do_sys_open()                             [fs/open.c]
    ├── build_open_flags()              // 构建打开标志
    ├── getname()                         // 拷贝文件名到内核
    ├── get_unused_fd_flags()         // 分配文件描述符
    ├── do_filp_open()                    // 执行打开
    │   └── path_openat()               [fs/namei.c]
    │       ├── alloc_empty_file()       // 分配 struct file
    │       ├── path_init()                 // 初始化路径查找
    │       ├── link_path_walk()         // 遍历路径
    │       │   └── walk_component()
    │       │       ├── lookup_fast()    // 快速缓存查找
    │       │       └── lookup_slow()   // 慢速查找
    │       │           └── lookup_real()
    │       │               └── ext4_lookup() / nfs_lookup() 等
    │       ├── open_last_lookups()      // 处理最后一个分量
    │       │   └── lookup_open()
    │       │       ├── d_lookup()        // 缓存查找
    │       │       ├── atomic_open()   // 原子打开（可选）
    │       │       ├── lookup()           // 文件系统 lookup
    │       │       └── create()           // 文件系统 create（O_CREAT）
    │       └── do_open()                  // 执行打开
    │           └── vfs_open()
    │               └── do_dentry_open()
    │                   └── f_op->open()  // 具体文件系统的 open
    ├── fd_install()                           // 安装文件描述符
    └── 返回 fd
```

## 九、总结

Linux VFS 的 `open` 系统调用通过以下设计实现了文件的统一打开操作：
1. **系统调用入口**：通过 `SYSCALL_DEFINE3` 宏定义系统调用，使用 `do_sys_open` 作为核心分发函数
2. **文件描述符管理**：通过 `get_unused_fd_flags` 在进程的文件描述符表中分配空闲位置
3. **路径查找**：通过 `link_path_walk` 逐级解析路径，利用 dentry 缓存加速查找
4. **dentry 缓存**：通过全局 `dentry_hashtable` 缓存目录项，快速路径（`lookup_fast`）使用 RCU 锁实现无阻塞查找
5. **挂载点处理**：通过 `follow_managed` 在路径查找中动态处理挂载点跳转
6. **文件系统抽象**：通过 `inode->i_op->lookup`、`inode->i_op->create` 和 `file->f_op->open` 等回调接口，让不同文件系统实现各自的底层操作
7. **file 结构**：`struct file` 代表一个打开的文件实例，包含文件路径、操作函数表、当前偏移量等信息

整个 `open` 流程体现了 VFS 作为**中间层**的核心设计思想：通过统一的接口（`file_operations`、`inode_operations`）抽象不同文件系统的差异，让上层应用通过相同的系统调用访问不同类型的文件系统（ext4、xfs、NFS、设备文件等），对用户程序完全透明。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [open 系统调用实现](https://geekdaxue.co/read/linux-insides-zh/SysCall-linux-syscall-5.md)
<strong style="color: #db8ef7;">[2]</strong> [内核模块实验3 Linux内核open的分析](https://www.cnblogs.com/lx--/p/16633817.html)
<strong style="color: #db8ef7;">[3]</strong> [Linux内核系统调用深度解析：open系统调用实现](https://blog.csdn.net/gitblog_00101/article/details/148464305)
<strong style="color: #db8ef7;">[4]</strong> [linux 内核open文件流程](https://zhuanlan.zhihu.com/p/471175983)
<strong style="color: #db8ef7;">[5]</strong> [Linux内核源码 - fs/namei.c (路径查找与open实现)](https://elixir.bootlin.com/linux/latest/source/fs/namei.c)
<strong style="color: #db8ef7;">[6]</strong> [Linux内核源码 - fs/open.c (open系统调用)](https://elixir.bootlin.com/linux/latest/source/fs/open.c)