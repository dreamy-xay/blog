---
title: 【Develop】基本软件开发规范与效率指南
date: 2025-08-11 05:55:43
updated: 2025-08-11 05:55:43
tags:
  - 编程规范
  - 技术文档指南
categories:
  - - Develop
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
abbrlink: 14bae32d
---


## 开发环境规范

### 环境配置
- 统一开发环境（确保开发环境和线上环境一致），比如：
  - 统一开发平台：Windows 10或以上
  - 统一编译工具：MinGW 15.1.0-rt_v12-rev0或以上、CMake 3.6或以上
  - 统一外部依赖库：Boost 1.88.0或以上
  - **…**

- 将统一的开发环境配置编写为《环境搭建指南》（`ENV_SETUP.md`），并严格遵照执行
- **…**

### 版本控制
- 使用《变更日志》（`CHANGES.md`）记录所有版本变更，包括：
  - 功能变更
  - BUG修复
  - 版本升级
- 每次提交代码前更新变更日志
- **…**

## 代码规范

### 编码规范

- 统一编码规范（最初由团队一起协商制定），比如：
  - 命名风格
  - 格式化风格
  - 注释规范（具体可以参照配套的自动文档生成工具）
    - [Doxygen](https://www.doxygen.nl/index.html)
      - 支持C、C++、C#、Java、Objective-C和IDL语言
      - 可生成的文档格式包括HTML、XML、LaTeX、RTF、Unix Man Page，而其中还可衍生出不少其它格式，例如HTML可以打包成CHM格式，而LaTeX可以透过一些工具产生出PS或是PDF文档
    - [Sphinx](https://sphinx-doc.cn/en/master/)
      - 主要支持 Python 语言，但它可以通过扩展和配置来支持C、C++、C#、JavaScript、Java、Go、Rust、PHP、Ruby等语言
      - 可生成的文档格式包括HTML、PDF、EPUB、Man Pages、Text、JSON等
    - [JSDoc](https://jsdoc.nodejs.cn/)
      - 仅支持JavaScript语言
      - 可生成一个HTML文档网站
    - **…**
  - **…**
- 通过**静态代码检测工具**检测编码的规范，未通过检查则禁止提交代码到服务器（可以考虑使用自动化工具），常见的**静态代码检测工具**有：
  - **Cpp:** [ClangFormat](https://clang.llvm.org/docs/ClangFormat.html)
  - **Javascript/Typescript:** [ESLint/TSLint](https://eslint.nodejs.cn/docs/latest/use/getting-started)
  - **Java:** [CheckStyle](https://checkstyle.sourceforge.io/)
  - **Python**: [PyLint](https://www.pylint.org)
  - **C#:** [StyleCop](https://github.com/StyleCop/StyleCop)
  - **…**
- 定期进行集体的代码评审，检查的方面包括：
  - 算法
  - 逻辑
  - 安全
  - **…**
- **…**

### 目录结构管理

- 严格遵循既定目录结构，比如：
  ```
  ├── docs/         # 文档
  ├── include/      # 头文件
  ├── src/          # 源文件
  ├── lib/          # 库文件
  ├── tests/        # 测试文件
  └── build/        # 构建文件
  ```
- 新增功能模块时，保持目录结构清晰

## 文档规范

基本要求

- 内容：语言表达清晰流畅，内容全面且成体系
- 格式：建议原始文档用 Markdown 格式书写并存档，使文档不依赖特定展示平台，便于传播及分享
- 存放位置：建议保存在项目 `docs` 文件夹下

### 组成成分

- README.md：用于项目简介及各类文档的入口说明
- 技术手册：提供详细的技术信息，如技术选型、设计方案、使用规范、测试报告、部署配置等文档，既能规范开发过程、支持团队协作，也能帮助用户更好地理解和使用产品
- 用户手册：如果该项目是面向非专业的普通用户，应向用户介绍产品及其使用方法，以帮助用户快速了解产品功能并掌握使用方法。可参考如下文档体系结构：
  - 简介：[必要] 提供对产品和文档本身的总体的、扼要的说明
  - 快速上手：[可选] 如何最快速地使用产品
  - 入门篇：[必要] 又称“使用篇”，提供初级的使用教程
    - 环境准备：[必要] 软件使用需要满足的前置条件
    - 安装：[可选]  软件的安装方法
    - 设置：[必要]  软件的设置
  - 进阶篇：[可选] 又称“开发篇”，提供中高级的开发教程
  - API：[可选] 软件 API 的逐一介绍
  - FAQ：[可选]  常见问题解答
- 接口文档：如果该项目是后端服务，应包含接口文档，用于维护对外接口说明，以便于团队内部沟通和跨团队合作

### 写作规范

- 统一文档写作规范（最初由团队一起协商制定），比如：
  - 文章的标题，建议有且仅有一个；保持层级的简单，防止出现过于复杂的章节…
  - 避免使用长句；尽量使用简单句和并列句，避免使用复合句；避免使用双重否定句…
  - 段落的中心句子放在段首，对全段内容进行概述；段落开头不要留出空白字符…
  - 阿拉伯数字一律使用半角形式，不得使用全角形式；数值为千位以上，应添加千分号…
  - 中文语句的标点符号，均应该采取全角符号；句号、问号、叹号、逗号、顿号、分号和冒号不得出现在一行之首…
  - **…**
- 推荐使用工具来统一文档写作规范，比如：
  - VSCode 中的 [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) 和 [AutoCorrect](https://marketplace.visualstudio.com/items?itemName=huacnlee.autocorrect) 插件，可规范 Markdown 格式并自动纠正标点符号
  - 大语言模型（如 GPT）可在文档撰写中修正错字、润色内容，提升文档质量