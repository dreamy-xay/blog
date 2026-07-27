---
title: 【Linux 内核】VFS 基础：mount
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
abbrlink: 1370ad10
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-20 09:54:25
updated: 2026-07-27 15:57:54
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从 mount 命令到系统调用

在 Linux 系统中，用户通过 `mount` 命令将文件系统挂载到目录树上。一个典型的挂载命令如下：

```bash
mount -t ext4 /dev/sda1 /mnt/data
```

或挂载 NFS 网络文件系统：

```bash
mount -t nfs -o ro 192.168.1.100:/export /mnt/nfs
```

这些命令的背后，最终触发的是内核的 `mount` 系统调用。`mount` 系统调用在内核中的定义位于 `fs/namespace.c`，使用 `SYSCALL_DEFINE5` 宏声明：

```c
SYSCALL_DEFINE5(mount, char __user *, dev_name, char __user *, dir_name,
                char __user *, type, unsigned long, flags, void __user *, data)
```

各参数的含义如下：

| 参数         | 作用                 | 示例                                  |
| ---------- | ------------------ | ----------------------------------- |
| `dev_name` | 待挂载的设备（块设备或网络设备路径） | `/dev/sda1`、`192.168.1.100:/export` |
| `dir_name` | 挂载点路径，必须是已存在的目录    | `/mnt/data`                         |
| `type`     | 文件系统类型名称           | `ext4`、`xfs`、`nfs`                  |
| `flags`    | 挂载标志，控制挂载行为与访问权限   | `MS_RDONLY`、`MS_NOATIME`            |
| `data`     | 文件系统特定的额外选项        | `discard`、`noatime,nodiratime`      |

系统调用入口函数首先调用 `copy_mount_string` 和 `copy_mount_options`，将用户空间传递的字符串参数（设备名、挂载点、文件系统类型）和选项数据复制到内核空间。`data` 参数不能超过一个 page 大小，内核会做相应的截断检查。完成数据拷贝后，调用 `do_mount` 进入核心挂载逻辑。

用户空间的 `mount` 命令会解析 `-o` 选项：能够识别的通用选项（如 `ro`、`noatime`）转换为 `flags` 位掩码传递给系统调用；不能识别的文件系统特有选项则拼接为字符串，通过 `data` 参数传递。对于 NFS 等复杂文件系统，用户态还会将选项组装为特定的数据结构（如 `struct nfs_mount_data`）再传递给内核。

## 二、do_mount：挂载的多路分发器

`do_mount` 函数是挂载流程的总入口，位于 `fs/namespace.c`。它充当一个多路分发器的角色，根据 `flags` 参数决定执行哪种挂载操作。

### 1 参数校验与标志转换

`do_mount` 首先对挂载点目录 `dir_name` 进行有效性检查——不能为空，且必须在 PAGE_SIZE 范围内。然后处理历史兼容的魔数标志（`MS_MGC_VAL`），将其从 `flags` 中清除。接着将 `flags` 中的挂载点相关标志（如 `MS_NOSUID`、`MS_NOATIME` 等）转换为内部使用的 `mnt_flags`。

### 2 获取挂载点路径

`do_mount` 调用 `user_path_at`（或早期内核中的 `path_lookup`）获取挂载点目录的 `struct path` 结构。`struct path` 包含两个关键字段：

```c
struct path {
    struct vfsmount *mnt;   // 挂载点所在文件系统的 vfsmount
    struct dentry *dentry;  // 挂载点目录的 dentry
};
```

这个结构代表了挂载点在现有目录树中的确切位置。

### 3 挂载模式分发

根据 `flags` 中的不同标志位，`do_mount` 进入不同的处理分支：
- **MS_REMOUNT**：重新挂载已挂载的文件系统，修改挂载选项
- **MS_BIND**：绑定挂载，将一个目录或文件挂载到另一个位置
- **MS_MOVE**：移动挂载，将已挂载的文件系统移动到新位置
- **其他（默认）** ：执行新的挂载操作，调用 `do_new_mount`

对于最常见的普通挂载场景，流程进入 `do_new_mount`。

## 三、do_new_mount：新挂载的核心

`do_new_mount` 是新文件系统挂载的核心函数，完成三个主要步骤：
1. **获取文件系统类型**：通过 `get_fs_type` 查找指定名称的 `file_system_type` 实例
2. **创建挂载实例**：通过 `vfs_kern_mount` 创建 `vfsmount` 结构
3. **添加到挂载树**：通过 `do_add_mount` 将新挂载接入全局挂载树

### 1 获取文件系统类型：get_fs_type

内核中所有已注册的文件系统类型通过一个名为 `file_systems` 的全局单向链表维护。`get_fs_type` 扫描这个链表，根据传入的名称（如 `"ext4"` 或 `"nfs4"`）查找对应的 `struct file_system_type` 实例。

如果找不到，内核会尝试**动态加载**对应的内核模块（KO）。例如，NFS 文件系统的模块别名为 `fs-nfs` 和 `fs-nfs4`，通过 `modinfo` 可以查看这些别名信息。模块加载时会执行模块的 `init` 函数，该函数调用 `register_filesystem` 将 `file_system_type` 注册到全局链表中。

`register_filesystem` 的实现很直观：

```c
int register_filesystem(struct file_system_type *fs)
{
    // 在全局链表 file_systems 中查找是否已注册
    p = find_filesystem(fs->name, strlen(fs->name));
    if (*p)
        res = -EBUSY;           // 同一文件系统不能注册两次
    else
        *p = fs;                // 添加到链表末尾
    return res;
}
```

通过 `/proc/filesystems` 可以查看系统中所有已注册的文件系统类型。

`struct file_system_type` 是连接 VFS 与具体文件系统的桥梁，其关键字段包括：

```c
struct file_system_type {
    const char *name;                              // 文件系统名称
    struct dentry *(*mount)(struct file_system_type *,
                            int, const char *, void *);  // 挂载函数
    void (*kill_sb)(struct super_block *);         // 卸载函数
    struct file_system_type *next;                 // 链表指针
};
```

### 2 创建挂载实例：vfs_kern_mount

`vfs_kern_mount` 是创建挂载实例的核心函数。它完成以下工作：
1. 调用 `alloc_vfsmnt` 分配并初始化 `struct mount` 结构
2. 调用 `mount_fs` 函数，通过文件系统类型的 `.mount` 方法获得根 `dentry`
3. 将新创建的 `super_block` 标记为 `MS_BORN`

`mount_fs` 的核心就是调用 `type->mount(type, flags, name, data)`。这个调用最终会创建该文件系统的**超级块**、**根 inode** 和**根 dentry**，并返回根 dentry 的指针。

`vfs_kern_mount` 的返回值是 `struct vfsmount`：

```c
struct vfsmount {
    struct dentry *mnt_root;    // 挂载的文件系统根 dentry
    struct super_block *mnt_sb; // 指向超级块
    int mnt_flags;              // 挂载标志
};
```

### 3 添加到挂载树：do_add_mount

`do_add_mount` 将新创建的挂载实例接入全局挂载树。这个函数涉及**挂载传播**（mount propagation）机制，处理 shared、slave、private 等挂载点属性，但核心操作是建立父子挂载关系：

```c
void mnt_set_mountpoint(struct mount *mnt, struct mountpoint *mp,
                        struct mount *child_mnt)
{
    child_mnt->mnt_mountpoint = dget(mp->m_dentry);  // 挂载点 dentry
    child_mnt->mnt_parent = mnt;                     // 父挂载点
}
```

同时，挂载点目录的 `dentry->d_flags` 会被置上 `DCACHE_MOUNTED` 标记。这个标记在后续路径查找中至关重要——它告诉内核"这个目录下面挂载了另一个文件系统"。

`do_add_mount` 还会将新挂载加入全局的 `mount_hashtable`，以便在路径查找时快速查找挂载点对应的 `vfsmount`。

## 四、关键数据结构详解

在深入源码之前，需要完整理解 VFS 中与挂载相关的几个核心数据结构。

### 1 struct vfsmount 与 struct mount

`vfsmount` 代表一个已挂载的文件系统实例。每个不同的挂载点对应一个独立的 `vfsmount` 结构，属于同一文件系统的所有目录和文件共享同一个 `vfsmount`。

`struct mount` 是 `vfsmount` 的扩展，包含了挂载点在全局挂载树中的关系信息：

```c
struct mount {
    struct hlist_node mnt_hash;          // 挂载哈希链表节点
    struct mount *mnt_parent;            // 父挂载点（所在文件系统）
    struct dentry *mnt_mountpoint;       // 挂载点目录的 dentry
    struct vfsmount mnt;                 // 核心 vfsmount 结构
    struct list_head mnt_mounts;         // 子挂载点链表
    struct list_head mnt_child;          // 父挂载点的子节点链表
};
```

**关键理解：**`mnt_parent` 指向挂载点所在文件系统的 `mount` 结构，`mnt_mountpoint` 是挂载点目录的 dentry。通过这两个字段，内核可以追踪整个挂载树的层级关系——从子挂载点一路回溯到根文件系统。

### 2 struct super_block

超级块代表一个已挂载的文件系统实例。每当一个块设备被格式化并挂载时，内核都会在内存中创建一个超级块。关键字段包括：
- `s_root`：文件系统根目录的 dentry
- `s_fs_info`：指向文件系统特有的私有信息（如 NFS 的 `nfs_server`、ext4 的 `ext4_sb_info`）
- `s_op`：超级块操作函数集（`struct super_operations`）
- `s_magic`：文件系统魔数，用于识别文件系统类型

### 3 struct dentry

dentry（目录项）是路径解析的核心数据结构。它在内存中描述路径到 inode 的映射，主要字段包括：
- `d_hash`：用于全局 dentry 哈希表的节点
- `d_parent`：父 dentry 指针
- `d_name`：目录项名称（`struct qstr`，包含名称字符串和哈希值）
- `d_inode`：关联的 inode 指针（NULL 表示负 dentry）
- `d_sb`：所属超级块
- `d_op`：dentry 操作函数集
- `d_flags`：标志位（如 `DCACHE_MOUNTED`）

值得注意的是，dentry **没有直接对应的磁盘数据结构**——它是纯内存结构，用于加速路径查找。

### 4 struct inode

inode 代表一个文件或目录的元数据：
- `i_ino`：inode 编号
- `i_mode`：文件类型与权限
- `i_atime`、`i_mtime`、`i_ctime`：访问/修改/状态变更时间
- `i_op`：inode 操作函数集（`struct inode_operations`）
- `i_fop`：文件操作函数集（`struct file_operations`）
- `i_mapping`：指向 `address_space`，管理页缓存
- `i_sb`：所属超级块

## 五、深入文件系统挂载：以 tmpfs 为例

理解了 VFS 层的框架后，通过一个具体的文件系统（tmpfs）来串联整个流程。

tmpfs 的 `file_system_type` 定义如下：

```c
static struct file_system_type tmpfs_fs_type = {
    .name   = "tmpfs",
    .mount  = shmem_mount,
    .kill_sb = kill_litter_super,
};
```

当 `mount_fs` 调用 `type->mount` 时，实际执行的是 `shmem_mount`。

### 1 shmem_mount：文件系统特定的挂载入口

`shmem_mount` 调用通用辅助函数 `mount_nodev`：

```c
static struct dentry *shmem_mount(struct file_system_type *fs_type,
                                  int flags, const char *dev_name, void *data)
{
    return mount_nodev(fs_type, flags, data, shmem_fill_super);
}
```

`mount_nodev` 是用于**无块设备**文件系统（如 tmpfs、procfs、sysfs）的通用挂载函数。

### 2 mount_nodev：超级块的创建

`mount_nodev` 的核心工作：
1. 调用 `sget` 查找或创建超级块
2. 调用 `fill_super` 函数填充超级块
3. 返回根 dentry

#### 2.1 sget：查找或创建超级块

`sget` 是超级块管理的核心函数。它首先在文件系统类型的 `fs_supers` 链表中查找是否已有符合条件的超级块（通过 `test` 回调函数判断）。如果找到则复用；否则分配一个新的 `super_block` 结构，并将其加入全局 `super_blocks` 链表和文件系统类型的链表中。

这种机制使得**同一个块设备不会被重复挂载**，也支持了挂载命名空间等特性。

#### 2.2 shmem_fill_super：填充超级块

`shmem_fill_super` 完成 tmpfs 特有的超级块初始化：
1. 分配并初始化 `struct shmem_sb_info`（tmpfs 私有数据），存入 `sb->s_fs_info`
2. 设置 `sb->s_magic = TMPFS_MAGIC`
3. 设置 `sb->s_op = &shmem_ops`
4. 调用 `shmem_get_inode` 创建根目录的 inode
5. 调用 `d_make_root(inode)` 创建根 dentry 并与 inode 关联

`shmem_get_inode` 中可以看到 inode 的创建过程：

```c
inode = new_inode(sb);          // 分配 inode
inode->i_ino = get_next_ino();  // 分配 inode 编号
inode->i_mode = mode;           // 设置文件类型与权限
inode->i_atime = inode->i_mtime = inode->i_ctime = current_time(inode);
// 根据文件类型设置对应的操作函数集
switch (mode & S_IFMT) {
    case S_IFDIR:
        inode->i_op = &shmem_dir_inode_operations;
        inode->i_fop = &simple_dir_operations;
        break;
    // ...
}
```

### 3 根 dentry 的创建

`d_make_root(inode)` 创建一个名为 `"/"` 的根 dentry，并建立以下关联：
- `dentry->d_inode = inode`
- `dentry->d_parent = dentry`（根指向自身）
- `dentry->d_sb = sb`
- `sb->s_root = dentry`

至此，一个完整的文件系统实例已经在内核中建立起来：超级块记录了文件系统的全局信息，根 inode 代表了根目录的元数据，根 dentry 代表了根目录在目录树中的位置。

## 六、NFS 挂载的特殊性

NFS（网络文件系统）的挂载流程与本地块设备文件系统有显著不同。其特殊性在于：**没有块设备**、**需要与远程服务器通信**、**支持多版本协议**。

NFSv4 的 `file_system_type` 实例为：

```c
struct file_system_type nfs4_fs_type = {
    .name   = "nfs4",
    .mount  = nfs_fs_mount,
    .kill_sb = nfs_kill_super,
};
```

### 1 nfs_fs_mount：协议版本分发

`nfs_fs_mount` 首先解析用户传入的 `data` 参数（强转为 `struct nfs_mount_data` 或 `struct nfs4_mount_data`），确定 NFS 协议版本。然后通过 `nfs_subversion` 找到对应版本的 RPC 操作集，调用 `try_mount` 函数。

对于 NFSv4，`try_mount` 指向 `nfs4_try_mount`。

### 2 nfs4_try_mount：伪根与导出路径

NFSv4 支持**伪根节点**（pseudo root）概念——服务器将所有导出的目录组织在一个虚拟的根 `/` 下。因此挂载流程分为两步：
1. **挂载远程根**：调用 `nfs_do_root_mount`，以 `nfs4_remote_fs_type` 为参数，挂载 NFS 服务器的根目录 `"/"`
2. **沿导出路径查找**：调用 `nfs_follow_remote_path`，从远程根开始沿着 `export_path` 逐级解析，最终到达实际的导出目录

`nfs_do_root_mount` 内部再次调用通用的 `vfs_kern_mount`，但这次使用的是 `nfs4_remote_fs_type`，其 `.mount` 方法为 `nfs4_remote_mount`。

### 3 nfs4_remote_mount：创建 NFS 服务器连接

`nfs4_remote_mount` 完成：
1. **nfs4_create_server**：创建 `struct nfs_server` 结构，初始化 `backing_dev_info`，建立 RPC 客户端与服务器的连接，通过 `NFSPROC4_CLNT_LOOKUP_ROOT` 获取根文件句柄
2. **nfs_fs_mount_common**：创建超级块、根 inode 和根 dentry

`nfs_fhget` 是 NFS 中 inode 创建的核心函数：它通过远程返回的 `fileid` 计算 inode 编号，查找全局 `inode_hashtable`，如果未找到则创建新的 inode，并根据文件类型（常规文件、目录、符号链接等）设置相应的操作函数集。

### 4 nfs_follow_remote_path：沿路径解析

`nfs_follow_remote_path` 调用 `mount_subtree` → `vfs_path_lookup`，从远程根开始逐级解析 `export_path` 中的每个路径分量。每解析一个分量，都会向 NFS 服务器发起 `LOOKUP` RPC 请求，在本地创建对应的 dentry 和 inode，并建立父子关系。

最终返回的是**导出目录**的 dentry，而不是远程根 `"/"` 的 dentry。

## 七、路径查找

挂载完成后，最核心的问题浮出水面：**当用户访问 `/mnt/remote/file` 时，内核如何从本地挂载点 `/mnt` "跳转"到远程文件系统的根目录？**

### 1 直觉的误区

一个直观的想法是：挂载操作会修改远程根 dentry 的 `d_parent`，让它指向本地挂载点目录的 dentry。但事实并非如此——远程根 dentry 的 `d_parent` 始终指向自身。挂载操作**并不修改 dentry 的父子关系**。

### 2 真相：mount_hashtable 与 follow_managed

答案隐藏在 **`mount_hashtable`** 和 **`follow_managed`** 中。

`mount_hashtable` 是一个全局哈希表，记录了所有挂载点与其对应 `vfsmount` 的映射关系。哈希键由**父 mount 结构**和**挂载点 dentry** 共同计算。

在路径查找过程中（如 `open` 系统调用的实现），每解析一个路径分量，都会调用 `follow_managed` 检查当前 dentry 是否是一个挂载点：

```c
// sys_open 的函数调用链（简化）
sys_open
  -> do_sys_open
    -> do_filp_open
      -> path_openat
        -> link_path_walk
          -> walk_component
            -> lookup_fast
              -> __follow_mount_rcu
                -> __lookup_mnt   // 在 mount_hashtable 中查找
```

如果当前 dentry 带有 `DCACHE_MOUNTED` 标记，`__lookup_mnt` 会从 `mount_hashtable` 中找到对应的 `vfsmount`，然后用该 `vfsmount` 的 `mnt_root`（即**被挂载文件系统的根 dentry**）**替换**当前 `path` 结构中的 dentry。

**这就是本地与远程衔接的关键**：挂载操作并没有修改 dentry 的父子关系，而是在 lookup 过程中**动态检测**挂载点并**切换**路径上下文。挂载点就像一扇"传送门"，当路径遍历经过它时，会被无缝传送到另一个文件系统的根目录。

### 3 往回走：从远程根回到父级

当处于远程目录执行 `cd ..` 时，需要回到上级目录。对于远程文件系统的根目录，其 `d_parent` 指向自身，无法直接回溯。

这时 `struct mount` 的层级关系发挥作用。当前路径的 `path` 结构包含了 `vfsmount` 信息，通过 `vfsmount` 可以找到对应的 `struct mount`，进而找到：
- `mnt_parent`：父挂载点所在的 mount 结构
- `mnt_mountpoint`：挂载点 dentry

这样就能获得上一级的 `vfsmount` 和 dentry，实现从远程根回到本地目录的跳转。

## 八、根文件系统的特殊之处

常规的文件系统挂载包含两个步骤：
1. **加载**：将文件系统加载到内核（`vfs_kern_mount`），创建 `struct mount`、`super_block`、根 dentry
2. **挂接**：将加载的文件系统挂接到目录树中（`do_add_mount`）

但内核最初始的根文件系统（rootfs）是**例外**。由于它没有地方可以挂接，所以只执行了上述两步中的**第一步**。

`init_mount_tree` 函数在系统启动早期创建根文件系统：

```c
static void __init init_mount_tree(void)
{
    type = get_fs_type("rootfs");
    mnt = vfs_kern_mount(type, 0, "rootfs", NULL);
    // 直接设置根目录，不经过 do_add_mount
    // 设置 current->fs->root 和 current->fs->pwd 指向这个 vfsmount
}
```

根文件系统的 `vfsmount` 直接赋值给当前进程的根目录和当前工作目录，而不是通过 `do_add_mount` 挂接到某个父目录下。

## 九、总结

Linux VFS 的挂载机制通过以下设计实现了文件系统的灵活接入与统一管理：
1. **文件系统注册**：通过 `register_filesystem` 将 `file_system_type` 加入全局链表，支持内核模块动态加载
2. **超级块管理**：通过 `sget` 实现超级块的查找与复用，避免同一文件系统被重复挂载
3. **挂载实例**：`vfsmount` 代表挂载实例，`struct mount` 扩展了挂载树关系，支持嵌套挂载与挂载传播
4. **挂载点跳转**：通过 `mount_hashtable` 和 `follow_managed` 在路径查找中动态切换文件系统上下文
5. **统一接口**：每个文件系统只需实现 `file_system_type` 中的 `.mount` 方法，VFS 层负责调用并管理结果

整个挂载流程体现了 VFS 作为**中间层**的核心设计思想：定义统一的接口规范，让不同文件系统（ext4、xfs、tmpfs、NFS 等）只需实现相应接口并注册给 VFS，用户就能通过统一的系统调用访问不同类型的文件系统，对上层应用完全透明。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [Linux文件系统挂载流程分析（do_mount、do_new_mount详解）](https://blog.csdn.net/jinking01/article/details/104813672)
<strong style="color: #db8ef7;">[2]</strong> [Linux内核mount系统调用源码分析（SYSCALL_DEFINE5）](https://blog.csdn.net/farsight_2098/article/details/152805361)
<strong style="color: #db8ef7;">[3]</strong> [Linux VFS挂载与路径查找深入解析](https://zhuanlan.zhihu.com/p/1950928864596427110)
<strong style="color: #db8ef7;">[4]</strong> [linux内核mount过程超复杂的do_mount()、do_loopback()、attach_recursive_mnt()函数详解](https://blog.csdn.net/hu1610552336/article/details/109560411)
<strong style="color: #db8ef7;">[5]</strong> [Linux内核源码 - fs/namespace.c (挂载命名空间与系统调用实现)](https://elixir.bootlin.com/linux/latest/source/fs/namespace.c)