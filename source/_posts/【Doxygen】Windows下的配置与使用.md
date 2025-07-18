---
title: 【Doxygen】Windows下的配置与使用
date: 2025-05-24 08:27:34
updated: 2025-05-24 08:27:34
tags:
  - 技术文档指南
  - 文档生成
  - Windows
categories:
  - [Doxygen]
keywords: 
description: 本文介绍了在 Windows 系统下安装和使用 Doxygen 的详细步骤
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
abbrlink: 1b7a04d
---

## 前言

​       Doxygen是一个自动生成文档的工具，支持C、C++、Java、Objective-C和IDL语言。只要在代码注释时遵循指定规则，就可以用该工具自动生成说明文档。可生成的文档格式包括HTML、XML、LaTeX、RTF、Unix Man Page，而其中还可衍生出不少其它格式。HTML可以打包成CHM格式，而LaTeX可以透过一些工具产生出PS或是PDF文档。

## 关联软件介绍

### Graphviz

​        Graphviz(Graph Visualization Software)是一个由AT&T实验室启动的开源工具包，用于绘制DOT语言脚本描述的图形。要使用Doxygen生成依赖图、继承图以及协作图，必须先安装Graphviz软件。

### HTML Help WorkShop

​       微软推出的HTML Help WorkShop被广泛认为是创建CHM文件的首选工具，其主要功能是能够将HTML文件高效编译成CHM格式的文档。而对于Doxygen软件，尽管其默认输出格式为HTML文件或Latex文件，如果我们希望从HTML转换生成CHM文档，那么就必须先行安装HTML Help WorkShop，并确保在Doxygen的设置中进行适当的关联配置。

## 安装相关程序

​       为了便捷性和灵活性，建议优先选择下载软件的压缩包版本。这种方式无需繁琐的安装过程，仅需解压即可立即使用。

- Doxygen下载：https://www.doxygen.nl/download.html
- Graphviz下载：https://graphviz.org/download/
- HTML Help WorkShop下载：https://www.helpandmanual.com/downloads_mscomp.html

​       在进行软件安装时，建议遵循默认设置，依次点击“下一步”直到安装过程顺利完成。安装结束后，为了确保Doxygen能够正常运行并发挥其最大功能，接下来的配置环节中需要特别注意将Graphviz和HTML Help WorkShop的安装路径与Doxygen进行正确的关联。

## 配置Doxygen

​       所有配置任务均可通过Doxywizard的图形用户界面（GUI）轻松完成，而文档的生成过程也同样通过运行Doxywizard来实现。

### 填写项目设置

​       在 Doxywizard 的“Wizard”界面中，您会看到几个标签页，首先需要关注的是“Project”标签页。在这里，您需要填写一些基本的项目信息：

- **Project Name**：在这里输入您的项目名称。这个名字将用于文档的各个部分。
- **Version or ID**：在这里输入项目的版本号，这有助于文档的用户识别不同版本的文档。
- **Source code directory**：点击浏览按钮选择源代码所在的文件夹。这告诉 Doxygen 在哪里找到需要生成文档的源代码。
- **Destination directory**：点击浏览按钮选择一个文件夹，用于存放 Doxygen 生成的文档。请确保这个文件夹是空的或者是专门为此次文档生成预留的。
- 勾选“Scan recursively”选项，以便 Doxygen 能够递归地扫描指定源代码目录中的所有子目录和文件。

![填写项目设置](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520130710326-1916282764.png)

​       在使用Doxywizard进行文档生成的过程中，至关重要的是正确设置工作目录、源代码目录以及参考文件生成目录这三个关键位置。其他如项目名称、项目简介、版本号和标识等信息，则可以根据具体需求灵活填写。工作目录应该是一个新建的目录，用于存放配置完成后的配置文件（Doxyfile）。这样，每次生成文档时，只需从该目录导入配置文件即可开始文档的编译过程。而源代码目录则指向你的源代码所在位置，最终生成的文档将放置在你设定的结果目录中。

### 调整文档选项

​       在“Mode”标签页中，您可以根据项目的需求选择不同的配置选项：

- **Documented entities only**：选择此模式意味着 Doxygen 将仅提取和生成那些已经被明确注释的实体（如类、函数、变量等）的文档。这种模式适合于那些希望只为特定代码部分生成文档的项目，或者在代码库中只有部分代码是有意义地、系统性地被注释了的情况。
- **All Entities**：选择“所有实体”模式会指示 Doxygen 提取源代码中所有实体的信息，不论它们是否被注释。
- **Include cross-referenced source code in the output**：此选项允许 Doxygen 在生成的文档中包含交叉引用的源代码。这意味着读者可以直接在文档中查看源代码，并且能够点击引用或者被引用的元素，跳转到相关的代码或文档部分。
- **Optimize for C or C++**：如果您的项目主要使用C或C++编写，选择此选项可以让 Doxygen 更好地处理这两种语言的特性。

![调整文档选项](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520130747666-843852989.png)

### 配置生成的输出类型

​       在“Output”标签页中，您可以选择和配置您希望生成的文档类型：

- 勾选您想要生成的文档格式，如 HTML、LaTeX 等。
- 对于每种格式，您可以通过点击对应的配置按钮（如果有的话）来进一步自定义输出设置，例如 HTML 的样式表或者 LaTeX 的文档类。

![配置生成的输出类型](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520130818901-2078776433.png)

### 配置图表生成选项

​       在 Doxywizard 配置流程中的“Diagrams”部分，您可以选择是否以及如何生成各种类型的图表来丰富您的文档。这些图表有助于可视化地展示代码之间的关系，例如类的继承结构、文件依赖关系等。下面是对这一部分选项的详细解释：

#### Diagrams to generate

- **No diagrams**：选择此选项意味着不生成任何图表。如果您希望文档尽可能简洁，或者不需要可视化表示，可以选择此选项。

- **Text only**：此选项将会使用文本形式简单地表示一些关系，而不是生成图形化的图表。这对于希望保持文档轻量级的情况有用。

- **Use built-in class diagram generator**：选择此选项将启用 Doxygen 内置的类图生成器来创建类之间的关系图。这是一个简单的选择，不需要额外的工具，但生成的图表可能不如使用 GraphViz 工具那么精细。

- **Use dot tool from the GraphViz package**：此选项将利用 GraphViz 软件包中的 dot 工具来生成各种图表。GraphViz 是一个强大的图形生成工具，能够创建高质量的图表，是生成复杂关系图的首选方法。

#### Dot graphs to generate

当选择使用 GraphViz 的 dot 工具时，以下是您可以选择生成的图表类型：

- **Class graphs**：显示类之间的继承和协作关系。
- **Collaboration diagrams**：显示类或接口之间的协作关系，通常用于表示类之间的关联、聚合和组合关系。
- **Overall Class hierarchy**：生成整个项目的类层次结构图。
- **Include dependency graphs**：显示文件之间的包含（include）依赖关系。
- **Included by dependency graphs**：显示哪些文件包含了当前文件。
- **Call graphs**：对于函数，显示函数调用图，即一个函数调用了哪些函数。
- **Called by graphs**：显示哪些函数调用了当前函数。

![配置图表生成选项](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520130853289-1631866109.png)

### 调整详细设置（可选）

​       切换到 Doxywizard 的“Expert”模式，您将能够访问更多高级配置选项。这些选项被分为多个类别，如“Project”、“Build”、“Output”等：

- 在这里，您可以细致地调整 Doxygen 的行为，比如控制哪些文件被包含或排除、自定义文档的标题和页脚、设置预处理器宏等。
- 每个选项旁边都有简短的说明，帮助您理解其作用。
- **Extract all**：默认情况下，Doxygen 只提取公开成员的文档。如果您希望包括保护成员等在内的所有成员的文档，应该勾选此选项。

![调整详细设置1](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520130915473-2116288364.png)

![调整详细设置2](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520130929569-1911283470.png)

![调整详细设置3](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520131007038-747875459.png)

![调整详细设置4](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520131017002-1058100728.png)

![调整详细设置5](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520131032465-1072726004.png)

### 生成文档

​       配置完成后，切换到“Run”标签页：

- 点击“Run doxygen”按钮开始生成文档。Doxywizard 会显示进度条，让您知道当前的生成进度。

- 如果遇到任何错误或警告，Doxywizard 会在底部的日志区域显示相关信息。


![生成文档](https://img2024.cnblogs.com/blog/1933699/202505/1933699-20250520131042531-424169478.png)

### 查看生成的文档

​       文档生成完成后：

- 您可以在“Destination directory”指定的目录中找到生成的文档文件。
- 如果您选择生成 HTML 格式的文档，可以通过双击打开目录中的 `index.html` 文件，在浏览器中查看您的项目文档。
- 对于其他格式（如 LaTeX），可能需要进一步的编译或处理才能查看最终的文档。
