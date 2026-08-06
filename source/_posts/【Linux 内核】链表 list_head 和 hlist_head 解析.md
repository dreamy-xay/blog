---
title: 【Linux 内核】链表 list_head 和 hlist_head 解析
tags:
  - 数据结构
  - C
  - 源码分析
categories:
  - Linux 内核
comments: true
toc: true
toc_number: false
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 630be539
keywords: ''
description: ''
top_img: ''
cover: ''
date: 2026-08-05 10:31:14
updated: 2026-08-05 10:32:34
---
## 一、引言

在 Linux 内核的源码中，链表是最基础、最核心的数据结构之一。无论是进程管理、文件系统、网络协议栈还是设备驱动，几乎每一个子系统都离不开链表。内核开发者实现了一套独特的“侵入式”链表，理解这套链表及其操作宏，是深入内核编程的第一步。

所谓“侵入式”链表，指的是链表节点（`list_head` 或 `hlist_node`）不是独立存在的容器，而是直接嵌入到需要被链接的结构体内部。这样，一个结构体可以同时存在于多个不同的链表中，而不需要为每个链表单独分配内存。这种设计高效且灵活，但代价是开发者需要借助一系列精巧的宏来实现类型安全的遍历和访问。

## 二、struct list_head 双向循环链表

### 1 结构体定义与初始化

#### 1.1 结构体定义

`struct list_head` 定义在 `include/linux/types.h` 中，其结构极其简单：

```c
struct list_head {
    struct list_head *next, *prev;
};
```

它只包含两个指针，分别指向链表中的下一个节点和前一个节点。这个结构体本身不包含任何用户数据，它只是一个“钩子”，需要被嵌入到用户自定义的结构体中。例如：

```c
struct my_data {
    int id;
    char name[20];
    struct list_head list;   // 链表节点
};
```

这里的 `list` 成员就是将来链接其他 `my_data` 结构体的媒介。当多个 `my_data` 对象通过各自的 `list` 成员串联起来时，它们就形成了一个双向链表。

#### 1.2 初始化方法

一个链表必须先被初始化，使其 `prev` 和 `next` 都指向自身，表示这是一个空链表。内核提供了两种初始化方式：

**静态初始化**：在定义链表头时使用宏 `LIST_HEAD`。

```c
LIST_HEAD(my_list);
```

这个宏展开后等价于：

```c
struct list_head my_list = { &my_list, &my_list };
```

**动态初始化**：在运行时调用 `INIT_LIST_HEAD` 函数。

```c
struct list_head my_list;
INIT_LIST_HEAD(&my_list);
```

`INIT_LIST_HEAD` 的实现如下：

```c
static inline void INIT_LIST_HEAD(struct list_head *list)
{
    list->next = list;
    list->prev = list;
}
```

无论是哪种方式，初始化后的链表头都是一个“哨兵”节点，它不包含任何用户数据，仅作为遍历的起点和结束标志。

### 2 核心操作宏

对链表的操作主要包括添加、删除、移动、判空等。这些操作均定义在 `include/linux/list.h` 中，大多数是以内联函数或宏的形式给出。

#### 2.1 添加节点

向链表头部添加节点使用 `list_add`：

```c
static inline void list_add(struct list_head *new, struct list_head *head)
{
    __list_add(new, head, head->next);
}
```

其中 `__list_add` 是实际执行插入的底层函数：

```c
static inline void __list_add(struct list_head *new,
                              struct list_head *prev,
                              struct list_head *next)
{
    next->prev = new;
    new->next = next;
    new->prev = prev;
    prev->next = new;
}
```

它的作用是在 `prev` 和 `next` 两个节点之间插入 `new`。在 `list_add` 中，`prev` 是 `head`，`next` 是 `head->next`，因此新节点被插入到链表头之后，即成为第一个实际节点。

向链表尾部添加节点使用 `list_add_tail`：

```c
static inline void list_add_tail(struct list_head *new, struct list_head *head)
{
    __list_add(new, head->prev, head);
}
```

这里 `prev` 是 `head->prev`（即原来的尾节点），`next` 是 `head`，所以新节点被插入到原尾节点和头节点之间，成为新的尾节点。

#### 2.2 删除节点

删除一个节点使用 `list_del`：

```c
static inline void list_del(struct list_head *entry)
{
    __list_del(entry->prev, entry->next);
    entry->next = LIST_POISON1;
    entry->prev = LIST_POISON2;
}
```

`__list_del` 将 `entry` 的前后节点互相连接：

```c
static inline void __list_del(struct list_head *prev, struct list_head *next)
{
    next->prev = prev;
    prev->next = next;
}
```

删除之后，`entry` 的 `prev` 和 `next` 被赋值为 `LIST_POISON1` 和 `LIST_POISON2`，这两个特殊值用于调试，目的是让使用已删除节点指针的操作尽早触发页错误，从而暴露 bug。如果希望删除后重新初始化节点（使其变为空链表状态），可以使用 `list_del_init`：

```c
static inline void list_del_init(struct list_head *entry)
{
    __list_del(entry->prev, entry->next);
    INIT_LIST_HEAD(entry);
}
```

#### 2.3 判断链表是否为空

```c
static inline int list_empty(const struct list_head *head)
{
    return head->next == head;
}
```

因为双向循环链表在空状态时，头节点的 `next` 指向自己，所以只需比较 `head->next` 是否等于 `head` 即可。

#### 2.4 其他操作

- `list_move`：将节点从原链表移到另一个链表的头部。
- `list_move_tail`：移到另一个链表的尾部。
- `list_replace`：用新节点替换旧节点。
- `list_splice`：将两个链表拼接在一起。

这些操作都是基于 `__list_add` 和 `__list_del` 组合而成，理解基础插入和删除后，其它操作一看便知。

### 3 遍历宏

遍历链表是所有操作中最频繁的。内核提供了多个遍历宏，它们分别在安全性、类型安全性和遍历方向上有所不同。

#### 3.1 基础遍历：list_for_each

```c
#define list_for_each(pos, head) \
    for (pos = (head)->next; pos != (head); pos = pos->next)
```

这个宏只适用于遍历过程中不删除节点的场景。`pos` 是一个 `struct list_head *` 类型的指针，它依次指向链表中的每个节点（不包括头节点）。循环终止条件是 `pos` 再次等于 `head`，因为这是一个循环链表。

#### 3.2 安全删除遍历：list_for_each_safe

```c
#define list_for_each_safe(pos, n, head) \
    for (pos = (head)->next, n = pos->next; pos != (head); pos = n, n = pos->next)
```

在遍历过程中，如果删除了 `pos` 指向的节点，那么 `pos->next` 将变得无效，导致无法继续向后遍历。`list_for_each_safe` 通过一个临时指针 `n` 预先保存 `pos->next`，这样即使 `pos` 被删除，`n` 仍然指向下一个有效节点。每次迭代结束时，将 `pos` 赋值为 `n`，并重新获取 `n` 为新的 `pos->next`。

#### 3.3 类型安全遍历：list_for_each_entry

前两个宏操作的是 `list_head` 指针，但实际开发中往往需要的是包含该 `list_head` 的宿主结构体指针。`list_for_each_entry` 直接提供宿主结构体指针，避免了手动调用 `list_entry`。

```c
#define list_for_each_entry(pos, head, member)                \
    for (pos = list_first_entry(head, typeof(*pos), member); \
         &pos->member != (head);                             \
         pos = list_next_entry(pos, member))
```

其中 `list_first_entry` 和 `list_next_entry` 是两个辅助宏，将在下文专门分析。这个宏的 `pos` 是宿主结构体的指针类型，`member` 是 `list_head` 在宿主结构体中的成员名。遍历过程中，`pos` 依次指向每个宿主结构体，直到回到头节点。

#### 3.4 安全且类型安全遍历：list_for_each_entry_safe

```c
#define list_for_each_entry_safe(pos, n, head, member)            \
    for (pos = list_first_entry(head, typeof(*pos), member),     \
         n = list_next_entry(pos, member);                       \
         &pos->member != (head);                                 \
         pos = n, n = list_next_entry(n, member))
```

这个宏结合了安全删除和类型安全，是实际内核代码中最常用的遍历宏之一。它额外需要一个临时指针 `n` 来保存下一个宿主结构体的指针，以便在删除 `pos` 后仍能继续。

#### 3.5 反向遍历

内核也提供了反向遍历的宏，如 `list_for_each_entry_reverse` 和 `list_for_each_entry_safe_reverse`，它们的实现原理完全相同，只是从 `head->prev` 开始，并沿 `prev` 方向移动。

### 4 辅助宏：list_entry、list_first_entry 与 list_next_entry

#### 4.1 list_entry：从成员指针到结构体指针

`list_entry` 是内核链表最核心的辅助宏，它通过一个 `list_head` 成员的指针，计算出其所属的整个结构体的起始地址。其定义如下：

```c
#define list_entry(ptr, type, member) \
    container_of(ptr, type, member)
```

而 `container_of` 定义如下：

```c
#define container_of(ptr, type, member) ({                \
    const typeof( ((type *)0)->member ) *__mptr = (ptr);  \
    (type *)( (char *)__mptr - offsetof(type, member) );  \
})
```

它利用 `offsetof` 计算出 `member` 在 `type` 结构体中的偏移量，然后用 `ptr` 的实际地址减去该偏移量，得到结构体的起始地址。这个过程完全是编译期的指针运算，不涉及运行时开销。

#### 4.2 list_first_entry：获取第一个节点

```c
#define list_first_entry(head, type, member) \
    list_entry((head)->next, type, member)
```

它直接从链表头的 `next` 指针获取第一个节点的 `list_head` 地址，然后调用 `list_entry` 得到宿主结构体指针。注意，它不检查链表是否为空，因此调用前应使用 `list_empty` 判断。

#### 4.3 list_next_entry：获取下一个节点

```c
#define list_next_entry(pos, member) \
    list_entry((pos)->member.next, typeof(*(pos)), member)
```

`pos` 是当前宿主结构体指针，`(pos)->member.next` 是下一个节点的 `list_head` 地址，然后通过 `list_entry` 计算出下一个节点的宿主结构体指针。这里巧妙使用了 `typeof(*(pos))` 自动推导类型，省去了显式传入 `type` 参数。

### 5 源码分析示例：list_for_each_entry 的完整展开

为了更深刻地理解这些宏的工作过程，假设有这样一个结构体：

```c
struct student {
    int id;
    char name[20];
    struct list_head list;
};
```

并已经有一个初始化好的链表头 `head`，以及一个遍历变量 `pos`，类型为 `struct student *`。那么以下遍历代码：

```c
list_for_each_entry(pos, &head, list) {
    // 处理 pos
}
```

在预处理后将展开为：

```c
for (pos = list_first_entry(&head, typeof(*pos), list);
     &pos->list != (&head);
     pos = list_next_entry(pos, list))
{
    // 处理 pos
}
```

进一步展开 `list_first_entry`：

```c
pos = list_entry((&head)->next, typeof(*pos), list)
    = container_of((&head)->next, typeof(*pos), list)
```

而 `(&head)->next` 指向第一个节点的 `list` 成员地址，`container_of` 计算出第一个 `student` 结构体的起始地址，赋给 `pos`。

循环条件 `&pos->list != (&head)` 检查当前节点的 `list` 成员地址是否回到了链表头，若是则遍历结束。

迭代部分 `pos = list_next_entry(pos, list)` 展开为：

```c
pos = list_entry(pos->list.next, typeof(*pos), list)
```

`pos->list.next` 指向下一个节点的 `list` 成员地址，再次通过 `container_of` 得到下一个 `student` 结构体指针。

## 三、struct hlist_head 哈希链表

### 1 为什么需要 hlist

`struct list_head` 双向循环链表虽然通用，但在哈希表场景中有一个缺点：每个哈希桶（bucket）只需要一个指向链表头部的指针，而 `list_head` 包含两个指针（`prev` 和 `next`），对于拥有大量空桶的哈希表来说，这会浪费不少内存。更重要的是，哈希表通常只需要单向遍历，不需要反向遍历，因此 `prev` 指针并非必须。

为了节省空间并提高缓存利用率，内核引入了 `struct hlist_head` 和 `struct hlist_node`。`hlist_head` 只包含一个指向第一个节点的指针，而 `hlist_node` 包含 `next` 和 `pprev`（指向上一节点的 next 指针的指针）。这样的设计使得哈希表头部的大小减半，同时依然支持高效的插入和删除。

### 2 结构体定义与初始化

`struct hlist_head` 和 `struct hlist_node` 定义在 `include/linux/types.h` 中：

```c
struct hlist_head {
    struct hlist_node *first;
};

struct hlist_node {
    struct hlist_node *next, **pprev;
};
```

`hlist_head` 只含一个 `first` 指针，指向链表的第一个节点。`hlist_node` 的 `next` 指向下一个节点，`pprev` 是一个二级指针，它指向“上一个节点的 next 指针”的地址。这种设计使得在删除节点时，不需要遍历链表就能修改前一个节点的 `next` 指针，从而保持 O(1) 的删除复杂度。

初始化 `hlist_head` 可以使用 `HLIST_HEAD` 宏或 `INIT_HLIST_HEAD` 函数：

```c
#define HLIST_HEAD(name) struct hlist_head name = { .first = NULL }
static inline void INIT_HLIST_HEAD(struct hlist_head *h)
{
    h->first = NULL;
}
```

`hlist_node` 的初始化使用 `INIT_HLIST_NODE`：

```c
static inline void INIT_HLIST_NODE(struct hlist_node *h)
{
    h->next = NULL;
    h->pprev = NULL;
}
```

### 3 操作宏

#### 3.1 添加节点

哈希链表最常用的操作是在头部添加节点，使用 `hlist_add_head`：

```c
static inline void hlist_add_head(struct hlist_node *n, struct hlist_head *h)
{
    struct hlist_node *first = h->first;
    n->next = first;
    if (first)
        first->pprev = &n->next;
    h->first = n;
    n->pprev = &h->first;
}
```

如果链表为空，`first` 为 NULL，则只需将 `h->first` 指向 `n`，并将 `n->pprev` 设为 `&h->first`。如果链表非空，原第一个节点的 `pprev` 需要更新为指向新节点的 `next` 指针。

除了头部插入，还可以在指定节点之前或之后插入：
- `hlist_add_before(struct hlist_node *n, struct hlist_node *next)`：在 `next` 之前插入 `n`。
- `hlist_add_behind(struct hlist_node *n, struct hlist_node *prev)`：在 `prev` 之后插入 `n`。

这些操作的核心都是正确维护 `next` 和 `pprev` 指针。

#### 3.2 删除节点

删除节点使用 `hlist_del`：

```c
static inline void hlist_del(struct hlist_node *n)
{
    struct hlist_node *next = n->next;
    struct hlist_node **pprev = n->pprev;
    *pprev = next;
    if (next)
        next->pprev = pprev;
    n->next = LIST_POISON1;
    n->pprev = LIST_POISON2;
}
```

通过 `pprev` 可以直接修改上一个节点的 `next` 指针，使其指向 `n->next`，然后更新下一个节点的 `pprev`。整个过程 O(1)。同样，也有 `hlist_del_init` 用于删除后重新初始化节点。

#### 3.3 判断是否为空

```c
static inline int hlist_empty(const struct hlist_head *h)
{
    return !h->first;
}
```

### 4 遍历宏

`hlist` 的遍历宏与 `list` 非常相似，但需要注意 `hlist` 不是循环链表，遍历终止条件为 `pos == NULL`。

#### 4.1 基础遍历：hlist_for_each

```c
#define hlist_for_each(pos, head) \
    for (pos = (head)->first; pos; pos = pos->next)
```

`pos` 是 `struct hlist_node *` 类型，从头开始遍历，直到 `pos` 为 NULL。

#### 4.2 安全删除遍历：hlist_for_each_safe

```c
#define hlist_for_each_safe(pos, n, head) \
    for (pos = (head)->first; pos && ({ n = pos->next; 1; }); pos = n)
```

使用临时指针 `n` 保存下一个节点，以便在删除 `pos` 后继续。

#### 4.3 类型安全遍历：hlist_for_each_entry

```c
#define hlist_for_each_entry(pos, head, member)                \
    for (pos = hlist_entry((head)->first, typeof(*(pos)), member); \
         pos;                                                  \
         pos = hlist_entry(pos->member.next, typeof(*(pos)), member))
```

`hlist_entry` 本质上也是 `container_of` 的封装。`pos` 是宿主结构体指针，`member` 是 `hlist_node` 在宿主结构体中的成员名。

#### 4.4 安全且类型安全遍历：hlist_for_each_entry_safe

```c
#define hlist_for_each_entry_safe(pos, n, head, member)          \
    for (pos = hlist_entry_safe((head)->first, typeof(*(pos)), member); \
         pos && ({ n = pos->member.next; 1; });                 \
         pos = hlist_entry_safe(n, typeof(*(pos)), member))
```

这个宏结合了安全删除和类型安全，是哈希表遍历中最常用的。其中 `hlist_entry_safe` 会检查指针是否为 NULL，避免对空指针调用 `container_of`。

### 5 与 list_head 的对比和选择

|     特性     | struct list_head | struct hlist_head |
| :--------: | :--------------: | :---------------: |
|  **头部大小**  | 两个指针（16 字节，64位）  |    一个指针（8 字节）     |
|  **节点大小**  |       两个指针       |    两个指针（但结构不同）    |
|  **循环性**   |       双向循环       |  单向非循环（尾部为 NULL）  |
|  **反向遍历**  |        支持        |        不支持        |
| **删除复杂度**  |       O(1)       |       O(1)        |
|  **典型场景**  |    通用链表、队列、栈     |   哈希表、需要节省内存的场合   |
| **遍历终止条件** |     回到 head      |      遇到 NULL      |

## 四、实战示例

以下示例展示了如何在一个内核模块（或可独立运行的模拟程序）中使用 `list_head` 和 `hlist_head`。由于内核模块需要特定环境，这里使用模拟用户态程序，但宏的定义和用法与内核完全一致（需要包含对应的头文件或手动定义相关宏）。

### 1 list_head 使用示例

假设要管理一个学生链表，每个学生有学号和姓名。

```c
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>

// 模拟内核的 list_head 及基本宏（实际内核中在 list.h 中）
struct list_head
{
    struct list_head *next, *prev;
};

#define LIST_HEAD(name) struct list_head name = {&(name), &(name)}
#define INIT_LIST_HEAD(ptr)                                                                        \
    do                                                                                             \
    {                                                                                              \
        (ptr)->next = (ptr);                                                                       \
        (ptr)->prev = (ptr);                                                                       \
    } while (0)

static inline void __list_add(struct list_head *new, struct list_head *prev, struct list_head *next)
{
    next->prev = new;
    new->next = next;
    new->prev = prev;
    prev->next = new;
}

static inline void list_add(struct list_head *new, struct list_head *head)
{
    __list_add(new, head, head->next);
}

static inline void list_add_tail(struct list_head *new, struct list_head *head)
{
    __list_add(new, head->prev, head);
}

static inline void __list_del(struct list_head *prev, struct list_head *next)
{
    next->prev = prev;
    prev->next = next;
}

static inline void list_del(struct list_head *entry)
{
    __list_del(entry->prev, entry->next);
    entry->next = (void *)0xdead;
    entry->prev = (void *)0xbeef;
}

#define offsetof(TYPE, MEMBER) ((size_t)&((TYPE *)0)->MEMBER)
#define container_of(ptr, type, member)                                                            \
    ({                                                                                             \
        const __typeof__(((type *)0)->member) *__mptr = (ptr);                                     \
        (type *)((char *)__mptr - offsetof(type, member));                                         \
    })
#define list_entry(ptr, type, member) container_of(ptr, type, member)
#define list_first_entry(head, type, member) list_entry((head)->next, type, member)
#define list_next_entry(pos, member) list_entry((pos)->member.next, __typeof__(*(pos)), member)

#define list_for_each_entry(pos, head, member)                                                     \
    for (pos = list_first_entry(head, __typeof__(*pos), member); &pos->member != (head);           \
         pos = list_next_entry(pos, member))

#define list_for_each_entry_safe(pos, n, head, member)                                             \
    for (pos = list_first_entry(head, __typeof__(*pos), member), n = list_next_entry(pos, member); \
         &pos->member != (head); pos = n, n = list_next_entry(n, member))

// 自定义结构体
struct student
{
    int id;
    char name[20];
    struct list_head list;
};

int main(void)
{
    LIST_HEAD(student_list);
    struct student *s1 = malloc(sizeof(*s1));
    struct student *s2 = malloc(sizeof(*s2));
    struct student *s3 = malloc(sizeof(*s3));
    s1->id = 1;
    snprintf(s1->name, 20, "Alice");
    s2->id = 2;
    snprintf(s2->name, 20, "Bob");
    s3->id = 3;
    snprintf(s3->name, 20, "Charlie");

    list_add(&s1->list, &student_list);
    list_add_tail(&s2->list, &student_list);
    list_add_tail(&s3->list, &student_list);

    struct student *pos, *tmp;
    printf("Go through all the students:\n");
    list_for_each_entry(pos, &student_list, list)
    {
        printf("ID: %d, Name: %s\n", pos->id, pos->name);
    }

    // 删除 Bob
    list_for_each_entry_safe(pos, tmp, &student_list, list)
    {
        if (pos->id == 2)
        {
            list_del(&pos->list);
            free(pos);
            break;
        }
    }

    printf("\nAfter deleting Bob:\n");
    list_for_each_entry(pos, &student_list, list)
    {
        printf("ID: %d, Name: %s\n", pos->id, pos->name);
    }

    // 释放剩余节点
    list_for_each_entry_safe(pos, tmp, &student_list, list)
    {
        list_del(&pos->list);
        free(pos);
    }
    return 0;
}
```

### 2 hlist_head 使用示例

下面用 `hlist` 实现一个简单的哈希表，假设哈希桶数为 10，存储一些整数值。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 模拟 hlist 相关定义
struct hlist_head
{
    struct hlist_node *first;
};

struct hlist_node
{
    struct hlist_node *next, **pprev;
};

#define HLIST_HEAD(name) struct hlist_head name = {.first = NULL}
#define INIT_HLIST_HEAD(ptr) ((ptr)->first = NULL)
#define INIT_HLIST_NODE(ptr)                                                                       \
    do                                                                                             \
    {                                                                                              \
        (ptr)->next = NULL;                                                                        \
        (ptr)->pprev = NULL;                                                                       \
    } while (0)

static inline void hlist_add_head(struct hlist_node *n, struct hlist_head *h)
{
    struct hlist_node *first = h->first;
    n->next = first;
    if (first)
        first->pprev = &n->next;
    h->first = n;
    n->pprev = &h->first;
}

static inline void hlist_del(struct hlist_node *n)
{
    struct hlist_node *next = n->next;
    struct hlist_node **pprev = n->pprev;
    *pprev = next;
    if (next)
        next->pprev = pprev;
    n->next = (void *)0xdead;
    n->pprev = (void *)0xbeef;
}

#define offsetof(TYPE, MEMBER) ((size_t)&((TYPE *)0)->MEMBER)
#define container_of(ptr, type, member)                                                            \
    ({                                                                                             \
        const __typeof__(((type *)0)->member) *__mptr = (ptr);                                     \
        (type *)((char *)__mptr - offsetof(type, member));                                         \
    })
#define hlist_entry(ptr, type, member) container_of(ptr, type, member)
#define hlist_entry_safe(ptr, type, member)                                                        \
    ({                                                                                             \
        __typeof__(ptr) __ptr = (ptr);                                                             \
        __ptr ? hlist_entry(__ptr, type, member) : NULL;                                           \
    })

#define hlist_for_each_entry(pos, head, member)                                                    \
    for (pos = hlist_entry_safe((head)->first, __typeof__(*(pos)), member); pos;                   \
         pos = hlist_entry_safe((pos)->member.next, __typeof__(*(pos)), member))

#define hlist_for_each_entry_safe(pos, n, head, member)                                            \
    for (pos = hlist_entry_safe((head)->first, __typeof__(*(pos)), member);                        \
         pos && ({                                                                                 \
             n = pos->member.next;                                                                 \
             1;                                                                                    \
         });                                                                                       \
         pos = hlist_entry_safe(n, __typeof__(*(pos)), member))

// 数据节点
struct data_node
{
    int key;
    int value;
    struct hlist_node node;
};

#define BUCKET_SIZE 10

int main(void)
{
    struct hlist_head hash_table[BUCKET_SIZE];
    for (int i = 0; i < BUCKET_SIZE; i++)
        INIT_HLIST_HEAD(&hash_table[i]);

    // 插入一些数据
    for (int i = 0; i < 20; i++)
    {
        struct data_node *dn = malloc(sizeof(*dn));
        dn->key = i;
        dn->value = i * 10;
        INIT_HLIST_NODE(&dn->node);
        int bucket = i % BUCKET_SIZE;
        hlist_add_head(&dn->node, &hash_table[bucket]);
    }

    // 遍历所有桶
    for (int i = 0; i < BUCKET_SIZE; i++)
    {
        struct data_node *pos;
        printf("Bucket %d: ", i);
        hlist_for_each_entry(pos, &hash_table[i], node)
        {
            printf("(key=%d,val=%d) ", pos->key, pos->value);
        }
        printf("\n");
    }

    // 删除 key 为 5 的节点
    for (int i = 0; i < BUCKET_SIZE; i++)
    {
        struct data_node *pos;
        struct hlist_node *tmp;
        hlist_for_each_entry_safe(pos, tmp, &hash_table[i], node)
        {
            if (pos->key == 5)
            {
                hlist_del(&pos->node);
                free(pos);
                break;
            }
        }
    }

    printf("\nAfter deleting key=5, traverse again:\n");
    for (int i = 0; i < BUCKET_SIZE; i++)
    {
        struct data_node *pos;
        printf("Bucket %d: ", i);
        hlist_for_each_entry(pos, &hash_table[i], node)
        {
            printf("(key=%d,val=%d) ", pos->key, pos->value);
        }
        printf("\n");
    }

    // 释放所有节点（此处略）
    return 0;
}
```

## 五、注意事项

- **必须初始化**：无论是 `list_head` 还是 `hlist_node`，在加入链表前必须初始化，否则指针为随机值会导致崩溃。
- **删除后不要再使用**：`list_del` 和 `hlist_del` 不会释放节点内存，只是将节点从链表中摘除。若节点是动态分配的，需要调用 `free` 或 `kfree` 释放内存，且务必先摘除再释放。
- **遍历时注意安全性**：如果遍历过程中可能删除当前节点，必须使用 `_safe` 版本的宏，否则会破坏链表导致遍历失败。
- **类型安全**：使用 `list_for_each_entry` 等宏时，`member` 参数必须是宿主结构体中 `list_head` 或 `hlist_node` 成员的名称，且 `pos` 必须是宿主结构体的指针类型，不能是 `void *`。
- **不要跨链表操作**：一个 `list_head` 或 `hlist_node` 同一时刻只能存在于一个链表中，除非先将其删除再添加到另一个链表。