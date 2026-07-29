---
title: 【Linux 内核】VFS 基础：writeback
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
abbrlink: c615e5d3
keywords: ''
description: ''
top_img: ''
cover: ''
date: 2026-07-29 15:36:34
updated: 2026-07-29 15:41:09
---

{% note pink 'far fa-lightbulb' modern %}
阅读本文前，请先学习[《【存储初识】05-内核文件系统》]({% post_path 【存储初识】05-内核文件系统 %})。
{% endnote %}

## 一、从缓冲写入到数据回写

在前面的文章<a href="{% post_path '【Linux 内核】VFS 基础：write' %}">《【Linux 内核】VFS 基础：write》</a>中，详细分析了带页缓存（Page Cache）的缓冲写入（Buffered Write）流程。缓冲写入的核心机制是：数据从用户空间拷贝到页缓存后，`write` 系统调用就返回了，完全不需要等待数据完全写入存储设备。这种设计大幅提升了写入性能，但同时也引入了一个关键问题：**脏页（Dirty Page）必须被写回磁盘，否则数据将面临丢失的风险**。

脏页是指那些已经被修改但尚未写回存储设备的内存页面。将脏页写回磁盘的机制就是 **writeback**（回写）。writeback 机制是 Linux 内核 I/O 子系统中至关重要的一环，它负责在合适的时机将内存中修改过的数据同步到持久化存储设备上。

writeback 机制需要回答三个核心问题：
1. **何时回写**：什么时机触发脏页的回写操作？
2. **回写哪些**：如何识别和管理需要回写的脏页和 inode？
3. **如何回写**：脏页通过怎样的路径最终写入磁盘？

## 二、writeback 的核心数据结构

### 1 backing_dev_info：备用存储设备描述符

writeback 机制的管理基础是 **BDI**（Backing Device Info），即备用存储设备信息。BDI 描述了一个持久化存储设备（如硬盘、SSD），内核为每个存储设备创建一个 `backing_dev_info` 结构体。

```c
struct backing_dev_info {
    struct list_head bdi_list;
    /* ... */
    /* writeback 对象，承载具体的 writeback 工作进程和要处理的 inode */
    struct bdi_writeback wb;          /* 默认的 writeback 信息 */
    spinlock_t wb_lock;               /* 保护 work_list 和 wb.dwork 调度 */
    struct list_head work_list;       /* 待处理的 writeback 工作链表 */
    /* ... */
};
```

`bdi_list` 将所有 BDI 设备链接成一个全局链表，方便内核遍历和管理所有存储设备的回写任务。

### 2 bdi_writeback：writeback 工作单元

每个 BDI 设备都包含一个 `bdi_writeback` 结构（`bdi->wb`），这是 writeback 机制的核心工作单元。`bdi_writeback` 包含了执行回写所需的所有状态信息。

### 3 wb_writeback_work：回写任务描述

每个需要执行的回写操作都被封装成一个 `wb_writeback_work` 结构：

```c
struct wb_writeback_work {
    long nr_pages;                    /* 要回写的页数 */
    struct super_block *sb;           /* 所属超级块 */
    enum writeback_sync_modes sync_mode;  /* 同步模式 */
    unsigned int for_kupdate:1;       /* 是否由定期更新触发 */
    unsigned int range_cyclic:1;      /* 是否循环扫描 */
    unsigned int for_background:1;    /* 是否为后台回写 */
    unsigned int for_sync:1;          /* 是否为 sync(2) 调用 */
    enum wb_reason reason;            /* 回写发起的原因 */
    struct list_head list;            /* 挂接到 work_list 链表 */
    struct wb_completion *done;       /* 调用者等待的完成标志 */
};
```

这些 work 被挂载到 `backing_dev_info` 的 `work_list` 链表上。

### 4 inode 的脏状态管理

每个 inode 使用 `i_state` 字段记录其脏状态：

```c
#define I_DIRTY_SYNC      (1 << 0)  /* 元数据脏（同步） */
#define I_DIRTY_DATASYNC  (1 << 1)  /* 数据脏（数据同步） */
#define I_DIRTY_PAGES     (1 << 2)  /* 页缓存脏 */
```

`I_DIRTY_PAGES` 是最常见的情况——当通过 `write` 系统调用写入数据后，页缓存被标记为脏，进而触发 inode 的脏标记。

### 5 inode 的 writeback 队列

每个 `bdi_writeback` 维护了多个 inode 链表来管理脏 inode：
- **b_dirty**：脏 inode 链表，存放所有需要回写的 inode
- **b_io**：当前正在处理的 inode 链表
- **b_more_io**：需要更多回写的 inode 链表

当 inode 被标记为脏时，它会被加入到 `b_dirty` 链表中。回写时，内核将 inode 从 `b_dirty` 转移到 `b_io` 队列进行处理。

## 三、脏页标记：writeback 的起点

### 1 脏页的形成路径

不管应用程序以什么方式将数据变脏，最终都会调用 `__mark_inode_dirty` 将 inode 标记为脏。主要有以下几种情况：

**I_DIRTY_PAGES（最常见）**：通过 `write` 系统调用写文件，最后写入 page cache 后形成脏页。调用链为：

```text
write -> generic_write_end -> mark_inode_dirty -> __mark_inode_dirty
```

**I_DIRTY_SYNC**：更新文件的访问时间（atime）、修改时间（mtime）和状态变更时间（ctime）时触发。

```text
update_time -> mark_inode_dirty_sync -> __mark_inode_dirty
```

### 2 __mark_inode_dirty：标记 inode 脏的核心函数

`__mark_inode_dirty` 是 writeback 机制的入口函数，它完成以下核心工作：
1. **将脏 inode 挂载到 BDI 设备的 b_dirty 队列上**
2. **判断该 inode 是否是该 BDI 第一个脏 inode，决定是否需要唤醒 writeback 进程**

```c
void __mark_inode_dirty(struct inode *inode, int flags)
{
    /* ... */
    if (flags & (I_DIRTY_SYNC | I_DIRTY_DATASYNC)) {
        /* 对 I_DIRTY_SYNC、I_DIRTY_DATASYNC 的情况，向日志模块提交事务 */
    }
    /* 把脏 inode 挂到 BDI 设备的 b_dirty 队列上 */
    if (!(inode->i_state & I_DIRTY)) {
        /* 第一个脏标记 */
        list_move(&inode->i_wb_list, &wb->b_dirty);
    }
    /* 判断是否需要唤醒 writeback 进程 */
    if (!wb_has_dirty_io(wb)) {
        wb_wakeup_delayed(wb);  /* 启动定时器触发回写 */
    }
    /* ... */
}
```

### 3 启动回写定时器

当 inode 被标记为脏后，`wb_wakeup_delayed` 会启动一个延迟工作队列（delayed work）：

```c
/* 启动定时器触发 delayed_work_timer_fn 函数 */
wb_wakeup_delayed(wb);
```

这个定时器会在 `dirty_writeback_centisecs` 指定的时间间隔后触发回写操作。默认值为 5 秒（500 厘秒）：

```c
int dirty_writeback_centisecs = 5 * 100;  /* 默认 5 秒 */
```

## 四、writeback 的触发时机

脏页回写主要通过**周期性回写**、**内存压力触发**和**主动回写**三种方式触发。

### 1 周期性回写（Periodic Writeback）

内核会定期唤醒 writeback 线程，扫描并回写那些已经存在超过一定时间的脏页。相关的内核参数：
- **dirty_writeback_centisecs**：周期性回写的间隔，默认 500 厘秒（5 秒）
- **dirty_expire_centisecs**：脏页的最长存活时间，默认 3000 厘秒（30 秒）

当脏页的存活时间超过 `dirty_expire_centisecs` 时，它们会成为周期性回写的优先目标。

### 2 内存压力触发（Memory Pressure）

当系统内存不足时，内核需要回收内存页。脏页因为内容未同步到磁盘而不能直接被回收，必须先写回磁盘。

`balance_dirty_pages` 函数负责在内存压力下控制脏页的数量。当脏页数量超过阈值时，写入进程会被阻塞，直到脏页被写回。

### 3 主动回写（Explicit Sync）

用户程序可以主动调用 `sync()`、`fsync()` 或 `fdatasync()` 系统调用，强制将数据写回磁盘。

## 五、writeback 的核心执行流程

### 1 工作队列处理：wb_workfn

当定时器触发或显式调用时，writeback 工作通过工作队列（workqueue）执行。在 3.10 内核及之后，writeback 由 workqueue 进行实际的回写工作。原先由一个 `pdflush` 进程统管所有磁盘的脏页回写，在磁盘数量多时容易出现 I/O 瓶颈，采用 workqueue 后相当于升级为多线程，提高了 I/O 吞吐量。

`wb_workfn` 是工作队列的处理函数：

```c
void wb_workfn(struct work_struct *work)
{
    struct bdi_writeback *wb = container_of(work, ...);
    wb_do_writeback(wb);   /* 执行实际的回写 */
}
```

### 2 wb_do_writeback：调度回写

`wb_do_writeback` 负责调度和执行回写任务：
1. 从 `work_list` 中取出待处理的 `wb_writeback_work`
2. 调用 `writeback_inodes_wb` 处理脏 inode
3. 如果没有待处理的工作，检查是否需要执行周期性回写

### 3 writeback_inodes_wb：处理脏 inode

`writeback_inodes_wb` 将 `wb->b_dirty` 上的 inode 转移到 `wb->b_io` 队列：

```c
void writeback_inodes_wb(struct bdi_writeback *wb, struct writeback_control *wbc)
{
    /* 将 inode 从 b_dirty 转移到 b_io */
    queue_io(wb, wbc);
    /* 对 b_io 中的 inode 执行回写 */
    __writeback_inodes_wb(wb, wbc);
}
```

`queue_io` 函数会扫描 `b_dirty` 链表，将需要回写的 inode 移动到 `b_io` 链表。

### 4 writeback_sb_inodes：按超级块回写

`__writeback_inodes_wb` 会调用 `writeback_sb_inodes`，对属于同一个超级块（superblock）的 inode 进行批量回写：

```c
static void writeback_sb_inodes(struct super_block *sb, struct bdi_writeback *wb,
                                struct writeback_control *wbc)
{
    /* 遍历 b_io 链表中的 inode */
    while (!list_empty(&wb->b_io)) {
        struct inode *inode = list_entry(...);
        /* 对每个 inode 执行回写 */
        __writeback_single_inode(inode, wbc);
    }
}
```

### 5 __writeback_single_inode：回写单个 inode

`__writeback_single_inode` 负责回写单个 inode 的脏页：

```c
static int __writeback_single_inode(struct inode *inode,
                                    struct writeback_control *wbc)
{
    /* 回写 inode 的脏页 */
    do_writepages(mapping, wbc);
    /* 如果所有脏页都已写回，清除 I_DIRTY_PAGES 标志 */
    if (!mapping_tagged(mapping, PAGECACHE_TAG_DIRTY))
        inode->i_state &= ~I_DIRTY_PAGES;
    /* ... */
}
```

### 6 do_writepages：实际页回写

`do_writepages` 是真正执行页回写的函数：

```c
int do_writepages(struct address_space *mapping, struct writeback_control *wbc)
{
    if (mapping->a_ops->writepages)
        return mapping->a_ops->writepages(mapping, wbc);
    return generic_writepages(mapping, wbc);
}
```

对于大多数文件系统，最终会调用 `mapping->a_ops->writepages` 方法，将脏页转换为 BIO 请求提交给块设备层。

## 六、完整的 writeback 调用链

```text
应用程序写数据
    ↓
write 系统调用
    ↓
generic_perform_write()                        [mm/filemap.c]
    ├── 数据拷贝到页缓存
    └── write_end()
        └── mark_inode_dirty()                             // 标记 inode 脏
            └── __mark_inode_dirty()                   [fs/fs-writeback.c]
                ├── list_move(..., &wb->b_dirty)    // 加入脏 inode 链表
                └── wb_wakeup_delayed()            // 启动定时器
                    ↓ (dirty_writeback_centisecs 后)
wb_workfn()                                     [fs/fs-writeback.c]
    ↓
wb_do_writeback()                            [fs/fs-writeback.c]
    ├── 从 work_list 取出 wb_writeback_work
    └── writeback_inodes_wb()                      [fs/fs-writeback.c]
        ├── queue_io()                                // b_dirty → b_io
        └── __writeback_inodes_wb()
            └── writeback_sb_inodes()          // 按超级块处理
                └── __writeback_single_inode()
                    └── do_writepages()
                        └── mapping->a_ops->writepages()
                            ↓
                        创建 BIO，提交到块设备层
                            ↓
                        I/O 调度器 → 设备驱动 → 磁盘
```

## 七、writeback 的可调参数

Linux 提供了多个 `/proc/sys/vm/` 下的参数来调整 writeback 行为：

| 参数                          | 默认值       | 说明             |
| --------------------------- | --------- | -------------- |
| `dirty_writeback_centisecs` | 500（5秒）   | 周期性回写间隔        |
| `dirty_expire_centisecs`    | 3000（30秒） | 脏页过期时间         |
| `dirty_background_ratio`    | 10        | 后台回写阈值（占内存百分比） |
| `dirty_ratio`               | 20        | 阻塞写入阈值（占内存百分比） |
| `dirty_background_bytes`    | 0         | 后台回写阈值（字节）     |
| `dirty_bytes`               | 0         | 阻塞写入阈值（字节）     |

当脏页数量超过 `dirty_background_ratio` 时，内核会在后台开始回写；超过 `dirty_ratio` 时，写入进程会被阻塞。

## 八、总结

Linux 内核的 writeback 机制通过以下设计实现了高效、可靠的脏页回写：
1. **BDI 架构**：通过 `backing_dev_info` 和 `bdi_writeback` 为每个存储设备独立管理回写任务
2. **脏页标记**：通过 `__mark_inode_dirty` 统一标记脏 inode，将其加入 `b_dirty` 链表并启动定时器
3. **多级队列管理**：`b_dirty` → `b_io` → `b_more_io` 三级队列高效管理脏 inode
4. **灵活触发机制**：支持周期性回写、内存压力触发和主动同步三种触发方式
5. **工作队列执行**：使用 workqueue 替代传统 pdflush，支持多线程并发回写
6. **可调参数**：提供丰富的 `/proc/sys/vm/` 参数，允许系统管理员根据负载调整回写策略

writeback 机制在数据安全性和系统性能之间取得了平衡：既保证了数据最终会持久化到磁盘，又通过延迟回写最大化了写入性能。

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [linux buffer的回写的触发链路](https://blog.csdn.net/qq_37517281/article/details/135148662)
<strong style="color: #db8ef7;">[2]</strong> [BDI writeback脏页回写](https://blog.csdn.net/u010039418/article/details/105718320)
<strong style="color: #db8ef7;">[3]</strong> [vm内核参数之内存脏页dirty_writeback_centisecs和dirty_expire_centisecs](https://blog.csdn.net/u010039418/article/details/107500892)
<strong style="color: #db8ef7;">[4]</strong> [Linux内核源码 - fs/fs-writeback.c](https://elixir.bootlin.com/linux/latest/source/fs/fs-writeback.c)
<strong style="color: #db8ef7;">[5]</strong> [Linux内核源码 - mm/page-writeback.c](https://elixir.bootlin.com/linux/latest/source/mm/page-writeback.c)
<strong style="color: #db8ef7;">[6]</strong> [Linux 页缓存（Page Cache）与回写（Writeback）机制详解](https://www.cnblogs.com/jzssuanfa/p/19212741)