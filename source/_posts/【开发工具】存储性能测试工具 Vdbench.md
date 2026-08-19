---
title: 【开发工具】存储性能测试工具 Vdbench
tags:
  - 块存储
  - 性能测试
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
abbrlink: eec576bf
keywords: ''
description: ''
top_img: ''
cover: ''
date: 2026-08-18 12:15:22
updated: 2026-08-19 09:14:18
---

**Vdbench** 是一款开源的 I/O 工作负载生成器，主要用于测量存储性能并验证数据完整性。它支持对**裸盘（块设备）** 和**文件系统**进行基准测试。

## 一、核心名词与参数

Vdbench 通过一个**文本配置文件（参数文件）** 来定义测试的所有细节。配置文件中参数的**定义顺序至关重要**，否则会导致运行失败。其核心名词解释如下：

|      概念      |   缩写    |                  说明                  |    适用场景    |
| :----------: | :-----: | :----------------------------------: | :--------: |
|   **主机定义**   | **HD**  | 定义参与测试的主机信息，如 IP、用户名、通信方式等。单机测试时可省略。 | 裸盘 & 文件系统  |
|   **存储定义**   | **SD**  |     定义被测试的块设备（LUN），如设备路径、并发线程数等。     |  **裸盘测试**  |
|  **工作负载定义**  | **WD**  |   定义具体的 I/O 模式，如数据块大小、读写比例、随机/顺序等。   |  **裸盘测试**  |
|  **文件系统定义**  | **FSD** |        定义测试文件的目录结构、文件数量、大小等。         | **文件系统测试** |
| **文件工作负载定义** | **FWD** |       定义对文件系统的操作，如读、写、创建、删除等。        | **文件系统测试** |
|   **运行定义**   | **RD**  |      定义测试如何执行，如测试时长、预热时间、报告间隔等。      | 裸盘 & 文件系统  |

### 1 裸盘测试参数详解

参数定义顺序为：`HD` → `SD` → `WD` → `RD`。

#### 1.1 HD (Host Define)

  - `hd`: 主机标识名称
  - `system`: 主机 IP 或主机名
  - `vdbench`: Vdbench 安装路径
  - `user`: 用于 SSH 通信的用户名
  - `shell`: 多主机通信方式，Linux 下常用 `ssh`
  
#### 1.2 SD (Storage Define)

  - `sd`: 存储设备标识名称
  - `lun`: 块设备路径。Linux 如 `/dev/sdb`，Windows 如 `\\.\G:`
  - `openflags`: 建议设为 `o_direct`，以绕过系统缓存，获取真实设备性能
  - `threads`: 对该设备的**最大并发 I/O 请求数量**，默认 8。**注意**：裸盘测试的线程数在此处定义

#### 1.3 WD (Workload Define)

  - `wd`: 工作负载标识名称
  - `sd`: 引用已定义的存储设备 (SD)
  - `xfersize`: 单次 I/O 的数据块大小，如 `4k`, `1M`
  - `rdpct`: 读取请求的百分比。`100` 为纯读，`0` 为纯写
  - `seekpct`: 随机寻道的百分比。`100` 为全随机，`0` 为全顺序

#### 1.4 RD (Run Define)

  - `rd`: 运行标识名称
  - `wd`: 引用已定义的工作负载 (WD)
  - `iorate`: I/O 速率。设为 `max` 表示以最大性能运行
  - `elapsed`: 测试运行持续时间，单位秒，默认 30
  - `warmup`: 预热时间，单位秒，此期间数据不计入最终结果
  - `interval`: 报告输出的时间间隔，单位秒
#### 2 文件系统测试参数详解

参数定义顺序为：`HD` → `FSD` → `FWD` → `RD`。

#### 2.1 FSD (File System Define)

  - `fsd`: 文件系统定义标识名称
  - `anchor`: 测试目录的根路径
  - `depth`: 目录层级深度
  - `width`: 每层目录的数量
  - `files`: 最深层目录下的文件数量
  - `size`: 每个文件的大小，如 `200M`
  - `distribution`： 仅在最低级别创建文件（`bottom`），在所有目录中创建文件（`all`）
  - `openflags`：用于打开一个文件系统（`Solaris`）的 `flag_list`
#### 2.2 FWD (FileSystem Workload Define)

  - `fwd`: 文件工作负载标识名称
  - `fsd`: 引用已定义的文件系统 (FSD)
  - `operation`: 文件操作，如 `read`, `write`, `create`, `delete`，`open`，`close`，`mkdir`，`rmdir` 等
  - `xfersize`: 数据传输（读写操作）处理的数据大小
  - `fileio`: I/O 模式，`random`（随机）或 `sequential`（顺序）
  - `fileselect`: 文件选择方式，`random` 或 `sequential`
  - `threads`: **并发线程数**
  - `host`：工作负载的主机 ID
  - `rdpct`：（仅）读取的写入操作的百分比

## 二、运行测试

### 1 单机测试

#### 1.1 裸盘测试示例

  此示例对 `/dev/sdb` 进行 1MB 块大小的顺序写测试，时长 600 秒：
  
  ```bash
  # 配置文件内容
  sd=sd1,lun=/dev/sdb,openflags=o_direct
  wd=wd1,sd=sd1,seekpct=0,rdpct=0,xfersize=1M
  rd=rd1,wd=wd1,iorate=max,warmup=60,elapsed=600,interval=2
  
  # 执行命令
  ./vdbench -f Single-RawDisk.html -o /path/to/output
  ```

#### 1.2 文件系统测试示例

  此示例在 `/path/to/Sigle-FileSystem` 目录下创建多级目录和文件，并进行 1MB 块大小的顺序写测试：
  
  ```bash
  # 配置文件内容
  fsd=fsd1,anchor=/path/to/SigleFileSystem,depth=2,width=3,files=10,size=200M
  fwd=fwd1,fsd=fsd1,operation=write,xfersize=1M,fileio=sequential,fileselect=random,threads=2
  rd=rd1,fwd=fwd1,fwdrate=max,format=yes,elapsed=600,interval=5
  
  # 执行命令
  vdbench -f "SingleFileSystem.txt"
  ```

### 2 多主机联机测试

1. **配置 SSH 互信**：确保 Master 节点可以免密 SSH 登录到所有 Slave 节点
2. **定义 HD**：在配置文件中定义所有主机：

   ```bash
   hd=default,vdbench=/root/vdbench50406,user=root,shell=ssh
   hd=hd1,system=node241
   hd=hd2,system=node242
   hd=hd3,system=node243
   ```

3. **分配 SD**：为每个主机指定各自的存储设备：

   ```bash
   sd=sd1,hd=hd1,lun=/dev/sdb,openflags=o_direct
   sd=sd2,hd=hd2,lun=/dev/sdb,openflags=o_direct
   ```

4. **执行测试**：仅在 Master 节点上运行 Vdbench 命令即可

## 四、结果分析

测试完成后，Vdbench 会在输出目录（默认为 `output/`）生成报告：
- **`summary.html`**：包含测试的总体摘要信息（每个报告间隔及除第一个间隔外的所有间隔加权平均），如总 IOPS、总吞吐量（带宽）和平均延迟：
	- `interval`：报告间隔序号
	- `I/O rate`：每秒平均 I/O 速率
	- `MB sec`：传输的数据的平均 MB 数
	- `bytes I/O`：平均数据传输大小
	- `read pct`：平均读取百分比
	- `resp time`：以读/写请求持续时间度量的平均响应时间（所有时间均以毫秒为单位）
	- `resp max`：在此间隔中观察到的最大响应时间（最后一行包含最大值总数）
	- `resp stddev`：响应时间的标准偏差
	- `cpu% sys+usr`：处理器繁忙（系统+用户时间，Solaris、Windows、Linux）
	- `cpu% sys`：处理器利用率（系统时间）
	- **...**
- **`<hostname>_<timestamp>.html`**：每个主机详细的性能报告，按时间间隔（`interval` 参数）展示了 IOPS、带宽和延迟的变化
- **`errorlog.html`**：记录测试过程中发生的任何错误，当启用了数据验证（`-jn`）时，包含一些数据块错误的相关信息：
	- 无效的密钥读取
	- 无效的 lba（Logical byte address，一个扇区的逻辑字节地址）读取
	- 无效的 SD 或 FSD 名称读物
	- 数据损坏（即使在使用错误的 lba 或密钥时）
	- 坏扇区
	- **...**
- `flatfile.htm|`：vdbench 生成的一种逐列 ASCII 格式信息
- `histogram.html`：柱状图的响应时间、文本格式的报告
- `logfile.html`：Java 代码写入控制台窗口的每行信息的副本（主要用于调试用途）
- `parmfile.html`：用于测试的每项内容的最终结果
- **...**

可以将这些 `.html` 文件在浏览器中打开，或将数据导出到电子表格软件中生成图表进行深入分析。

## 五、常用参数速查

|          参数          |   所属部分   |        说明         |          示例          |
| :------------------: | :------: | :---------------: | :------------------: |
| `openflags=o_direct` | SD / FSD |    绕过缓存，直接读写磁盘    | `openflags=o_direct` |
|      `threads=`      | SD / FWD |    并发 I/O 线程数     |     `threads=8`      |
|     `xfersize=`      | WD / FWD |     I/O 数据块大小     |    `xfersize=64k`    |
|       `rdpct=`       |    WD    |   读操作百分比（0-100）   |      `rdpct=70`      |
|      `seekpct=`      |    WD    |  随机访问百分比（0-100）   |    `seekpct=100`     |
|      `iorate=`       |    RD    | I/O 速率，`max` 表示最大 |     `iorate=max`     |
|      `elapsed=`      |    RD    |      测试时长（秒）      |    `elapsed=300`     |
|      `warmup=`       |    RD    |      预热时间（秒）      |     `warmup=30`      |
|     `interval=`      |    RD    |     结果报告间隔（秒）     |     `interval=5`     |

## 六、常见问题

1. **`./vdbench -t` 测试失败？**
  通常是由于 Java 环境未正确安装或配置，请检查 `java -version`。也可能是文件权限问题，尝试 `chmod -R 777` 赋予 Vdbench 目录权限。

2. **多主机运行时连接失败？**
  检查 Master（主） 和 Slave（从） 之间的 SSH 互信是否配置正确。确认配置文件中的 `system` IP 和 `user` 用户名无误。

3. **测试结果波动大？**
  确保测试期间系统无其他负载。可适当增加 `elapsed` 测试时长和 `warmup` 预热时间，以获得更稳定的数据。
  
## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [存储测试：vdbench存储性能测试工具](https://www.cnblogs.com/luxf0/p/13321077.html)
<strong style="color: #db8ef7;">[2]</strong> [存储测试：Vdbench 存储测试工具完整使用教程](https://blog.csdn.net/Gwumingzhibei/article/details/162275902)
<strong style="color: #db8ef7;">[3]</strong> [[Vdbench 5.04.07] vdbench的介绍与使用](https://www.cnblogs.com/cc-notes/p/19461059)
<strong style="color: #db8ef7;">[4]</strong> [手把手教你用VDbench：存储性能测试全流程解析](https://zhuanlan.zhihu.com/p/1956035835838313203)