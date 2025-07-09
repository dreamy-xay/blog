---
title: 【Multithreading】Windows 下互斥锁的 C++ 实现
date: 2025-07-08 10:49:45
updated: 2025-07-08 11:20:36
tags:
  - Windows
  - 线程安全
  - RAII
  - 并发编程
categories:
  - Multithreading
  - 多线程
  - C++
keywords:
description:
top_img:
comments: true
cover:
toc: true
toc_number: true
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 9137290a
---

在多线程编程中，互斥锁是一种重要的同步机制，用于保护共享资源免受并发访问的冲突。本文将详细介绍一个基于 Windows API 的互斥锁实现，包括其核心功能、设计思路以及使用方法。

## 前言

互斥锁（Mutex）是一种同步原语，用于在多线程环境中保护共享资源，确保同一时间只有一个线程可以访问该资源。互斥锁的工作原理是：当一个线程获取到互斥锁时，其他线程必须等待，直到该线程释放互斥锁。互斥锁通常用于防止数据竞争和死锁问题。

在 Windows 系统中，互斥锁可以通过 Windows API 提供的 `CreateMutex` 和 `OpenMutex` 函数实现。这些函数允许创建或打开一个互斥锁对象，并通过 `WaitForSingleObject` 和 `ReleaseMutex` 函数来控制互斥锁的加锁和解锁操作。

## 代码实现

以下是一个基于 Windows API 的互斥锁实现代码，我们将逐步解析其代码。

### 互斥锁类 `Mutex`

互斥锁类 `Mutex` 提供了互斥锁的基本功能，包括创建互斥锁、打开现有互斥锁、加锁和解锁等操作。

```cpp
#include <windows.h>
#include <string>
#include <memory>
#include <stdexcept>

class Mutex {
   public:
    /**
     * @brief 构造函数
     * @param {const std::string&} mutex_name 互斥锁名称
     * @param {bool} create 是否创建互斥锁，否则打开现有互斥锁
     */
    Mutex(const std::string& mutex_name, bool create = false) : mutex_name(mutex_name) {
        if (create) {
            // 创建互斥锁
            h_mutex = CreateMutexA(NULL, FALSE, mutex_name.c_str());

            if (h_mutex == NULL)
                throw std::runtime_error("CreateMutex failed: " + std::to_string(GetLastError()));
        } else {
            // 打开现有互斥锁
            h_mutex = OpenMutexA(MUTEX_ALL_ACCESS, FALSE, mutex_name.c_str());
            
            if (h_mutex == NULL) 
                throw std::runtime_error("OpenMutex failed: " + std::to_string(GetLastError()));
        }
    }

    /**
     * @brief 析构函数
     */
    ~Mutex() {
        if (h_mutex != NULL)
            CloseHandle(h_mutex);
    }

    // 禁止拷贝构造函数
    Mutex(const Mutex&) = delete;
    Mutex& operator=(const Mutex&) = delete;

    /**
     * @brief 获取互斥锁名称
     * @return {std::string} 互斥锁名称
     */
    std::string Name() const {
        return mutex_name;
    }

    /**
     * @brief 加锁
     * @return {void}
     */
    void Lock() const {
        if (WaitForSingleObject(h_mutex, INFINITE) != WAIT_OBJECT_0)
            throw std::runtime_error("WaitForSingleObject failed: " + std::to_string(GetLastError()));
    }

    /**
     * @brief 解锁
     * @return {void}
     */
    void Unlock() const {
        if (!ReleaseMutex(h_mutex))
            throw std::runtime_error("ReleaseMutex failed: " + std::to_string(GetLastError()));
    }

   private:
    HANDLE h_mutex;
    std::string mutex_name;
};
```

#### 构造函数

构造函数 `Mutex` 接受两个参数：互斥锁名称 `mutex_name` 和一个布尔值 `create`，用于指定是创建一个新互斥锁还是打开一个已存在的互斥锁。

- 如果 `create` 为 `true`，调用 `CreateMutexA` 函数创建一个互斥锁。`CreateMutexA` 的第一个参数为 `NULL`，表示默认的安全属性；第二个参数为 `FALSE`，表示不初始拥有该互斥锁；第三个参数为互斥锁名称。
- 如果 `create` 为 `false`，调用 `OpenMutexA` 函数打开一个已存在的互斥锁。`OpenMutexA` 的第一个参数为 `MUTEX_ALL_ACCESS`，表示请求对该互斥锁的完全访问权限；第二个参数为 `FALSE`，表示不继承该互斥锁；第三个参数为互斥锁名称。

如果互斥锁创建或打开失败，构造函数会抛出一个运行时错误，包含错误代码。

#### 析构函数

析构函数的作用是释放互斥锁句柄，防止资源泄漏。当互斥锁对象被销毁时，调用 `CloseHandle` 函数关闭互斥锁句柄。

#### 加锁和解锁

- `Lock` 方法调用 `WaitForSingleObject` 函数，等待互斥锁变为可用状态。`INFINITE` 表示无限等待，直到获取互斥锁为止。如果加锁失败，抛出运行时错误。
- `Unlock` 方法调用 `ReleaseMutex` 函数，释放互斥锁。如果解锁失败，抛出运行时错误。

### 自动加锁类 `AutoLock`

`AutoLock` 类用于实现自动加锁和解锁功能，确保互斥锁在作用域结束时自动释放。

```cpp
class AutoLock {
   public:
    /**
     * @brief 自动加锁构造函数
     * @param {const Mutex&} mutex 互斥锁对象
     */
    explicit AutoLock(const Mutex& mutex) : mutex_ptr(&mutex) {
        mutex_ptr->Lock();
    }

    /**
     * @brief 自动加锁构造函数
     * @param {const Mutex*} mutex 互斥锁对象指针
     */
    explicit AutoLock(const Mutex* mutex) : mutex_ptr(mutex) {
        mutex_ptr->Lock();
    }

    /**
     * @brief 自动加锁构造函数
     * @param {const std::shared_ptr<Mutex>&} mutex 互斥锁对象共享智能指针
     */
    explicit AutoLock(const std::shared_ptr<Mutex>& mutex) : mutex_ptr(mutex.get()) {
        mutex_ptr->Lock();
    }

    /**
     * @brief 自动解锁析构函数
     */
    ~AutoLock() {
        mutex_ptr->Unlock();
    }

   private:
    const Mutex* mutex_ptr;
};
```

#### 构造函数

`AutoLock` 的构造函数接受一个互斥锁对象或互斥锁对象指针，并调用互斥锁的 `Lock` 方法加锁。通过这种方式，`AutoLock` 对象的创建会自动触发加锁操作。

#### 析构函数

`AutoLock` 的析构函数调用互斥锁的 `Unlock` 方法解锁。当 `AutoLock` 对象的作用域结束时，析构函数会被自动调用，从而确保互斥锁被正确释放。

## 使用示例

以下是一个简单的使用示例，展示如何使用 `Mutex` 和 `AutoLock` 类来保护共享资源。

```cpp
#include <iostream>
#include <thread>

void SharedResource() {
    static int count = 0;
    count++;
    std::cout << "Resource accessed " << count << " times." << std::endl;
}

void ThreadFunction(Mutex& mutex) {
	// TODO: ...

    {
        AutoLock lock(mutex);
        SharedResource();
    }
    
    // TODO: ...
}

int main() {
    Mutex mutex("MyMutex", true);

    std::thread t1(ThreadFunction, std::ref(mutex));
    std::thread t2(ThreadFunction, std::ref(mutex));

    t1.join();
    t2.join();

    return 0;
}
```

在这个示例中：
- 创建了一个互斥锁 `mutex`，名称为 `"MyMutex"`。
- 定义了一个共享资源函数 `SharedResource`，用于模拟对共享资源的访问。
- 定义了一个线程函数 `ThreadFunction`，在函数中使用 `AutoLock` 对象自动加锁和解锁，保护对共享资源的访问。
- 创建了两个线程 `t1` 和 `t2`，分别调用 `ThreadFunction` 函数，并传递互斥锁对象。

通过这种方式，`AutoLock` 确保了互斥锁在每个线程的作用域内自动加锁和解锁，从而避免了线程之间的冲突。