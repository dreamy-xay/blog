---
title: 【C++】STL中 push_back 和 emplace_back 的区别
tags:
  - C++
  - Modern C++
  - STL
abbrlink: 1c60de9
date: 2025-05-21 12:06:12
---

## 区别

emplace_back() 和 push_back() 的区别，就在于底层实现的机制不同：

- push_back() 向容器尾部添加元素时，首先会创建这个元素，然后再将这个元素拷贝（**调用拷贝构造函数**）或者移动（**调用移动构造函数**）到容器中（如果是拷贝的话，事后会自行销毁先前创建的这个元素）。

- 而 emplace_back() 在实现时，则是直接在容器尾部创建这个元素，省去了拷贝或移动元素的过程。

## 原理分析

针对下面一段代码我们可以查看执行结果：

```cpp
#include <bits/stdc++.h>
using namespace std;

class Test {
   public:
    // 普通构造
    Test(int id, const string &name) : id(id), name(name) {
        cout << "ceate Test class..."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
    }
    // 拷贝构造
    Test(const Test &test) : id(test.id), name(test.name) {
        cout << "copy construct called..."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
    }
    // 移动构造
    Test(const Test &&test) {
        id = std::move(test.id);
        name = std::move(test.name);
        cout << "move contruct called.."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
    }
    // 析构函数
    ~Test() {
        cout << "destory Test class..."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
    }

   private:
    int id;       // id成员
    string name;  // name成员
};

void test_function() {
    vector<Test> vec;
    vec.reserve(3);  // 预先分配内存
    cout << "\n ------ create temporary variable for the Test class --------" << endl;
    Test temp(1, "zhang san");
    cout << "\n ------ push_back --------" << endl;
    vec.push_back(temp);
    cout << "\n ------ push_back --------" << endl;
    vec.push_back(Test(2, "li si"));
    cout << "\n ------ emplace_back --------" << endl;
    vec.emplace_back(3, "wang wu");
    cout << "\n ------ push_back --------" << endl;
    cout << "\n -------- finish -------- " << endl;
}

int main() {
    test_function();
    system("pause");
    return 0;
}
```

使用 `g++ -g -std=c++11 -o test test.cpp` 命令编译，运行程序，结果如下：

```shell
 ------ create temporary variables for the Test class --------
ceate Test class... Class: Test{id: 1, name: zhang san}  Adress: 0x62fe80

 ------ push_back --------
copy construct called... Class: Test{id: 1, name: zhang san}  Adress: 0xfa9e40

 ------ push_back --------
ceate Test class... Class: Test{id: 2, name: li si}  Adress: 0x62fec4
move contruct called.. Class: Test{id: 2, name: li si}  Adress: 0xfa9e5c
destory Test class... Class: Test{id: 2, name: li si}  Adress: 0x62fec4

 ------ emplace_back --------
ceate Test class... Class: Test{id: 3, name: wang wu}  Adress: 0xfa9e78

 ------ push_back --------

 -------- finish --------
destory Test class... Class: Test{id: 1, name: zhang san}  Adress: 0x62fe80
destory Test class... Class: Test{id: 1, name: zhang san}  Adress: 0xfa9e40
destory Test class... Class: Test{id: 2, name: li si}  Adress: 0xfa9e5c
destory Test class... Class: Test{id: 3, name: wang wu}  Adress: 0xfa9e78
```

从结果可以看出，同样是在容器尾部加入一个元素，push_back() 和 emplace_back() 的过程是不一样的：

- push_back() 的过程（此处针对情况二，即vec.push_back(Test(2, "li si"))）

  1. 构造一个临时对象
  1. 调用移动构造函数把临时对象的副本拷贝到容器末尾增加的元素中
  1. 调用析构释放临时对象

- emplace_back() 的过程
  1. 调用构造函数在容器末尾增加一个元素

同样是在容器尾部增加一个元素，emplace_back() 比 push_back() 少了一次对象的构造和析构， 所以，emplace_back() 在某些情况下比 push_back() 更高效。

## 运行效率测速

此处进行一个插入一千万个对象的测试，emplace_back() 比 push_back() 快大概 44% ，下面是测试代码 :

```cpp
void test_time(int num = 10000000) {
    vector<Test> vec1;
    vector<Test> vec2;
    vec1.reserve(num);
    vec2.reserve(num);

    time_t t1 = clock();
    for (size_t i = 0; i < num; ++i) {
        vec1.push_back(Test(i, "zhang san"));
    }
    time_t t2 = clock();
    for (size_t i = 0; i < num; ++i) {
        vec2.emplace_back(1, "zhang san");
    }
    time_t t3 = clock();

    cout << "push_back cost " << double(t2 - t1) << " ms" << endl;
    cout << "emplace_back cost " << double(t3 - t2) << " ms" << endl;
    cout << "emplace_back is better than push_back fast " << (double(t2 - t1) / double(t3 - t2) - 1.0) * 100.0 << "%" << endl;
}
```

以下是测速结果：

```shell
push_back cost 5718 ms
emplace_back cost 3955 ms
emplace_back is better than push_back fast 44.5765%
```

## 其他应用

类似 list、set、map 等容器中也有 insert() 和 emplace() 的区分。

## 附录

##### 测试代码如下：

```cpp
#include <bits/stdc++.h>
using namespace std;

#define DEBUG 0

class Test {
   public:
    // 普通构造
    Test(int id, const string &name) : id(id), name(name) {
#if DEBUG == 1
        cout << "ceate Test class..."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
#endif
    }
    // 拷贝构造
    Test(const Test &test) : id(test.id), name(test.name) {
#if DEBUG == 1
        cout << "copy construct called..."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
#endif
    }
    // 移动构造
    Test(const Test &&test) {
        id = std::move(test.id);
        name = std::move(test.name);
#if DEBUG == 1
        cout << "move contruct called.."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
#endif
    }
    // 析构函数
    ~Test() {
#if DEBUG == 1
        cout << "destory Test class..."
             << " Class: Test{id: " << this->id << ", name: " << this->name << "}"
             << "  Adress: " << this << endl;
#endif
    }

   private:
    int id;       // id成员
    string name;  // name成员
};

void test_function() {
    vector<Test> vec;
    vec.reserve(3);  // 预先分配内存
    cout << "\n ------ create temporary variables for the Test class --------" << endl;
    Test temp(1, "zhang san");
    cout << "\n ------ push_back --------" << endl;
    vec.push_back(temp);
    cout << "\n ------ push_back --------" << endl;
    vec.push_back(Test(2, "li si"));
    cout << "\n ------ emplace_back --------" << endl;
    vec.emplace_back(3, "wang wu");
    cout << "\n ------ push_back --------" << endl;
    cout << "\n -------- finish -------- " << endl;
}

void test_time(int num = 10000000) {
    vector<Test> vec1;
    vector<Test> vec2;
    vec1.reserve(num);
    vec2.reserve(num);

    time_t t1 = clock();
    for (size_t i = 0; i < num; ++i) {
        vec1.push_back(Test(i, "zhang san"));
    }
    time_t t2 = clock();
    for (size_t i = 0; i < num; ++i) {
        vec2.emplace_back(1, "zhang san");
    }
    time_t t3 = clock();

    cout << "push_back cost " << double(t2 - t1) << " ms" << endl;
    cout << "emplace_back cost " << double(t3 - t2) << " ms" << endl;
    cout << "emplace_back is better than push_back fast " << (double(t2 - t1) / double(t3 - t2) - 1.0) * 100.0 << "%" << endl;
}

int main() {
    // test_function();
    test_time();
    system("pause");
    return 0;
}
```

