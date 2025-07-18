---
title: 【Doxygen】Linux下的配置与使用
date: 2025-05-23 07:24:41
updated: 2025-05-23 07:24:41
tags:
  - 技术文档指南
  - 文档生成
  - Linux
categories:
  - [Doxygen]
keywords: 
description: 本文介绍了在 Linux 系统下安装和使用 Doxygen 的方法
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
abbrlink: bce25c9a
---


## 安装

`linux`发行版众多，大部分通过包管理者就能快速实现 `Doxygen` 的安装

- 在 `Fedora/CentOS` 等红帽系列操作系统上，可以通过以下命令来安装

  ```shell
  sudo yum install doxygen
  # or
  sudo dnf install doxygen
  ```

- 在 `Ubuntu` 等 `Debian` 系列操作系统上，可以通过以下命令来安装

  ```shell
  sudo apt-get install doxygen
  ```

- 在 `Manjaro` 等 `arch` 系列操作系统上，可以通过以下命令来安装

  ```shell
  yay -S doxygen
  # or
  sudo pacman -S doxygen
  ```

只有少量` linux` 发行版`（Ubuntu）`支持` Doxygen `的` GUI` 界面，可以通过包管理者安装

```shell
sudo apt-get install doxygen-gui
```

其中 `GUI` 的使用和 `Windows` 下 `GUI`的使用一致，文档不再重复赘述。

对于使用 `Doxygen` 有需求生成文档、函数之间的结构、调用关系的情况下，需要安装 `graphviz`，`linux`下通过包管理者来安装也非常快速，并且即装即用。

- 在 `Fedora/CentOS` 等红帽系列操作系统上，可以通过以下命令来安装

  ```shell
  sudo yum install graphviz graphviz-devel
  # or
  sudo dnf install graphviz graphviz-devel
  ```

- 在 `Ubuntu` 等 `Debian` 系列操作系统上，可以通过以下命令来安装

  ```shell
  sudo apt-get install graphviz
  ```

- 在 `Manjaro` 等 `arch` 系列操作系统上，可以通过以下命令来安装

  ```shell
  yay -S graphviz
  # or
  sudo pacman -S graphviz
  ```

## 生成并且配置 `Doxyfile`

在使用无 `GUI`的情况下，命令行一样是可以生成最终的代码文档的，只需要生成配置好`Doxyfile`文件

- 生成文件执行以下命令

  ```shell
  doxygen -g <Doxyfile-name>
  ```
  该命令会直接在你指定的目录生成一个名为 `Doxyfile-name` 的标准文件，补充其中的配置文件就可以按照需求生成文档， 如果不输入 `<Doxyfile-name>` ，则执行命令 `doxygen -g` 会直接自动在终端当前的文件夹内生成一个名为 `Doxyfile` 的标准文件，同样补充其中的配置文件就可以按照需求生成文档

- 配置文件
  在生成标准的配置文件之后，就可以正式进入配置，本文档介绍一些主要配置，其次的可以通过查询 [官网](https://www.doxygen.nl/manual/config.html) ，或者查看文件中配置上方的注释进行配置。

  | 配置名称                 | 使用说明                             | 默认选项                 |
  | ------------------------ | ------------------------------------ | ------------------------ |
  | `PROJECT_NAME`           | 指定项目名称                         | 无                       |
  | `OUTPUT_DIRECTORY`       | 指定生成文档的输出目录               | 无                       |
  | `INPUT`                  | 源代码路径                           | 无                       |
  | `FILE_PATTERNS`          | 文件模式                             | `.c;.cpp;.cc;.C;.h;.hpp` |
  | `GENERATE_HTML`          | 是否生成`HTML`文档                   | YES                      |
  | `GENERATE_LATEX`         | 是否生成`LaTeX`文档                  | NO                       |
  | `GENERATE_RTF`           | 是否生成`RTF`文档                    | NO                       |
  | `GENERATE_XML`           | 是否生成`XML`文档                    | NO                       |
  | `GENERATE_DOCBOOK`       | 是否生成`DocBook`文档                | NO                       |
  | `HTML_OUTPUT`            | `HTML`输出路径                       | `html`                   |
  | `LATEX_OUTPUT`           | `LaTeX`输出路径                      | `latex`                  |
  | `RTF_OUTPUT`             | `RTF`输出路径                        | `rtf`                    |
  | `XML_OUTPUT`             | `XML`输出路径                        | `xml`                    |
  | `DOCBOOK_OUTPUT`         | `DocBook`输出路径                    | `docbook`                |
  | `OUTPUT_LANGUAGE`        | 指定生成文档的语言                   | English                  |
  | `USE_MDFILE_AS_MAINPAGE` | 使用`Markdown`文件作为首页           | 无                       |
  | `FULL_PATH_NAMES`        | 显示完整路径名称                     | YES                      |
  | `INLINE_INHERITED_MEMB`  | 内联继承成员                         | NO                       |
  | `SEARCHDATA_FILE`        | 搜索数据文件路径                     | `searchdata.xml`         |
  | `EXTRACT_ALL`            | 提取所有实体，包括私有成员变量和函数 | NO                       |
  | `EXTRACT_PRIVATE`        | 提取私有成员变量和函数               | NO                       |
  | `EXTRACT_STATIC`         | 提取静态成员变量和函数               | NO                       |
  | `HIDE_UNDOC_MEMBERS`     | 隐藏未记录的类的私有成员             | NO                       |
  | `HIDE_UNDOC_CLASSES`     | 隐藏未记录的类                       | NO                       |
  | `SHOW_USED_FILES`        | 显示使用的文件                       | YES                      |
  | `WARN_IF_UNDOCUMENTED`   | 当未记录的实体被引用时显示警告       | YES                      |
  | `WARN_IF_DOC_ERROR`      | 当文档存在错误时显示警告             | YES                      |
  | `WARN_NO_PARAMDOC`       | 当函数参数缺少文档时显示警告         | YES                      |
  | `WARN_AS_ERROR`          | 将警告视为错误                       | NO                       |

## 运行

执行以下命令可以直接运行生成目标文档

```shell
Doxygen <Doxyfile-name>
```

如果在生成配置文件的时候没有填写`<Doxyfile-name>`或者使用的配置文件的名称和默认生成的`Doxyfile`一样，就可以直接运行命令`doxygen`一样可以生成目标文档。

## 查看目标文档

默认情况下，`Doxygen`生成的目标文档将保存在 `<Doxyfile-name>`配置文件中的 `OUTPUT_DIRECTORY`配置选项所指定的目录下。具体的输出目录结构如下：

- `output_directory`
  - `html`
    - `index.html`        # 主页文件，文档的入口点
    - ...
    - `other_files`       # 其他生成的`HTML`文件和资源文件
  - `latex`
    - `refman.tex`        # LaTeX格式文档的入口文件
    - ...
    - `other_files`       # 其他生成的`LaTeX`文件和资源文件
  - `rtf`
    - `output.rtf`        # `RTF`格式文档的输出文件
    - ...
    - `other_files`      # 其他生成的`RTF`文件和资源文件
  - `xml`
    - `output.xml`       # `XML`格式文档的输出文件
    - ...
    - `other_files`       # 其他生成的`XML`文件和资源文件
  - `docbook`
    - `output.xml`       # `DocBook`格式文档的输出文件
    - ...
    - `other_files`       # 其他生成的`DocBook`文件和资源文件

你可以根据需要修改`OUTPUT_DIRECTORY`配置选项来指定生成文档的保存路径。