---
title: 【开发工具】存储性能测试工具 FIO
tags:
  - 块存储
  - 文件存储
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
abbrlink: ac1fd49
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-10-08 20:47:39
updated: 2026-10-08 21:00:20
---

**FIO**（Flexible I/O Tester）是一款由 Jens Axboe 开发的存储性能测试工具，用于对磁盘、文件系统、块设备和网络存储进行基准测试。FIO 支持多种 I/O 引擎、可配置的块大小、队列深度和读写模式，能够模拟从简单的顺序读写到复杂的混合随机负载的各种场景。

FIO 的命令格式如下：

```bash
fio [选项] [job文件...]
```

可以直接在命令行传递参数，也可以将参数写入 job 文件后通过文件执行。作业文件通常包含一个 `[global]` 部分定义共享参数，以及一个或多个作业部分描述具体的 I/O 行为。

## 一、核心参数详解

### 1 文件与设备

|     参数      |        说明         |           示例            |
| :---------: | :---------------: | :---------------------: |
| `filename`  | 测试目标，可以是文件路径或裸设备  | `filename=/dev/nvme0n1` |
|   `size`    | 每个 job 写入/读取的数据总量 |       `size=10G`        |
|  `offset`   | 在文件中开始 I/O 的起始偏移  |       `offset=1G`       |
| `filesize`  |      单个文件的大小      |      `filesize=2G`      |
| `directory` |     测试文件所在目录      |  `directory=/mnt/test`  |

### 2 I/O 模式

|       参数       |   说明   |
| :------------: | :----: |
|   `rw=read`    |  顺序读   |
|   `rw=write`   |  顺序写   |
| `rw=randread`  |  随机读   |
| `rw=randwrite` |  随机写   |
|  `rw=randrw`   | 混合随机读写 |
| `rw=readwrite` | 混合顺序读写 |

对于混合读写，默认读写比例为 50/50。可通过 `rwmixread` 和 `rwmixwrite` 调整比例：

```bash
fio --rw=randrw --rwmixread=70 --rwmixwrite=30 --bs=4k --size=1G --name=mixed
```

### 3 块大小

`bs` 参数指定 I/O 块大小，默认为 4KB。支持 k、M、G 等单位：

```bash
fio --bs=4k --size=1G --rw=randread --name=test
fio --bs=1M --size=10G --rw=read --name=seqread
```

也可以为读写设置不同的块大小：`bs=4k,64k`（读 4K，写 64K）。

### 4 队列深度

`iodepth` 指定同时保持在 I/O 队列中的请求数量。对于异步 I/O 引擎，提高队列深度可以充分利用设备的并发能力-：

```bash
fio --ioengine=libaio --iodepth=32 --rw=randread --bs=4k --size=1G --name=test
```

同步 I/O 引擎（如 `sync`、`psync`）的 `iodepth` 始终为 1，设置更大的值不会生效。

### 5 缓存控制

`direct=1` 绕过操作系统缓存，直接对存储设备进行 I/O 操作，提供接近硬件的性能数据：

```bash
fio --direct=1 --rw=randread --bs=4k --size=1G --name=test
```

不设置 `direct` 时，I/O 经过页缓存，测试结果会受到缓存的影响。

### 6 运行控制

|        参数         |        说明        |        示例         |
| :---------------: | :--------------: | :---------------: |
|     `runtime`     |      测试持续秒数      |   `runtime=120`   |
|   `time_based`    | 基于时间运行，而非读写完指定大小 |   `time_based`    |
|    `ramp_time`    | 预热时间，期间的数据不计入统计  |  `ramp_time=10`   |
|     `numjobs`     |    并发 job 数量     |    `numjobs=4`    |
| `group_reporting` |  汇总所有 job 的统计结果  | `group_reporting` |

`time_based` 配合 `runtime` 使用时，fio 会在指定时间内持续 I/O，即使已经读写了 `size` 指定的全部数据。

## 二、Job 文件

### 1 基本结构

Job 文件由多个部分组成，`[global]` 中的参数对所有 job 生效，每个 `[jobname]` 定义具体的作业：

```ini
[global]
bs=4k
direct=1
ioengine=libaio
iodepth=32
runtime=120
time_based
group_reporting

[randread-test]
filename=/dev/nvme0n1
rw=randread
name=raw-randread

[randwrite-test]
filename=/dev/nvme0n1
rw=randwrite
name=raw-randwrite
```

执行：

```bash
fio myjob.fio
```

### 2 环境变量

Job 文件支持环境变量展开，格式为 `${VARNAME}`：

```bash
SIZE=64m NUMJOBS=4 fio jobfile.fio
```

Job 文件内容：

```ini
[random-writers]
rw=randwrite
size=${SIZE}
numjobs=${NUMJOBS}
```

运行时 `${SIZE}` 和 `${NUMJOBS}` 会被替换为环境变量的值。

FIO 还内置了保留关键字：`$pagesize`、`$mb_memory`、`$ncpus`，以及简单数学运算：

```ini
size=8*$mb_memory
```

### 3 变量与循环

可以在 job 文件中定义变量，并通过 shell 脚本生成多个 job：

```bash
#!/bin/bash
for bs in 4k 8k 16k 32k 64k; do
    fio --name=test-$bs --bs=$bs --size=1G --rw=randread --runtime=60 --time_based
done
```

### 4 多个 Job 的顺序与并行

Job 文件中的多个 job 默认并行执行。如果希望顺序执行，可以使用 `stonewall` 参数：

```ini
[job1]
stonewall
rw=write
bs=1M
size=10G

[job2]
stonewall
rw=read
bs=1M
size=10G
```

`stonewall` 表示等待前面的 job 退出后再启动当前 job，同时也意味着开始一个新的报告组。

## 三、I/O 引擎

### 1 常用 I/O 引擎

|     引擎     |                  说明                  |
| :--------: | :----------------------------------: |
|   `sync`   |  基本的 `read(2)` / `write(2)`，同步 I/O   |
|  `psync`   | `pread(2)` / `pwrite(2)`，Linux 默认引擎  |
|  `libaio`  |        Linux 原生异步 I/O，支持队列深度         |
| `io_uring` | 现代 Linux 异步 I/O，支持 direct 和 buffered |
| `posixaio` |             POSIX 异步 I/O             |
|  `splice`  |        使用 `splice(2)` 进行数据传输         |
|   `mmap`   |               内存映射 I/O               |

`libaio` 需要配合 `direct=1` 才能发挥队列深度优势，因为 Linux 的异步 I/O 仅对非缓冲 I/O 支持队列行为。

`io_uring` 是较新的异步 I/O 引擎，同时支持 direct 和 buffered I/O。在 NVMe SSD 上，io_uring 相比 libaio 通常能获得更低的延迟。

### 2 引擎选择建议

- **NVMe SSD 随机读写**：`io_uring` 或 `libaio`，配合 `direct=1` 和高 `iodepth`
- **SATA SSD / HDD**：`libaio` 或 `psync`，队列深度根据设备能力设置
- **通用文件测试**：`psync`（默认）
- **网络存储**：根据协议选择，NFS 建议使用 `psync` 或 `libaio`
- **ZFS 文件系统**：`posixaio` 或 `splice` 可能比 `io_uring` 更高效

### 3 I/O 引擎示例

**libaio 异步随机读**：

```bash
fio --name=async-randread \
    --filename=/dev/nvme0n1 \
    --direct=1 \
    --ioengine=libaio \
    --iodepth=64 \
    --rw=randread \
    --bs=4k \
    --runtime=120 \
    --time_based
```

**io_uring 异步随机写**：

```bash
fio --name=uring-randwrite \
    --filename=/dev/nvme0n1 \
    --direct=1 \
    --ioengine=io_uring \
    --iodepth=128 \
    --rw=randwrite \
    --bs=4k \
    --runtime=120 \
    --time_based
```

**psync 同步顺序读**：

```bash
fio --name=sync-seqread \
    --filename=/data/testfile \
    --ioengine=psync \
    --rw=read \
    --bs=1M \
    --size=10G \
    --runtime=120
```

## 四、混合读写与访问模式

### 1 读写比例

`rwmixread` 和 `rwmixwrite` 控制混合读写中读和写的比例，默认各为 50%。如果两个参数同时给出且不相加为 100%，后给出的参数将覆盖前一个：

```bash
fio --rw=randrw --rwmixread=70 --rwmixwrite=30 --bs=4k --size=1G --name=mixed
```

### 2 随机分布模型

FIO 默认使用均匀随机分布。可以通过 `random_distribution` 参数改变访问模式：

```bash
# Zipf 分布（热点访问模式）
fio --random_distribution=zipf:1.2 --rw=randread --bs=4k --size=1G --name=zipf

# Pareto 分布
fio --random_distribution=pareto:0.5 --rw=randread --bs=4k --size=1G --name=pareto
```

Zipf 分布模拟了实际应用中部分数据被频繁访问的场景，例如数据库索引或元数据操作。

### 3 随机比例

`percentage_random` 控制随机 I/O 的比例，默认为 100%（完全随机），设为 0 则为完全顺序：

```bash
fio --rw=read --percentage_random=50 --bs=4k --size=1G --name=half-random
```

### 4 随机映射

默认情况下，FIO 会跟踪所有已访问的偏移，确保不重复读写相同的块。`norandommap` 参数禁用此映射，每次随机选择新的偏移而不检查历史。这与 `verify` 参数互斥。

## 五、延迟与统计

### 1 延迟类型

FIO 输出三类延迟指标：

|  延迟类型  |                    含义                     |
| :----: | :---------------------------------------: |
| `slat` | 提交延迟（Submission Latency），I/O 从提交到被内核接受的耗时 |
| `clat` | 完成延迟（Completion Latency），I/O 从被内核接受到完成的耗时 |
| `lat`  |      总延迟（Total Latency），slat + clat       |

### 2 延迟百分位

默认输出 20 个百分位的完成延迟。可以通过 `percentile_list` 自定义-：

```bash
fio --rw=randread --bs=4k --size=1G \
    --percentile_list=50:90:99:99.9:99.99 \
    --name=latency-test
```

### 3 延迟日志

`write_lat_log` 将延迟数据写入日志文件：

```bash
fio --rw=randread --bs=4k --size=1G \
    --write_lat_log=latency \
    --name=lat-test
```

### 4 带宽与 IOPS 日志

```bash
fio --rw=randread --bs=4k --size=1G \
    --write_bw_log=bw \
    --write_iops_log=iops \
    --name=log-test
```

生成的日志文件可用于绘制性能随时间变化的曲线。

### 5 直方图

FIO 支持基于直方图的延迟统计，`log_hist_coarseness` 控制直方图的粒度：

```bash
fio --rw=randread --bs=4k --size=1G \
    --log_hist_msec=1000 \
    --log_hist_coarseness=4 \
    --name=hist-test
```

## 六、多 Job 与分组

### 1 numjobs

`numjobs` 创建指定数量的 job 克隆，每个克隆是独立的线程或进程：

```bash
fio --rw=randread --bs=4k --size=1G \
    --numjobs=8 --group_reporting \
    --name=multi-job
```

FIO 默认通过 fork 创建进程。使用 `thread` 参数则通过 `pthread_create` 创建线程：

```bash
fio --rw=randread --bs=4k --size=1G \
    --numjobs=4 --thread \
    --name=thread-test
```

### 2 group_reporting

当 `numjobs` 较大时，逐个查看每个 job 的输出会非常繁琐。`group_reporting` 将所有 job 的统计结果汇总为一份报告。

### 3 计算总并发

FIO 的总 I/O 并发数等于 `iodepth × numjobs`。例如 `iodepth=32 numjobs=4` 时，总并发为 128。

### 4 多 Job 示例

```ini
[global]
bs=4k
direct=1
ioengine=libaio
iodepth=32
runtime=120
time_based
group_reporting
filename=/dev/nvme0n1

[read-job]
rw=randread
numjobs=4
name=rand-read

[write-job]
rw=randwrite
numjobs=4
name=rand-write

[mixed-job]
rw=randrw
rwmixread=70
numjobs=4
name=mixed
```

## 七、数据校验

### 1 verify 参数

`verify` 让 FIO 在写入后读取并校验数据，用于检测数据完整性问题。支持的校验算法包括：

| 算法 | 说明 |
| --- | --- |
| `crc32` | CRC32 校验和 |
| `crc32c` | CRC32C 校验和 |
| `crc32c-intel` | 硬件加速的 CRC32C |
| `crc64` | CRC64 校验和 |
| `md5` | MD5 哈希 |
| `sha256` | SHA256 哈希 |
| `xxhash` | xxHash，速度较快 |

**CRC32C 校验示例**：

```bash
fio --rw=write --bs=4k --size=1G \
    --verify=crc32c \
    --name=verify-test
```

**验证已有数据（不重新写入）**：

```bash
fio --rw=read --bs=4k --size=1G \
    --verify=crc32c --verify_only \
    --name=verify-existing
```

{% note info modern %}
fio 的常规数据校验流程（`--verify`）通常是“先写入、后读取”，即先向磁盘写入带校验信息的数据，再读取出来比对，这不仅会覆盖磁盘原有数据，还需耗费双倍时间。而图中“不重新写入”的核心在于 `--verify_only` 参数，它的作用是**跳过写入阶段，直接以只读方式读取并校验磁盘上已有的数据**（前提是这些数据由 fio 此前用相同参数写入）。
{% endnote %}

### 2 verify_pattern

`verify_pattern` 用固定模式填充 I/O 缓冲区，而非随机数据：

```bash
fio --rw=write --bs=4k --size=1G \
    --verify=meta --verify_pattern=0xdeadbeef \
    --name=pattern-test
```

其中，`0xdeadbeef` 为 I/O 缓冲区的固定填充值，而不是使用默认的随机数据填充。

### 3 verify_fatal

默认情况下 FIO 会继续检查所有数据后才报告失败。设置 `verify_fatal=1` 可在首次校验失败时立即退出。

### 4 校验工作负载示例

```ini
[global]
bs=4k
direct=1
ioengine=libaio
iodepth=16
size=2G
filename=/dev/sdb

[verify-write]
rw=write
verify=crc32c
do_verify=0
name=write-phase

[verify-read]
stonewall
rw=read
verify=crc32c
verify_only
name=verify-phase
```

## 八、Trace 回放与 I/O 日志

### 1 write_iolog 与 read_iolog

`write_iolog` 将发出的 I/O 模式记录到文件，`read_iolog` 读取并回放记录的模式：

```bash
# 记录 I/O 模式
fio --rw=randread --bs=4k --size=1G \
    --write_iolog=my_iolog \
    --name=record

# 回放 I/O 模式
fio --read_iolog=my_iolog --name=replay
```

### 2 blktrace 回放

`read_iolog` 也可以读取 blktrace 二进制文件，回放真实设备捕获的工作负载。需要先将 blktrace 数据转换为 blkparse 二进制格式：

```bash
blktrace /dev/sda -d trace.bin
blkparse /dev/sda -o /dev/null -d trace_for_fio.bin
fio --read_iolog=trace_for_fio.bin --name=replay
```

### 3 合并多个 Trace

FIO 支持合并多个 blktrace 文件-：

```bash
fio --read_iolog="trace_a:trace_b" \
    --merge_blktrace_file=merged.bin \
    --merge_blktrace_scalars="50:100" \
    --name=merge
```

## 九、服务器/客户端模式

FIO 支持服务器/客户端模式，适用于在远程节点上执行 I/O 测试：

**在服务端启动 FIO server**：

```bash
fio --server
```

**在客户端执行测试**：

```bash
fio --client=server_hostname myjob.fio
```

客户端模式下，所有 job 选项必须通过 job 文件指定，不能通过命令行传递。

**NFS/iSCSI 测试示例**：

```ini
[global]
ioengine=psync
direct=1
bs=64k
runtime=120
time_based
group_reporting

[nfs-randread]
filename=/mnt/nfs/testfile
size=10G
rw=randread
numjobs=4
name=nfs-read
```

```bash
fio --client=storage-server nfs-test.fio
```

{% note primary no-icon flat %}
<strong style="color: #6F42C1;">💡 FIO 的服务器/客户端模式有什么用</strong>
<span style="display: inline-block; padding-left: 1.8em;">FIO 的服务器/客户端模式主要用于实现“集中控制、分布式并发”的 I/O 测试，解决单机无法打满 NFS、Ceph 等共享存储性能的痛点。该模式允许在控制机（客户端）上编写一次任务，通过 TCP 同步下发到多台被压测机（服务端启动 `fio --server`），从而省去配置免密 SSH、分发文件和手动汇总结果的繁琐操作，并保证多节点压力同时爆发以确保数据准确。使用时需注意：客户端与服务端版本一致、防火墙开放 8765 端口，且控制机最好不参与压测以免成为瓶颈。</span>
{% endnote %}

## 十、性能调优与最佳实践

### 1 队列深度

`iodepth` 应根据设备的并发能力设置：
- **HDD**：队列深度设为 2~4
- **SATA SSD**：队列深度设为 16~32
- **NVMe SSD**：队列深度可设为 64~128 甚至更高

`iodepth_low` 控制队列的低水位线。如果 `iodepth=16 iodepth_low=4`，队列满 16 后，FIO 会等到深度降到 4 才开始重新填充。

### 2 块大小

块大小应与实际工作负载匹配：

|    场景    |  推荐块大小   |
| :------: | :------: |
| 数据库 OLTP |  4K~8K   |
| 数据库 OLAP |  64K~1M  |
|  文件服务器   | 64K~256K |
|  大文件传输   |   1M+    |
|   日志写入   |  4K~16K  |

### 3 ramp_time

`ramp_time` 设置预热时间，期间的数据不计入统计，有助于获得更稳定的结果：

```bash
fio --ramp_time=30 --runtime=120 --time_based \
    --rw=randread --bs=4k --name=warmup-test
```

### 4 测试稳定性

- 使用 `time_based` 和较长的 `runtime`（建议至少 60 秒）
- 多次运行取平均值
- 在测试前确保设备空闲
- 使用 `direct=1` 消除缓存影响

### 5 4KiB 对齐

对于 NVMe 和现代 SSD，分区起始扇区应 4KiB 对齐，否则会导致性能下降。

### 6 输出格式

FIO 支持多种输出格式：

```bash
# 默认格式
fio --rw=randread --bs=4k --size=1G --name=test

# JSON 格式
fio --rw=randread --bs=4k --size=1G --name=test \
    --output-format=json --output=result.json

# 简洁格式
fio --rw=randread --bs=4k --size=1G --name=test \
    --output-format=terse

# 生成带宽日志
fio --rw=randread --bs=4k --size=1G --name=test \
    --bandwidth-log
```

### 7 结果分析

FIO 输出中关键指标包括：
- **IOPS**：每秒 I/O 操作数
- **BW**：带宽（KiB/s 或 MiB/s）
- **lat（avg）** ：平均总延迟
- **clat percentiles**：完成延迟的百分位分布，关注 99th 和 99.9th 百分位
- **clat max**：最大完成延迟，反映尾部延迟

## 十一、常见测试场景

### 1 顺序读带宽测试

```bash
fio --name=seqread \
    --filename=/dev/sdb \
    --rw=read \
    --bs=1M \
    --direct=1 \
    --ioengine=libaio \
    --iodepth=16 \
    --runtime=120 \
    --time_based
```

### 2 随机写 IOPS 测试

```bash
fio --name=randwrite \
    --filename=/dev/sdb \
    --rw=randwrite \
    --bs=4k \
    --direct=1 \
    --ioengine=libaio \
    --iodepth=128 \
    --runtime=120 \
    --time_based \
    --numjobs=4 \
    --group_reporting
```

### 3 混合读写测试

```bash
fio --name=mixed \
    --filename=/dev/sdb \
    --rw=randrw \
    --rwmixread=70 \
    --bs=4k \
    --direct=1 \
    --ioengine=libaio \
    --iodepth=64 \
    --runtime=120 \
    --time_based \
    --numjobs=4 \
    --group_reporting
```

### 4 延迟测试

```bash
fio --name=latency \
    --filename=/dev/sdb \
    --rw=randread \
    --bs=4k \
    --direct=1 \
    --ioengine=libaio \
    --iodepth=1 \
    --runtime=60 \
    --time_based \
    --percentile_list=50:90:99:99.9:99.99
```

### 5 数据完整性测试

```bash
fio --name=verify \
    --filename=/data/verify-test \
    --rw=randwrite \
    --bs=4k \
    --direct=1 \
    --size=2G \
    --verify=crc32c \
    --verify_fatal=1
```

## 参考内容

<strong style="color: #db8ef7;">[1]</strong> [FIO 磁盘性能测试工具学习，零基础入门到精通](https://blog.csdn.net/Python_0011/article/details/154336510)
<strong style="color: #db8ef7;">[2]</strong> [技术干货 016｜云硬盘读写性能评测](https://zhuanlan.zhihu.com/p/336910081)
<strong style="color: #db8ef7;">[3]</strong> [SSD新范式 | 数据中心SSD测试 数据处理篇（上）](https://zhuanlan.zhihu.com/p/672252152)
<strong style="color: #db8ef7;">[4]</strong> [Sample FIO Commands for Block Volume Performance Tests on Linux-Based Instances](https://docs.oracle.com/en-us/iaas/Content/Block/References/samplefiocommandslinux.htm)
<strong style="color: #db8ef7;">[5]</strong> [FIO howto](https://kb.bluvalt.com/howto/fio-howto/)
<strong style="color: #db8ef7;">[6]</strong> [fio(1) man page](https://man.freebsd.org/cgi/man.cgi?query=fio&sektion=1)
<strong style="color: #db8ef7;">[7]</strong> [如何解读fio测试结果？](https://ones.cn/blog/articles/how-to-interpret-fio-test-results-comprehensive-analysis-of-performance-test-data)
<strong style="color: #db8ef7;">[8]</strong> [Why Does My Disk Performance Test Using Fio Have Incorrect Results?](https://support.huaweicloud.com/intl/en-us/evs_faq/evs_faq_0080.html)
<strong style="color: #db8ef7;">[9]</strong> [Benchmarking NFS and iSCSI]([https://www.virtuozzo.com/](https://docs.virtuozzo.com/virtuozzo_infrastructure_7_3_admins_guide/benchmarking-nfs-iscsi-s3.html))
<strong style="color: #db8ef7;">[10]</strong> [IO测试工具](https://zhuanlan.zhihu.com/p/556500316)
<strong style="color: #db8ef7;">[11]</strong> [Running the benchmark for NFS and iSCSI](https://www.virtuozzo.com/infrastructure-docs/admin-guide-running-benchmark-for-nfs-iscsi/)
<strong style="color: #db8ef7;">[12]</strong> [Linux使用FIO测试磁盘的IOPS](https://zhuanlan.zhihu.com/p/564691003)