---
title: 【Python】自定义项目打包与轮子文件构建
date: 2025-05-25 09:35:10
updated: 2025-05-25 09:35:10
tags:
  - package
categories:
  - [Python]
keywords: 
description: 本文详细介绍了如何构建 Python 项目的轮子文件（.whl），以便于项目的分发和安装
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
abbrlink: 910a9fb2
---

## `Python` 项目通用目录结构

为了使项目结构清晰，易于维护。建议采用以下通用目录结构：

```ini
project_name/
│
├── package_name/            # 项目源代码目录
│   ├── __init__.py          # 初始化文件，用于标识当前目录为Python模块，同时还可提供模块导入说明
│   ├── ext_module/          # 包含Python拓展模块的目录
│   │    ├── ext_module_name_1.pyi  # Python拓展模块1的接口声明文件
│   │    └── ...
│   │
│   ├── module1.py           # 源代码文件1
│   ├── module2.py           # 源代码文件2
│   └── ...
│
├── libs/                    # 动态链接库目录（资源文件，可选）
│   ├── lib1.so      		 # 动态链接库1
│   ├── lib2.so      		 # 动态链接库2
│   └── ...
│
├── models/                  # 模型目录（资源文件，可选）
│   ├── model1.onnx			 # 模型1
│   ├── model2.onnx			 # 模型2
│   └── ...
│
├── modules/              	 # Python拓展模块的目录（资源文件，可选）
│   ├── ext_module_name_1.cpython-37m-x86_64-linux-gnu.so  # Python拓展模块1
│   └── ...
│
├── ...
│
│
├── docs/                    # 项目文档目录（可选），存放使用Sphinx等工具生成的项目文档
│   ├── index.rst            # 主文档文件
│   └── ...
│
├── setup.py                 # 项目打包文件
├── README.md                # 项目说明文档
├── LICENSE                  # 项目许可证文件（可选）
├── .gitignore               # Git忽略文件，用于指定不需要纳入版本控制的文件或目录
└── ...
```

## 安装 `setuptools` 和 `wheel`

```shell
$ pip install setuptools wheel
```

## 创建 `setup.py` 文件

在项目根目录下创建名为`setup.py`的文件，用于定义项目的元数据和打包配置信息。以下是建议的 `setup.py` 文件模板：

```python
#!/usr/bin/env Python
# -*- coding: utf-8 -*-
"""
Description: Python 包构建程序
Version: 0.1.0
Autor: dreamy-xay
date: 2024-05-20
LastEditors: dreamy-xay
LastEditTime: 2024-05-21
"""

import os
import glob
import shutil
from setuptools import setup
import warnings

### 定义包文件夹所在路径、包名、版本号、描述等
package_abspath = "package_name"  # 项目源代码目录
package_settings = {
    "name": "project_name",
    "version": "Version of the project",
    "description": "Description of the project",
    # "author": "Author Name",
    # ...
    "packages": [package_abspath],
}

###  定义需要打包的资源文件
resource_list = [
    ("libs", ["libs/lib1.so"]),
    ("models", ["models/*.onnx"]),	# 支持通用符
    ("ext_module", ["modules/*.cpython-*.so", "package_name/ext_module/*.pyi"]),  # linux 下拓展模块为 so 后缀，windows下为 pyd 后缀
    # ...
]

###  获取项目路径、包路径
project_dir = os.path.dirname(os.path.abspath(__file__))  # 项目路径
package_dir = os.path.join(project_dir, package_abspath)  # 包路径

### try ... finally ... 写法可以保证在打包过程中出现异常（如按 ctrl+c 终止打包程序，或打包出错等）时，取消打包，并删除拷贝和缓存文件
try:
    ### 复制当前包目录结构到缓存目录
    package_cache_dir = os.path.join(project_dir, "package_cache")  # 缓存文件夹路径
    package_cache_data_dir = os.path.join(package_cache_dir, os.path.basename(package_dir))  # 缓存数据路径
    # 如果目录存在则删除目录
    if os.path.exists(package_cache_dir):
        shutil.rmtree(package_cache_dir)  # 删除目录
    # 创建缓存目录
    os.mkdir(package_cache_dir)
    # 复制包文件
    shutil.copytree(package_dir, package_cache_data_dir)

    ### 拷贝资源文件到包目录，同时获取所有资源文件路径
    resource_file_paths = []
    for package_sub_dir, file_paths in resource_list:
        # 资源文件路径
        resource_path = os.path.join(package_dir, package_sub_dir)

        # 如果目录不存在则创建目录
        if not os.path.exists(resource_path):
            os.makedirs(resource_path)  # 创建目录

        # 拷贝
        for file_path in file_paths:
            for single_file_path in glob.glob(os.path.join(project_dir, file_path)):
                resource_file_path = os.path.join(resource_path, os.path.basename(single_file_path))
                resource_file_paths.append(resource_file_path)  # 记录复制文件路径

                if os.path.exists(resource_file_path):
                    if not os.path.samefile(single_file_path, resource_file_path):
                        raise ValueError(f"The file '{os.path.basename(single_file_path)}' already exists in the directory '{resource_path}'!")
                else:
                    shutil.copy2(single_file_path, resource_path)  # 复制文件


    ### 生成 MANIFEST.in 文件
    manifest_in_file_path = os.path.join(project_dir, "MANIFEST.in")
    with open(manifest_in_file_path, "w") as f:
        include_content = "include"
        for resource_file_path in resource_file_paths:
            include_content += " " + os.path.relpath(resource_file_path, project_dir)

        f.write(include_content)

    ### setuptools
    setup(**package_settings, include_package_data=True)

finally:
    ### 删除拷贝的资源文件和缓存文件
    # 定义工具函数
    def compare_remove_directories(old_dir, new_dir):
        """
        比较两个目录，删除新目录中存在但老目标中不存在的文件和文件夹

        Args:
            - old_dir: 老目录
            - new_dir: 新目录

        Returns:
            None
        Author: dreamy-xay
        Date:   2024-05-20
        """
        # 获取两个目录的文件列表
        old_files = set(os.listdir(old_dir))
        new_files = set(os.listdir(new_dir))

        # 在 new_dir 中存在但在 old_dir 中不存在的文件或目录
        extra_files = new_files - old_files
        # 在 new_dir 和 old_dir 中都存在的文件或目录
        same_files = new_files & old_files

        # 删除不同的文件和文件夹
        for file in extra_files:
            path = os.path.join(new_dir, file)
            if os.path.isfile(path):
                os.remove(path)  # 删除文件
                # print(f"remove file: {path}")
            elif os.path.isdir(path):
                shutil.rmtree(path)  # 删除目录
                # print(f"remove dir: {path}")

        # 遍历相同的文件夹
        for file in same_files:
            path = os.path.join(new_dir, file)
            if os.path.isdir(path):
                compare_remove_directories(os.path.join(old_dir, file), path)


    # 开始删除资源文件
    if os.path.exists(package_cache_data_dir):
        compare_remove_directories(package_cache_data_dir, package_dir)  # 删除拷贝的资源文件
        shutil.rmtree(package_cache_dir)  # 删除缓存文件

    ### 删除构建过程中生成的 build、egg 文件夹和 MINIFEST.in
    build_dir = os.path.join(project_dir, "build")
    build_egg_dir = os.path.join(project_dir, package_settings["name"] + ".egg-info") # type: ignore

    # 删除构建目录和 manifest.in 文件
    for path in [build_dir, build_egg_dir, manifest_in_file_path]:
        if os.path.exists(path):
            if os.path.isfile(path):
                os.remove(path)
            else:
                shutil.rmtree(path)
```

在具体工程中使用该`setup.py`模板文件时，主要修改以下三个地方：

- 将`package_name` 替换成包的实际名称。
- 在`package_settings`中，可根据实际需要添加其它元数据。建议不要使用`data_files`和`include_package_data`参数。
- 在`resource_list`中添加要打包的资源文件，其格式为
  [(包内目录, [资源文件路径1, 资源文件路径2, ...]), ...]
  - 包内目录：相对于包目录的路径。
  - 资源文件路径：相对于项目目录的路径。

执行该打包程序时，程序会先将资源文件拷贝到`package_name/包内目录`中，并生成`MINIFEST.in`文件，然后进行打包。打包完成后，打包程序会删除拷贝的资源文件以及打包过程中生成的缓存文件。

## 构建轮子文件

执行以下命令构建轮子文件：

```shell
$ python setup.py bdist_wheel
```

该命令执行后，将在`dist`目录中生成一个`.whl`文件，该文件即是你项目轮子文件。

## 安装轮子文件

执行以下命令安装轮子文件。

```shell
$ pip install /path/to/package_name-version-py3-none-any.whl
```
