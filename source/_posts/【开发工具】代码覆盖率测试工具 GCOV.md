---
title: 【开发工具】代码覆盖率测试工具 GCOV
tags:
  - C/C++
  - 测试工具
categories:
  - 开发工具
comments: true
toc: true
toc_number: false
toc_style_simple: false
katex: false
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: db6c46bb
keywords: ''
description: ''
top_img: ''
cover: ''
date: 2026-08-12 14:39:41
updated: 2026-08-12 14:43:38
---

代码覆盖率是衡量测试质量的重要指标，它反映了测试用例对源代码的覆盖程度。在 C/C++ 开发中，GCC 工具链自带的 GCOV 是最常用的覆盖率分析工具。GCOV 伴随 GCC 发布，配合 GCC 共同实现对 C/C++ 文件的语句覆盖、函数覆盖和分支覆盖测试。

GCOV 是一个命令行方式的控制台程序，需要结合 LCOV、GCOVR 等前端图形工具才能实现统计数据可视化，但 GCOV 本身已S经能够精确展示单元测试对源代码的覆盖情况。

## 一、什么是覆盖率？

代码覆盖率从粗到细可分为多个层次：

| 覆盖率类型 |              说明              |
| :---: | :--------------------------: |
| 函数覆盖率 |           哪些函数被调用过           |
| 语句覆盖率 |           哪些语句被执行过           |
| 分支覆盖率 |          哪些条件分支被走过           |
| 条件覆盖率 | 布尔表达式中的每个条件是否取过 true 和 false |

最基本的覆盖是语句覆盖，更进一步的是分支覆盖和条件覆盖。一段未经充分覆盖的代码是不可靠的，只能测试正常的分支而不能测试异常的分支，很可能在客户现场出现意想不到的问题。

GCOV 能够同时提供语句覆盖、函数覆盖和分支覆盖三种维度的统计数据。

## 二、GCOV 的工作原理

### 1 插桩技术

GCOV 的核心原理是**插桩**（Instrumentation）。所谓插桩，是指在源代码的关键位置插入额外的代码，用于记录程序的执行情况。

当 GCC 编译时指定覆盖率测试选项后，编译器会执行以下操作：
1. 在输出目标文件中留出一段存储区，用于保存统计数据
2. 在每行可执行语句生成的代码之后，附加一段更新覆盖率统计结果的代码——即插桩
3. 编译生成 `.gcno` 文件，该文件包含重建基本块图所需的块信息和源码行号信息
4. 在最终可执行文件中，进入 `main` 函数之前调用 `gcov_init` 内部函数初始化统计数据区，并将 `gcov_exit` 注册为退出处理函数
5. 用户代码调用 `exit` 正常退出时，`gcov_exit` 被调用，继续调用 `__gcov_flush` 将统计数据输出到 `.gcda` 文件

### 2 基本块与跳转弧

GCOV 使用**基本块**（Basic Block, BB）和**跳转弧**（ARC）计数，结合程序流图来实现代码覆盖率统计。

**基本块**（BB）：如果一段程序的第一条语句被执行过一次，这段程序中的每一条语句都要执行一次，这样的代码段称为基本块。一个 BB 中的所有语句的执行次数一定相同。基本块一般由多个顺序执行语句后跟一个跳转语句组成。基本块的最后一条语句一定是跳转语句，跳转的目的地是另一个 BB 的第一条语句。

**跳转弧**（ARC）：从一个 BB 到另一个 BB 的跳转称为一个 ARC。要想知道程序中每条语句和每个分支的执行次数，就必须知道每个 BB 和 ARC 的执行次数。

如果把 BB 作为节点，一个函数中的所有 BB 就构成了一个有向图。根据图论，有向图中 BB 的入度和出度相同，因此只要知道部分 BB 或 ARC 的执行次数，就可以推断出全部数据。GCOV 只需要对部分 ARC 进行插桩，就能统计出所有 BB 和 ARC 的执行次数。

GCC 在插桩过程中会向源文件末尾插入一个静态数组（称为 $B\times2$ 数组），数组大小等于该源文件中桩点的个数。$B\times2+0$ 代表第 `0` 个桩点的位置，`B\times2+n` 代表第 `n` 个桩点的位置，数组的值就是桩点的执行次数。每个桩点插入的汇编语句大致相当于 `inc $(BX2+n)`。

为了便于统计，GCC 还将各个源文件中的 BX2 数组链接成一个链表。这个链表结构在调用 `main` 函数之前就已经产生。

## 三、GCOV 使用流程

使用 GCOV 进行代码覆盖率分析分为三个阶段：编译、运行、生成报告。

### 1 编译阶段

在编译源代码时，需要向 GCC 传递特定的编译选项：

```bash
gcc -fprofile-arcs -ftest-coverage -o myprogram myprogram.c
```

这两个选项的作用分别是：

| 选项                | 作用                          |
| ----------------- | --------------------------- |
| `-ftest-coverage` | 生成 `.gcno` 文件，包含重建基本块图所需的信息 |
| `-fprofile-arcs`  | 在程序执行时生成 `.gcda` 数据文件       |

也可以使用 `--coverage` 选项一次性启用这两个功能：

```bash
gcc --coverage -o myprogram myprogram.c
```

编译完成后，除了生成可执行文件外，还会为每个源文件生成一个 `.gcno` 文件。`.gcno` 文件是覆盖率分析的蓝图，包含了程序的控制流图信息。

### 2 运行阶段

执行编译好的程序，GCOV 会在程序运行过程中记录代码的执行情况。程序正常退出时，覆盖率统计数据会被写入 `.gcda` 文件。

```bash
./myprogram
```

运行完成后，会生成 `.gcda` 文件。`.gcda` 文件包含了实际的执行计数数据（弧跳变次数）。

### 3 生成覆盖率报告

有了 `.gcno` 和 `.gcda` 文件，就可以使用 GCOV 命令生成覆盖率报告：

```bash
gcov myprogram.c
```

GCOV 会生成一个 `.gcov` 文本文件。该文件的内容格式为：

```text
    -:    0:Source:myprogram.c
    -:    0:Graph:myprogram.gcno
    -:    0:Data:myprogram.gcda
    -:    0:Runs:1
    -:    0:Programs:1
    1:    1:#include <stdio.h>
    -:    2:
    1:    3:int main(void)
    -:    4:{
    1:    5:    printf("Hello, World!\n");
    1:    6:    return 0;
    -:    7:}
```

每行开头的数字代表该行代码的执行次数。`#####` 表示该行从未被执行过。`-` 表示该行是不可执行代码（如空行、注释、函数声明等）。既然能显示执行次数，GCOV 还可以用来发现高频调用路径（hot path），辅助性能分析。

## 四、GCOV 常用选项

GCOV 提供了丰富的命令行选项，用于控制输出的详细程度和格式。

|              选项              |            功能             |
| :--------------------------: | :-----------------------: |
|      `-a, --all-blocks`      |       输出每个基本块的执行次数        |
| `-b, --branch-probabilities` |       输出分支频率和分支汇总信息       |
|    `-c, --branch-counts`     |       输出分支执行次数而非百分比       |
|  `-f, --function-summaries`  |        为每个函数输出汇总信息        |
|   `-l, --long-file-names`    |       为包含的源文件生成长文件名       |
|    `-p, --preserve-paths`    | 在生成的 `.gcov` 文件名中保留完整路径信息 |
|      `-n, --no-output`       |     不生成 `.gcov` 输出文件      |
|     `-j, --json-format`      |        以 JSON 格式输出        |

**示例：输出分支覆盖率**

```bash
gcov -b myprogram.c
```

输出示例：

```text
File 'myprogram.c'
Lines executed:85.71% of 7
Branches executed:100.00% of 4
Taken at least once:50.00% of 4
No calls
myprogram.c:creating 'myprogram.c.gcov'
```

**示例：输出每个基本块的执行次数**

```bash
gcov -a myprogram.c
```

## 五、LCOV：将 GCOV 数据可视化

GCOV 生成的是文本格式的报告，可读性有限。LCOV 是 GCOV 的前端工具，能够将覆盖率数据转换为 HTML 格式的可视化报告，在浏览器中直观地查看代码覆盖率。

### 1 LCOV 的工作流程

#### 1.1 收集覆盖率数据

```bash
lcov --capture --directory . --output-file coverage.info
```

该命令扫描当前目录下的所有 `.gcda` 文件，生成一个汇总的 `coverage.info` 文件。

#### 1.2 过滤不需要的文件

```bash
lcov --remove coverage.info '/usr/include/*' '/test/*' --output-file coverage_clean.info
```

#### 1.3 生成 HTML 报告

```bash
genhtml coverage_clean.info --output-directory coverage_report
```

`genhtml` 将覆盖率数据转换为 HTML 报告，生成一个完整的网页目录。

打开 `coverage_report/index.html` 即可在浏览器中查看详细的覆盖率报告。

### 2 LCOV 的典型使用场景

在大型项目中，通常需要**合并多次测试运行**的覆盖率数据：

```bash
lcov --add-tracefile test1.info --add-tracefile test2.info --output-file merged.info
```

也可以**生成基线覆盖率数据**，然后与测试覆盖率数据合并，避免未覆盖的源码文件被遗漏。

## 六、GCOVR：更轻量的报告生成工具

除了 LCOV，GCOVR 是另一个流行的 GCOV 前端工具。GCOVR 是一个 Python 脚本，能够运行 GCOV 并生成简洁的汇总报告。

```bash
# 安装 gcovr
pip install gcovr

# 生成 HTML 报告
gcovr --html --html-details -o coverage_report.html

# 生成 XML 报告（供 CI 系统使用）
gcovr --xml -o coverage.xml
```

GCOVR 支持**排除特定目录**的覆盖率统计：

```bash
gcovr --exclude-directories 'tests/|third_party/'
```

GCOVR 5.0 还支持合并多个覆盖率数据集：

```bash
gcovr -a cov1.json -a cov2.json -o merged_report.html
```

## 七、多文件项目的 GCOV 使用

对于包含多个源文件的项目，GCOV 的使用方式略有不同：

**编译所有源文件（每个文件都要添加覆盖率选项）：**

```bash
g++ --coverage -c -o a.o a.cpp
g++ --coverage -c -o b.o b.cpp
g++ --coverage -o myprogram a.o b.o
```

**运行程序后，为每个源文件生成覆盖率报告：**

```bash
gcov a.cpp b.cpp
```

或者指定目录：

```bash
gcov -o build/ *.cpp
```

GCC 的覆盖率数据文件（`.gcda` 和 `.gcno`）默认生成在源文件所在目录。如果需要指定输出目录，可以使用 `GCOV_PREFIX` 环境变量：

```bash
export GCOV_PREFIX=/path/to/output
```

## 八、CMake 项目中的 GCOV 集成

在 CMake 构建系统中，可以通过条件编译选项方便地启用 GCOV：

```cmake
option(ENABLE_COVERAGE "Enable coverage" OFF)

if(ENABLE_COVERAGE)
    add_compile_options(--coverage)
    add_link_options(--coverage)
endif()
```

或者在 Debug 模式下自动启用：

```cmake
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --coverage")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
endif()
```

配置和构建：

```bash
cmake -DCMAKE_BUILD_TYPE=Debug -DENABLE_COVERAGE=ON ..
make
```

运行测试后，使用 LCOV 生成报告：

```bash
lcov --capture --directory . --output-file coverage.info
lcov --remove coverage.info '*/test/*' '*/CMakeFiles/*' -o coverage_clean.info
genhtml coverage_clean.info --output-directory coverage_report
```

## 九、常见问题与注意事项

### 1 没有生成 .gcda 文件

这是最常见的问题。原因通常是编译时没有添加覆盖率选项。确保在编译时使用了 `-fprofile-arcs -ftest-coverage` 或 `--coverage` 选项。

### 2 程序异常退出导致没有 .gcda 文件

GCOV 只在程序正常调用 `exit` 退出时才会刷新统计数据到 `.gcda` 文件。如果程序被 `kill -9` 强制杀死，或者调用 `_exit` 直接退出，覆盖率数据不会被写入。

解决方法是给待测程序增加信号处理器，拦截 `SIGHUP`、`SIGINT`、`SIGQUIT`、`SIGTERM` 等常见退出信号，在信号处理器中主动调用 `exit` 或 `__gcov_flush` 输出统计结果。

对于已经运行中的服务程序，可以通过 GDB 附加到进程并调用 `__gcov_flush()` 来强制输出覆盖率数据：

```bash
gdb -q attach <pid>
p __gcov_flush()
```

### 3 编译器优化影响覆盖率结果

如果要精确测量每一行代码是否被执行，编译时不应开启优化（如 `-O2`），因为优化可能会重排代码、合并基本块，导致覆盖率数据与源代码行号对应不上。

### 4 覆盖率数据文件位置混乱

当源文件和构建目录分离时，`.gcno` 和 `.gcda` 文件可能不在同一目录。使用 `-o` 选项指定 `.gcda` 文件的路径：

```bash
gcov -o /path/to/build/dir myprogram.c
```

### 5 并行测试导致数据覆盖

并行运行多个测试时，每个测试都会写入同一个 `.gcda` 文件，可能导致数据互相覆盖。可以设置 `GCOV_PREFIX` 环境变量为每个测试指定不同的输出目录。

## 十、GCOV 在 Linux 内核中的应用

GCOV 不仅可用于用户态程序，还可以用于分析 Linux 内核的代码覆盖率。内核需要配置以下选项：

```text
CONFIG_DEBUG_FS=y
CONFIG_GCOV_KERNEL=y
```

内核运行时的代码覆盖率数据会以 GCOV 兼容的格式导出到 `/sys/kernel/debug/gcov/` 目录。获取特定文件的覆盖率数据：

```bash
gcov -o /sys/kernel/debug/gcov/path/to/kernel/build spinlock.c
```

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [gcov c++代码覆盖率测试工具（原理篇） ](https://bbs.huaweicloud.com/blogs/359254)
<strong style="color: #db8ef7;">[2]</strong> [代码覆盖率 - Gcov](https://zhuanlan.zhihu.com/p/638213193)
<strong style="color: #db8ef7;">[3]</strong> [使用 Gcov 和 LCOV 度量 C/C++ 项目的代码覆盖率](https://zhuanlan.zhihu.com/p/402463278)
<strong style="color: #db8ef7;">[4]</strong> [代码覆盖工具gcov和lcov](https://zhuanlan.zhihu.com/p/595845255)
<strong style="color: #db8ef7;">[5]</strong> [docs/docs/cli/gcov.md](https://github.com/zhyantao/docs/blob/master/docs/cli/gcov.md)
<strong style="color: #db8ef7;">[6]</strong> [Gcov and Optimization](https://gcc.gnu.org/onlinedocs/gcc/Gcov-and-Optimization.html)
<strong style="color: #db8ef7;">[7]</strong> [Invoking Gcov](https://gcc.gnu.org/onlinedocs/gcc/Invoking-Gcov.html)
<strong style="color: #db8ef7;">[8]</strong> [无法让gcov生成任何覆盖率数据](https://cloud.tencent.com/developer/ask/sof/1273101)
<strong style="color: #db8ef7;">[9]</strong> [CMake 与代码覆盖率：GCOV 数据收集与 LCOV 报告生成指南](https://runebook.dev/zh/docs/cmake/module/ctestcoveragecollectgcov)
<strong style="color: #db8ef7;">[10]</strong> [在 Linux 内核里使用 gcov](https://docs.linuxkernel.org.cn/dev-tools/gcov.html)