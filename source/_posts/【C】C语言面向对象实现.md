---
title: 【C】C语言面向对象实现
tags:
  - 面向对象
  - OOP
categories:
  - C
comments: true
toc: true
toc_number: true
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 7fee99f
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-30 20:48:13
updated: 2026-07-30 20:56:31
---


在纯 C 语言中实现面向对象编程（OOP），本质上是利用**结构体（struct）**、**函数指针**和**指针操作**，手动模拟 C++ 编译器在背后做的事情。由于 C 语言没有语法层面的支持，通常采用以下几种经典模式来实现封装、继承和多态。

##  封装（信息隐藏）

使用**不透明指针（Opaque Pointer / Pimpl 惯用法）**。在头文件中只暴露接口，将具体成员变量隐藏在源文件中，实现“私有属性”。

**Animal.h（头文件，对外接口）**

```c
#ifndef ANIMAL_H
#define ANIMAL_H

#include <stdio.h>

// 不透明声明：外部只知道这是一个结构体，但不知道内部成员
typedef struct Animal Animal;

// 构造函数和析构函数
Animal* animal_create(const char* name);
void animal_destroy(Animal* this);

// 公有方法
void animal_speak(Animal* this);
void animal_set_name(Animal* this, const char* name);
const char* animal_get_name(Animal* this);

#endif
```

**Animal.c（实现文件，私有成员隐藏于此）**

```c
#include "Animal.h"
#include <stdlib.h>
#include <string.h>

// 真正的结构体定义放在 .c 中，外部无法访问
struct Animal {
    char* name;  // 私有成员
    int age;     // 私有成员
};

Animal* animal_create(const char* name) {
    Animal* this = (Animal*)malloc(sizeof(Animal));
    this->name = (char*)malloc(strlen(name) + 1);
    strcpy(this->name, name);
    this->age = 0;
    return this;
}

void animal_destroy(Animal* this) {
    if (this) {
        free(this->name);
        free(this);
    }
}

void animal_speak(Animal* this) {
    printf("Animal %s says: Hello!\n", this->name);
}

void animal_set_name(Animal* this, const char* name) {
    free(this->name);
    this->name = (char*)malloc(strlen(name) + 1);
    strcpy(this->name, name);
}
```

---

##  继承（结构体内存布局复用）

C 语言通过**结构体组合**实现继承。将父类对象放在子类结构体的**第一个成员位置**，这样父类指针和子类指针指向同一内存地址，从而实现“基类可用性”。

```c
#include <stdio.h>
#include <stdlib.h>

// 基类 (父类)
typedef struct {
    char* name;
    int age;
} AnimalBase;

void animal_base_speak(AnimalBase* this) {
    printf("Animal speaks.\n");
}

// 派生类 (子类) - 第一个成员必须是父类
typedef struct {
    AnimalBase base;   // 继承 AnimalBase
    char* breed;       // 子类自有属性
} Dog;

// 子类构造函数
Dog* dog_create(const char* name, const char* breed) {
    Dog* this = (Dog*)malloc(sizeof(Dog));
    this->base.name = (char*)malloc(20);
    strcpy(this->base.name, name);
    this->base.age = 0;
    this->breed = (char*)malloc(20);
    strcpy(this->breed, breed);
    return this;
}

// 子类特有方法
void dog_bark(Dog* this) {
    printf("Dog %s (breed: %s) barks: Woof!\n", this->base.name, this->breed);
}

// 测试继承：将 Dog* 强制转为 AnimalBase* 完全合法
int main() {
    Dog* d = dog_create("Buddy", "Golden");
    AnimalBase* animal_ptr = (AnimalBase*)d; // 向上转型，安全！
    animal_base_speak(animal_ptr);           // 调用父类方法
    dog_bark(d);
    return 0;
}
```

---

## 多态（虚函数表 VTable）

利用**结构体嵌套函数指针**模拟 C++ 的虚表。基类指针在运行时根据对象实际类型调用不同的函数。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 1. 定义虚表结构 (存放所有虚函数指针)
typedef struct {
    void (*speak)(void* this);
    void (*destroy)(void* this);
} AnimalVTable;

// 2. 定义基类 (包含指向虚表的指针)
typedef struct {
    AnimalVTable* vptr;  // 虚表指针，必须放在第一位
    char* name;
} Animal;

// 基类虚函数实现
void animal_speak_impl(void* this) {
    Animal* a = (Animal*)this;
    printf("Animal %s speaks.\n", a->name);
}
void animal_destroy_impl(void* this) { free(((Animal*)this)->name); free(this); }

// 基类虚表 (全局静态常量)
static AnimalVTable g_animal_vtable = { animal_speak_impl, animal_destroy_impl };

// 基类构造函数
Animal* animal_new(const char* name) {
    Animal* this = (Animal*)malloc(sizeof(Animal));
    this->vptr = &g_animal_vtable;
    this->name = strdup(name);
    return this;
}

// --- 派生类 (Dog) ---
typedef struct {
    Animal base;        // 继承 Animal，base.vptr 会被覆盖
    int bark_volume;
} Dog;

// Dog 覆盖 speak 函数
void dog_speak_impl(void* this) {
    Dog* d = (Dog*)this;
    printf("Dog %s barks loudly (volume: %d).\n", d->base.name, d->bark_volume);
}
// 复用基类的 destroy (不覆盖)

static AnimalVTable g_dog_vtable = { 
    dog_speak_impl,     // 覆盖 speak
    animal_destroy_impl // 继承 destroy
};

Dog* dog_new(const char* name, int volume) {
    Dog* this = (Dog*)malloc(sizeof(Dog));
    // 先调用基类构造 (这里简单处理)
    this->base.name = strdup(name);
    // 关键：将 vptr 替换为 Dog 的虚表
    this->base.vptr = &g_dog_vtable; 
    this->bark_volume = volume;
    return this;
}

// --- 多态调用宏/函数 ---
#define SPEAK(obj) ((obj)->vptr->speak(obj))

int main() {
    Animal* a = animal_new("Generic");
    Animal* d = (Animal*)dog_new("Rex", 10); // 向上转型

    SPEAK(a); // 输出: Animal Generic speaks.
    SPEAK(d); // 输出: Dog Rex barks loudly (volume: 10).

    // 释放内存 (多态析构)
    a->vptr->destroy(a);
    d->vptr->destroy(d);
    return 0;
}
```

---

### 4. 高级补充：模板（泛型）模拟

利用 C11 的 `_Generic` 关键字或宏定义实现编译期多态（类似于重载）：

```c
#include <stdio.h>

#define add(x, y) _Generic((x), \
    int: add_int, \
    double: add_double \
)(x, y)

int add_int(int a, int b) { return a + b; }
double add_double(double a, double b) { return a + b; }

int main() {
    printf("%d\n", add(1, 2));       // 调用 add_int
    printf("%f\n", add(1.5, 2.5));   // 调用 add_double
    return 0;
}
```

---

## 总结与工程建议

| 目标 | C 实现方案 | 适用场景 |
| --- | --- | --- |
| **封装** | 头文件放 `struct` 前向声明，`.c` 文件放完整定义 | 大型模块开发，隐藏底层数据结构 |
| **继承** | 父类结构体作为子类的**第一个成员** | 只需要复用代码，不需要动态绑定时 |
| **多态** | 在结构体中放置 `vptr` 虚表指针，手动维护函数指针表 | 需要框架扩展性（如事件驱动、插件系统） |
| **构造/析构** | 定义 `xxx_create` 和 `xxx_destroy` 显式配对调用 | 务必手动管理内存，防止内存泄漏 |

**性能注意**：上述多态模式（VTable）调用比 C++ 虚函数多一层间接寻址，但开销极低。实际开发（如 Linux 内核）大量采用这种模式（如 `struct file_operations`）。

## 附录：数组和向量实例

### 头文件：array.h

```C
#ifndef __ARRAY_H__
#define __ARRAY_H__

#include <stdbool.h>
#include <stddef.h>

#define BUG_ON(cond, msg)                                                                          \
    do                                                                                             \
    {                                                                                              \
        if (cond)                                                                                  \
        {                                                                                          \
            printf("BUG_ON: %s at %s:%d\n", msg, __FILE__, __LINE__);                              \
            exit(1);                                                                               \
        }                                                                                          \
    } while (0)

#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))

// 多态结构体（虚表）
typedef struct virtual_table
{
    void (*print)(void *this);
    void (*destroy)(void *this);
} virtual_table_t;

// 数组基类
typedef struct array
{
    virtual_table_t *vtable;

    size_t size;
} array_t;

// 所有数组的销毁（含子类，多态实现）
#define array_destroy(this) (((array_t *)this)->vtable->destroy(this))
// 所有数组的打印（含子类，多态实现）
#define array_print(this) (((array_t *)this)->vtable->print(this))
// 所有数组的size（含子类）
#define array_size(this) (((array_t *)this)->size)

// 整形数组结构体
typedef struct arrayi arrayi_t; // 封装定义

// 浮点型数组结构体
typedef struct arrayf arrayf_t; // 封装定义

// 强制类型转换（获取数组的真实数据地址）
#define carrayi_cast(this) (*(int **)(((char *)this) + sizeof(array_t)))
#define carrayf_cast(this) (*(float **)(((char *)this) + sizeof(array_t)))

arrayi_t *arrayi_create(size_t size, int init_value);
arrayi_t *arrayi_create_from_array(int *data, size_t size);
arrayf_t *arrayf_create(size_t size, float init_value);
arrayf_t *arrayf_create_from_array(float *data, size_t size);
int *arrayi_at(arrayi_t *this, size_t index);
float *arrayf_at(arrayf_t *this, size_t index);

//* 可变数组：向量
typedef struct vectori vectori_t; // 封装定义

vectori_t *vectori_create(size_t size, int init_value);
vectori_t *vectori_create_from_array(int *data, size_t size);
void vectori_reserve(vectori_t *this, size_t capacity);
void vectori_resize(vectori_t *this, size_t size, int init_value);
void vectori_swap(vectori_t *this, vectori_t *other);
bool vectori_empty(vectori_t *this);
void vectori_push_back(vectori_t *this, int value);
int vectori_pop_back(vectori_t *this);
int *vectori_insert(vectori_t *this, size_t index, int value);
int vectori_erase(vectori_t *this, size_t index);
int *vectori_front(vectori_t *this);
int *vectori_back(vectori_t *this);

#endif
```
### 实现：array.c

```C
#include "array.h"
#include <stdio.h>
#include <stdlib.h>

// 整数数组
struct arrayi
{
    array_t base; // 基类（继承）

    int *data; // 数据
};

// 浮点数组
struct arrayf
{
    array_t base; // 基类（继承）

    float *data; // 数据
};

// 整形可变数组：向量
struct vectori
{
    arrayi_t arri; // 数组基类（二次继承）

    size_t capacity; // 容量
};

/*
 * 整形数组打印虚函数实现
 *
 * @param this 整形数组对象的指针
 * @return void
 */
static void arrayi_print(void *this)
{
    arrayi_t *arr = (arrayi_t *)this;
    printf("[");
    for (size_t i = 0; i < arr->base.size; i++)
    {
        printf("%d", arr->data[i]);
        if (i < arr->base.size - 1)
        {
            printf(", ");
        }
    }
    printf("]\n");
}

/*
 * 浮点数组打印虚函数实现
 *
 * @param this 浮点数组对象的指针
 * @return void
 */
static void arrayf_print(void *this)
{
    arrayf_t *arr = (arrayf_t *)this;
    printf("[");
    for (size_t i = 0; i < arr->base.size; i++)
    {
        printf("%.2f", arr->data[i]);
        if (i < arr->base.size - 1)
        {
            printf(", ");
        }
    }
    printf("]\n");
}

/*
 * 整形数组析构函数虚函数实现
 *
 * @param this 整形数组对象的指针
 * @return void
 */
static void arrayi_destroy(void *this)
{
    arrayi_t *arr = (arrayi_t *)this;

    free(arr->data);
    arr->data = NULL;

    free(arr);
}

/*
 * 浮点数组析构函数虚函数实现
 *
 * @param this 浮点数组对象的指针
 * @return void
 */
static void arrayf_destroy(void *this)
{
    arrayf_t *arr = (arrayf_t *)this;

    free(arr->data);
    arr->data = NULL;

    free(arr);
}

/*
 * 整形数组初始化函数
 *
 * @param this 指向当前对象的指针
 * @param size 数组大小
 * @return void
 */
static void arrayi_init(arrayi_t *this, size_t size)
{
    static virtual_table_t vtable = {
        .print = arrayi_print,
        .destroy = arrayi_destroy,
    };

    this->base.vtable = &vtable;

    this->base.size = size;

    this->data = (int *)malloc(sizeof(int) * size);
}

/*
 * 整形数组创建函数
 *
 * @param size 数组大小
 * @param init_value 初始化值
 * @return 指向新创建的整形数组对象的指针
 */
arrayi_t *arrayi_create(size_t size, int init_value)
{
    arrayi_t *arr = (arrayi_t *)malloc(sizeof(arrayi_t));

    arrayi_init(arr, size);

    for (size_t i = 0; i < size; i++)
    {
        arr->data[i] = init_value;
    }

    return arr;
}

/*
 * 整形数组创建函数
 *
 * @param data 指向数据的指针
 * @param size 数组大小
 * @return 指向新创建的整形数组对象的指针
 */
arrayi_t *arrayi_create_from_array(int *data, size_t size)
{
    arrayi_t *arr = (arrayi_t *)malloc(sizeof(arrayi_t));

    arrayi_init(arr, size);

    for (size_t i = 0; i < size; i++)
    {
        arr->data[i] = data[i];
    }

    return arr;
}

/*
 * 浮点数组初始化函数
 *
 * @param this 指向当前对象的指针
 * @param size 数组大小
 * @return void
 */
static void arrayf_init(arrayf_t *this, size_t size)
{
    static virtual_table_t vtable = {
        .print = arrayf_print,
        .destroy = arrayf_destroy,
    };

    this->base.vtable = &vtable;

    this->base.size = size;

    this->data = (float *)malloc(sizeof(float) * size);
}

/*
 * 浮点数组创建函数
 *
 * @param size 数组大小
 * @param init_value 初始化值
 * @return 指向新创建的浮点数组对象的指针
 */
arrayf_t *arrayf_create(size_t size, float init_value)
{
    arrayf_t *arr = (arrayf_t *)malloc(sizeof(arrayf_t));

    arrayf_init(arr, size);

    for (size_t i = 0; i < size; i++)
    {
        arr->data[i] = init_value;
    }

    return arr;
}

/*
 * 浮点数组创建函数
 *
 * @param data 指向数据的指针
 * @param size 数组大小
 * @return 指向新创建的浮点数组对象的指针
 */
arrayf_t *arrayf_create_from_array(float *data, size_t size)
{
    arrayf_t *arr = (arrayf_t *)malloc(sizeof(arrayf_t));

    arrayf_init(arr, size);

    for (size_t i = 0; i < size; i++)
    {
        arr->data[i] = data[i];
    }

    return arr;
}

/*
 * 整形数组获取元素指针函数
 *
 * @param this 指向当前对象的指针
 * @param index 元素索引
 * @return 指向元素的指针
 */
int *arrayi_at(arrayi_t *this, size_t index)
{
    BUG_ON(index >= this->base.size, "index out of range");

    return &this->data[index];
}

/*
 * 浮点数组获取元素指针函数
 *
 * @param this 指向当前对象的指针
 * @param index 元素索引
 * @return 指向元素的指针
 */
float *arrayf_at(arrayf_t *this, size_t index)
{
    BUG_ON(index >= this->base.size, "index out of range");

    return &this->data[index];
}

/*
 * 整形向量初始化函数
 *
 * @param this 指向当前对象的指针
 * @param size 数组大小
 * @return void
 */
vectori_t *vectori_create(size_t size, int init_value)
{
    vectori_t *arr = (vectori_t *)malloc(sizeof(vectori_t));

    arr->capacity = MAX(size, 2);

    arrayi_init(&arr->arri, arr->capacity);

    arr->arri.base.size = size;

    for (size_t i = 0; i < size; i++)
    {
        arr->arri.data[i] = init_value;
    }

    return arr;
}

/*
 * 整形向量创建函数
 *
 * @param data 指向数据的指针
 * @param size 数组大小
 * @return 指向新创建的整形向量对象的指针
 */
vectori_t *vectori_create_from_array(int *data, size_t size)
{
    vectori_t *arr = (vectori_t *)malloc(sizeof(vectori_t));

    arr->capacity = MAX(size, 2);

    arrayi_init(&arr->arri, arr->capacity);

    arr->arri.base.size = size;

    for (size_t i = 0; i < size; i++)
    {
        arr->arri.data[i] = data[i];
    }

    return arr;
}

/*
 * 整形向量扩容函数
 *
 * @param this 指向当前对象的指针
 * @param capacity 新容量
 * @return void
 */
static void vertori_expand(vectori_t *this, size_t capacity)
{
    static float expand_factor = 1.5;

    while (capacity > this->capacity)
    {
        this->capacity *= expand_factor;
    }

    // expand
    int *new_data = (int *)realloc(this->arri.data, sizeof(int) * this->capacity);

    BUG_ON(new_data == NULL, "realloc failed");

    this->arri.data = new_data;
}

/*
 * 整形向量扩容函数
 *
 * @param this 指向当前对象的指针
 * @param capacity 新容量
 * @return void
 */
void vectori_reserve(vectori_t *this, size_t capacity)
{
    if (capacity <= this->capacity)
    {
        return;
    }

    vertori_expand(this, capacity);
}

/*
 * 整形向量扩容函数
 *
 * @param this 指向当前对象的指针
 * @param size 新大小
 * @param init_value 初始化值
 * @return void
 */
void vectori_resize(vectori_t *this, size_t size, int init_value)
{
    if (size > this->capacity)
    {
        vertori_expand(this, size);
    }

    for (size_t i = this->arri.base.size; i < size; i++)
    {
        this->arri.data[i] = init_value;
    }

    this->arri.base.size = size;
}

/*
 * 整形向量交换函数
 *
 * @param this 指向当前对象的指针
 * @param other 指向另一个对象的指针
 * @return void
 */
void vectori_swap(vectori_t *this, vectori_t *other)
{
    if (this == other)
    {
        return;
    }

    if (this == NULL || other == NULL)
    {
        return;
    }

    vectori_t tmp = *this;
    *this = *other;
    *other = tmp;
}

/*
 * 整形向量清空函数
 *
 * @param this 指向当前对象的指针
 * @return 返回向量是否为空
 */
bool vectori_empty(vectori_t *this)
{
    return this->arri.base.size == 0;
}

/*
 * 整形向量向后追加元素
 *
 * @param this 指向当前对象的指针
 * @param value 追加值
 * @return void
 */
void vectori_push_back(vectori_t *this, int value)
{
    this->arri.base.size++;

    if (this->arri.base.size > this->capacity)
    {
        vertori_expand(this, this->arri.base.size);
    }

    this->arri.data[this->arri.base.size - 1] = value;
}

/*
 * 整形向量删除末尾元素
 *
 * @param this 指向当前对象的指针
 * @return 删除的末尾元素
 */
int vectori_pop_back(vectori_t *this)
{
    BUG_ON(this->arri.base.size == 0, "vector is empty");

    return this->arri.data[--this->arri.base.size];
}

/*
 * 整形向量插入元素
 *
 * @param this 指向当前对象的指针
 * @param index 插入位置
 * @param value 插入值
 * @return 指向插入元素的指针
 */
int *vectori_insert(vectori_t *this, size_t index, int value)
{
    BUG_ON(index > this->arri.base.size, "index out of range");

    if (this->arri.base.size > 0)
    {
        vectori_push_back(this, *vectori_back(this));

        for (size_t i = this->arri.base.size - 2; i > index; i--)
        {
            this->arri.data[i] = this->arri.data[i - 1];
        }

        this->arri.data[index] = value;
    }
    else
    {
        vectori_push_back(this, value);
    }

    return &this->arri.data[index];
}

/*
 * 整形向量删除元素
 *
 * @param this 指向当前对象的指针
 * @param index 删除位置
 * @return 删除的元素
 */
int vectori_erase(vectori_t *this, size_t index)
{
    BUG_ON(index >= this->arri.base.size, "index out of range");

    int value = this->arri.data[index];

    for (size_t i = index; i < this->arri.base.size - 1; i++)
    {
        this->arri.data[i] = this->arri.data[i + 1];
    }

    this->arri.base.size--;

    return value;
}

/*
 * 整形向量获取首元素
 *
 * @param this 指向当前对象的指针
 * @return 指向首元素的指针
 */
int *vectori_front(vectori_t *this)
{
    BUG_ON(this->arri.base.size == 0, "vector is empty");

    return &this->arri.data[0];
}

/*
 * 整形向量获取末尾元素
 *
 * @param this 指向当前对象的指针
 * @return 指向末尾元素的指针
 */
int *vectori_back(vectori_t *this)
{
    BUG_ON(this->arri.base.size == 0, "vector is empty");
    return &this->arri.data[this->arri.base.size - 1];
}
```

### 测试：vectori_test.h

```C
#include "array.h" // 假设接口在此
#include <assert.h>
#include <stdbool.h>
#include <stdio.h>

#ifndef __VECTORI_TEST_H__
#define __VECTORI_TEST_H__

// 辅助：比较向量所有元素是否与预期数组相等
#define ASSERT_VECTOR_EQ(vec, expected_arr, expected_len)                                          \
    do                                                                                             \
    {                                                                                              \
        assert(array_size(vec) == expected_len);                                                   \
        int *arr = carrayi_cast(vec);                                                              \
        for (size_t i = 0; i < expected_len; ++i)                                                  \
        {                                                                                          \
            assert(arr[i] == expected_arr[i]);                                                     \
        }                                                                                          \
    } while (0)

// 辅助：打印测试名称（可选）
#define TEST_START(name) printf("Running test: %s ... ", name)
#define TEST_PASS() printf("PASS\n")

void test_vertori();

#endif
```

### 测试：vectori_test.c

```C
#include "vectori_test.h"

void test_create_default()
{
    TEST_START("create_default");
    vectori_t *v = vectori_create(0, 42);
    assert(v != NULL);
    assert(vectori_empty(v) == true);
    assert(array_size(v) == 0);
    assert(carrayi_cast(v) != NULL); // 即使空向量，指针也应有效
    array_destroy(v);
    TEST_PASS();
}

void test_create_with_size()
{
    TEST_START("create_with_size");
    vectori_t *v = vectori_create(5, 100);
    assert(v != NULL);
    assert(array_size(v) == 5);
    for (size_t i = 0; i < 5; ++i)
    {
        assert(*arrayi_at((arrayi_t *)v, i) == 100);
    }
    array_destroy(v);
    TEST_PASS();
}

void test_create_from_array()
{
    TEST_START("create_from_array");
    int data[] = {10, 20, 30, 40};
    vectori_t *v = vectori_create_from_array(data, 4);
    int expected[] = {10, 20, 30, 40};
    ASSERT_VECTOR_EQ(v, expected, 4);
    array_destroy(v);
    TEST_PASS();
}

void test_create_from_array_empty()
{
    TEST_START("create_from_array_empty");
    // 传入 size=0，data 可为 NULL（取决于实现，但应能正常工作）
    vectori_t *v = vectori_create_from_array(NULL, 0);
    assert(v != NULL);
    assert(array_size(v) == 0);
    assert(vectori_empty(v) == true);
    array_destroy(v);
    TEST_PASS();
}

void test_reserve()
{
    TEST_START("reserve");
    vectori_t *v = vectori_create(0, 0);
    vectori_reserve(v, 100);
    // 容量 ≥100，但大小为 0，可插入更多元素而不频繁重分配
    for (int i = 0; i < 100; ++i)
    {
        vectori_push_back(v, i);
    }
    assert(array_size(v) == 100);
    // 检查元素值
    int *arr = carrayi_cast(v);
    for (size_t i = 0; i < 100; ++i)
    {
        assert(arr[i] == (int)i);
    }
    array_destroy(v);
    TEST_PASS();
}

void test_resize_grow()
{
    TEST_START("resize_grow");
    vectori_t *v = vectori_create(2, 5); // [5,5]
    vectori_resize(v, 5, 7);             // 新增3个7
    int expected[] = {5, 5, 7, 7, 7};
    ASSERT_VECTOR_EQ(v, expected, 5);
    array_destroy(v);
    TEST_PASS();
}

void test_resize_shrink()
{
    TEST_START("resize_shrink");
    int data[] = {1, 2, 3, 4, 5};
    vectori_t *v = vectori_create_from_array(data, 5);
    vectori_resize(v, 2, 0); // 截断为 [1,2]
    int expected[] = {1, 2};
    ASSERT_VECTOR_EQ(v, expected, 2);
    array_destroy(v);
    TEST_PASS();
}

void test_empty()
{
    TEST_START("empty");
    vectori_t *v = vectori_create(0, 0);
    assert(vectori_empty(v) == true);
    vectori_push_back(v, 123);
    assert(vectori_empty(v) == false);
    vectori_pop_back(v);
    assert(vectori_empty(v) == true);
    array_destroy(v);
    TEST_PASS();
}

void test_push_back()
{
    TEST_START("push_back");
    vectori_t *v = vectori_create(0, 0);
    for (int i = 0; i < 10; ++i)
    {
        vectori_push_back(v, i * 2);
    }
    assert(array_size(v) == 10);
    int *arr = carrayi_cast(v);
    for (size_t i = 0; i < 10; ++i)
    {
        assert(arr[i] == (int)(i * 2));
    }
    array_destroy(v);
    TEST_PASS();
}

void test_pop_back()
{
    TEST_START("pop_back");
    int data[] = {10, 20, 30};
    vectori_t *v = vectori_create_from_array(data, 3);
    int val = vectori_pop_back(v);
    assert(val == 30);
    assert(array_size(v) == 2);
    int expected[] = {10, 20};
    ASSERT_VECTOR_EQ(v, expected, 2);
    val = vectori_pop_back(v);
    assert(val == 20);
    val = vectori_pop_back(v);
    assert(val == 10);
    assert(array_size(v) == 0);
    array_destroy(v);
    TEST_PASS();
}

void test_insert_at_beginning()
{
    TEST_START("insert_beginning");
    int data[] = {20, 30, 40};
    vectori_t *v = vectori_create_from_array(data, 3);
    vectori_insert(v, 0, 10); // 插入到头部
    int expected[] = {10, 20, 30, 40};
    ASSERT_VECTOR_EQ(v, expected, 4);
    array_destroy(v);
    TEST_PASS();
}

void test_insert_at_middle()
{
    TEST_START("insert_middle");
    int data[] = {10, 30, 40};
    vectori_t *v = vectori_create_from_array(data, 3);
    vectori_insert(v, 1, 20); // 插入到中间
    int expected[] = {10, 20, 30, 40};
    ASSERT_VECTOR_EQ(v, expected, 4);
    array_destroy(v);
    TEST_PASS();
}

void test_insert_at_end()
{
    TEST_START("insert_end");
    int data[] = {10, 20, 30};
    vectori_t *v = vectori_create_from_array(data, 3);
    vectori_insert(v, 3, 40); // index == size，等同于 push_back
    int expected[] = {10, 20, 30, 40};
    ASSERT_VECTOR_EQ(v, expected, 4);
    array_destroy(v);
    TEST_PASS();
}

void test_erase_beginning()
{
    TEST_START("erase_beginning");
    int data[] = {10, 20, 30, 40};
    vectori_t *v = vectori_create_from_array(data, 4);
    int removed = vectori_erase(v, 0); // 删除头部
    assert(removed == 10);
    int expected[] = {20, 30, 40};
    ASSERT_VECTOR_EQ(v, expected, 3);
    array_destroy(v);
    TEST_PASS();
}

void test_erase_middle()
{
    TEST_START("erase_middle");
    int data[] = {10, 20, 30, 40};
    vectori_t *v = vectori_create_from_array(data, 4);
    int removed = vectori_erase(v, 2); // 删除30
    assert(removed == 30);
    int expected[] = {10, 20, 40};
    ASSERT_VECTOR_EQ(v, expected, 3);
    array_destroy(v);
    TEST_PASS();
}

void test_erase_end()
{
    TEST_START("erase_end");
    int data[] = {10, 20, 30, 40};
    vectori_t *v = vectori_create_from_array(data, 4);
    int removed = vectori_erase(v, 3); // 删除末尾
    assert(removed == 40);
    int expected[] = {10, 20, 30};
    ASSERT_VECTOR_EQ(v, expected, 3);
    array_destroy(v);
    TEST_PASS();
}

void test_swap()
{
    TEST_START("swap");
    int data1[] = {1, 2, 3};
    int data2[] = {4, 5, 6, 7};
    vectori_t *v1 = vectori_create_from_array(data1, 3);
    vectori_t *v2 = vectori_create_from_array(data2, 4);

    vectori_swap(v1, v2);

    int expected1[] = {4, 5, 6, 7};
    int expected2[] = {1, 2, 3};
    ASSERT_VECTOR_EQ(v1, expected1, 4);
    ASSERT_VECTOR_EQ(v2, expected2, 3);

    array_destroy(v1);
    array_destroy(v2);
    TEST_PASS();
}

void test_swap_self()
{
    TEST_START("swap_self");
    int data[] = {1, 2, 3};
    vectori_t *v = vectori_create_from_array(data, 3);
    vectori_swap(v, v); // 自己交换自己，应无影响
    int expected[] = {1, 2, 3};
    ASSERT_VECTOR_EQ(v, expected, 3);
    array_destroy(v);
    TEST_PASS();
}

void test_comprehensive()
{
    TEST_START("comprehensive");
    vectori_t *v = vectori_create(0, 0);

    // 插入 0..99
    for (int i = 0; i < 100; ++i)
    {
        vectori_push_back(v, i);
    }
    assert(array_size(v) == 100);

    // 删除偶数索引元素 (0,2,4...)
    for (int i = 0; i < 50; ++i)
    {
        vectori_erase(v, i); // 注意每次删除后索引变化
    }
    // 此时应为奇数序列: 1,3,5,...,99
    assert(array_size(v) == 50);
    int *arr = carrayi_cast(v);
    for (size_t i = 0; i < 50; ++i)
    {
        assert(arr[i] == (int)(2 * i + 1));
    }

    // 在头部插入 -1
    vectori_insert(v, 0, -1);
    assert(array_size(v) == 51);
    assert(carrayi_cast(v)[0] == -1);

    // resize 到 30，截断
    vectori_resize(v, 30, 0);
    assert(array_size(v) == 30);

    array_destroy(v);
    TEST_PASS();
}

void test_vertori()
{
    test_create_default();
    test_create_with_size();
    test_create_from_array();
    test_create_from_array_empty();
    test_reserve();
    test_resize_grow();
    test_resize_shrink();
    test_empty();
    test_push_back();
    test_pop_back();
    test_insert_at_beginning();
    test_insert_at_middle();
    test_insert_at_end();
    test_erase_beginning();
    test_erase_middle();
    test_erase_end();
    test_swap();
    test_swap_self();
    test_comprehensive();

    int print_test_arr[10] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    vectori_t *v = vectori_create_from_array(print_test_arr, 10);
    array_print(v);

    printf("All tests passed!\n");
}
```

### 测试：主函数

```C
#include "array.h"
#include "vectori_test.h"
#include <stdio.h>

/*
 * array 多态测试
 */
void test_polymorphism()
{
    int vi[] = {1, 2, 3, 4};
    float vf[] = {1.1, 2.2, 3.3};

    arrayi_t *ai = arrayi_create_from_array(vi, 4);
    arrayf_t *af = arrayf_create_from_array(vf, 3);
    arrayi_t *ai2 = arrayi_create(5, 19845);

    array_print(ai);  // 输出 [1, 2, 3, 4]
    array_print(ai2); // 输出 [1, 1, 1, 1]
    array_print(af);  // 输出 [1.1, 2.2, 3.3]

    *arrayi_at(ai, 0) = 10;
    *arrayf_at(af, 1) = 11.87;

    array_print(ai);
    array_print(af);

    *arrayi_at(ai, 2) *= 30;

    for (size_t i = 0; i < array_size(ai); i++)
    {
        printf("%d ", *arrayi_at(ai, i));
    }
    printf("\n");

    int *ai_data = carrayi_cast(ai);
    float *af_data = carrayf_cast(af);

    ai_data[0] = 100;
    ai_data[1] = 200;
    af_data[0] *= 10;
    af_data[1] += 30;
    af_data[2] /= 1.1;

    array_print(ai);
    array_print(af);

    array_destroy(ai);
    array_destroy(af);
}

int face_obj_test_main()
{
    // array 多态测试
    test_polymorphism();

    // 向量全方面测试
    test_vertori();

    return 0;
}
```