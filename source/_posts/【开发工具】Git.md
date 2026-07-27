---
title: 【开发工具】Git
tags:
  - 版本控制
  - 远程开发
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
abbrlink: 98d6f04f
keywords: ""
description: ""
top_img: ""
cover: ""
date: 2026-07-15 14:53:55
updated: 2026-07-27 16:01:02
---

## 一、Git 工作流程与核心概念
### 1 工作流程

 Git 的工作流程可以想象成 **写作业并交给老师** 的过程。下图展示了这一流程：

<div align="center">
    <img src="https://cdn.jsdmirror.cn/gh/dreamy-xay/figurebed@main/2026-07/git-workflow_1785136799311.svg" width="100%" />
    <strong style="color: #1fb9fb; margin: -20px 0px 20px 0px; display: block;">Git 工作流程图</strong>
</div>

**步骤 1**：工作区（Working Directory）—— 你的书桌
> 这是你实际修改文件的地方。你在这里写新代码、修复 Bug、删除无用文件，所有改动都只存在于本地，尚未被 Git 记录。

**步骤 2**：暂存区（Staging Area）—— 你的待邮寄篮子

> 当你觉得某部分作业差不多了，就用 **`git add`** 把它放进篮子。这一步告诉 Git：“这些改动我确认要提交了，先帮我记着。”你可以选择性地添加部分文件。

**步骤 3**：本地仓库（Local Repository）—— 你的个人保险箱
> 用 **`git commit`** 把篮子里的内容打包并贴上标签（提交信息），锁进保险箱。从此，这次改动成为项目历史的一部分，随时可以找回。

**步骤 4**：远程仓库（Remote）—— 老师的收件箱（如 GitHub/GitLab）
> 最后，用 **`git push`** 把保险箱里的代码发送到远程服务器，既备份又方便团队协作。

|    区域    |             含义              |     对应操作     |
| :------: | :-------------------------: | :----------: |
| **工作区**  |      你电脑上看到的文件，日常编辑的地方      |     编写代码     |
| **暂存区**  | `git add` 后的暂存地，标记下次要提交的内容  |  `git add`   |
| **本地仓库** | `git commit` 后形成永久快照，拥有完整历史 | `git commit` |
| **远程仓库** | GitHub/GitLab 等服务器上的仓库，团队共享 |  `git push`  |

### 2 关键名词

- **Commit（提交）**：一次项目快照，包含改动内容和说明信息。
- **Branch（分支）**：一条独立的历史线，支持并行开发互不干扰。
- **Merge（合并）**：将两个分支的改动整合到一起（如功能分支合并回主分支）。

## 二、Git 操作指南
### 1 准备工作：克隆或初始化仓库

#### 1.1 克隆已有项目

若要参与已有项目，首先将远程仓库完整复制到本地：

```bash
git clone https://github.com/username/repo.git
cd repo
```

#### 1.2 从零开始新项目

若本地新建项目，需依次完成初始化、忽略规则配置、首次提交并关联远程：

```bash
# 1. 初始化本地仓库
git init

# 2. 创建 .gitignore（排除临时文件、密钥、本地数据等）
# 示例内容（Python 项目）：
# __pycache__/
# .venv/
# .env
# *.log

# 3. 添加所有文件到暂存区
git add .

# 4. 完成首次提交（通常称为 initial commit）
git commit -m "init: project setup"

# 5. 关联远程仓库
git remote add origin https://github.com/yourname/your-repo.git

# 6. 首次推送并设置上游分支（-u 等价于 --set-upstream）
git push -u origin main   # 或 master
```

### 2 日常开发核心循环

每次开发遵循 **编辑 → 暂存 → 提交 → 推送** 的标准流程：

1. **查看当前状态**（养成习惯，随时检查）

```bash
   git status
```

2. **将改动添加到暂存区**（按需添加，避免无脑 `add .`）
  
```bash
   git add main.py rag/rag_chain.py   # 指定文件
   git add .                          # 添加所有改动
```
    
3. **提交并书写有意义的提交信息**
   
```bash
   git commit -m "feat: add RRF result fusion to search pipeline"
```
    
4. **推送到远程仓库**

 ```bash
   git push
 ```

### 3 分支管理

#### 3.1 为什么需要分支

分支使不同功能的开发相互隔离。例如，正在开发新功能时突遇紧急修复，可在单独分支上处理 bug，主分支（main）始终保持稳定可部署。

#### 3.2 基本分支操作

```bash
# 创建分支
git branch feature/new-search

# 切换分支
git checkout feature/new-search

# 创建并切换（一步到位，推荐）
git checkout -b feature/new-search

# 查看所有分支（* 标记当前所在分支）
git branch

# 切回主分支
git checkout main

# 合并功能分支到主分支
git checkout main
git merge feature/new-search

# 删除已合并的本地分支（可选）
git branch -d feature/new-search
```

#### 3.3 推荐工作流：功能分支工作流（Feature Branch Workflow）

- `main` 分支始终保持可部署状态。
- 每个新功能/修复均从 `main` 分出独立分支。
- 完成后合并回 `main`，随后可删除功能分支。

**分支命名规范**：
- `feat/xxx` 或 `feature/xxx` —— 新功能
- `fix/xxx` 或 `bugfix/xxx` —— Bug 修复
- `refactor/xxx` —— 重构
- `docs/xxx` —— 文档
- `hotfix/xxx` —— 紧急修复

#### 3.4 实战示例：为 RAG 系统增加重排序功能

```bash
# 1. 确保本地 main 与远程同步
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feat/rerank

# 3. 开发... 测试... 过程中可随时提交
git add reranker.py
git commit -m "feat: add cross-encoder reranker module"

# 4. 开发完成，合并回 main（--no-ff 保留分支历史）
git checkout main
git merge feat/rerank --no-ff

# 5. 推送更新到远程
git push origin main

# 6. 清理本地功能分支
git branch -d feat/rerank
```

### 4 远程仓库操作

#### 4.1 远程仓库管理

```bash
# 查看已配置的远程仓库
git remote -v

# 添加远程仓库
git remote add origin https://github.com/yourname/repo.git

# 修改远程仓库 URL
git remote set-url origin https://github.com/yourname/new-repo.git

# 删除远程仓库关联
git remote remove origin
```

#### 4.2 推送与拉取

```bash
# 推送当前分支到远程
git push

# 首次推送并设置上游分支
git push -u origin main

# 拉取远程最新代码并自动合并（相当于 fetch + merge）
git pull

# 仅下载远程更新，不合并（安全查看）
git fetch
```

**`fetch` 与 `pull` 的选择**：
- `git fetch`：只下载，不改变工作区，适合先审查远程变化再决定合并。
- `git pull`：下载并自动合并，适用于日常同步且确信无冲突时。

#### 4.3 分支推送与删除

```bash
# 推送指定分支
git push origin feature/rerank

# 删除远程分支（本地不受影响）
git push origin --delete feature/rerank

# 推送所有分支
git push --all
```

### 5 多人协作流程

#### 5.1 团队内协作（同一仓库写权限）

所有成员对同一个远程仓库有推送权限时，工作流如下：

```bash
# 1. 克隆团队仓库
git clone https://github.com/team/repo.git
cd repo

# 2. 创建功能分支
git checkout -b feat/my-feature

# 3. 开发并提交
git add .
git commit -m "feat: implement feature"

# 4. 推送功能分支到远程
git push -u origin feat/my-feature

# 5. 在托管平台（GitHub/GitLab）创建 Pull Request（PR），邀请 Review

# 6. Review 通过后合并到 main
```

### 5.2 开源贡献（Fork + Pull Request）

```bash
# 1. 在 GitHub 上 Fork 原仓库至个人账号

# 2. Clone 自己的 Fork
git clone https://github.com/yourname/repo.git
cd repo

# 3. 添加原仓库为上游
git remote add upstream https://github.com/original-author/repo.git

# 4. 从上游同步最新 main
git checkout main
git pull upstream main

# 5. 创建功能分支并开发
git checkout -b feat/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feat/new-feature

# 6. 在 GitHub 上从该分支向原仓库发起 Pull Request
```

#### 5.3 每日同步规范

**开工前**：

```bash
git checkout main
git pull origin main
git checkout -b feat/today-task
```

**收工前**：

```bash
git add .
git commit -m "feat: xxx"
git push

# 若功能完成，提 PR 请求合并
```

### 6 冲突处理

#### 6.1 冲突的产生

当两个分支修改了同一文件的同一区域时，合并时 Git 无法自动决定取舍，便产生冲突。

#### 6.2 冲突标记格式

```text
<<<<<<< HEAD
你的代码版本
=======
别人的代码版本
>>>>>>> branch-name
```

#### 6.3 解决步骤

```bash
# 1. 拉取或合并时发生冲突（示例为 git pull）
git pull origin main
# 输出：CONFLICT (content): Merge conflict in main.py

# 2. 打开冲突文件，手动编辑，删除 <<<<<<< ======= >>>>>>> 标记，保留最终内容

# 3. 标记为已解决
git add main.py

# 4. 提交合并结果
git commit -m "fix: resolve merge conflict in main.py"
```

若多个文件冲突，需逐一解决后统一提交。

#### 6.4 冲突预防策略

|  策略  |              说明              |
| :--: | :--------------------------: |
| 频繁拉取 |   每天开工前执行 `git pull`，减少差异    |
| 小步提交 |        每次提交改动量小，冲突概率低        |
| 分工明确 |        团队协商避免同时修改同一文件        |
| 及时合并 |        功能完成即合并，避免长期分支        |
| 定期同步 | 长期分支定期 `git merge main` 保持同步 |

### 7 常见场景实战

#### 7.1 临时切换任务（保存未提交的改动）

```bash
# 正在开发功能，突遇紧急修复
git stash                    # 保存当前未提交的改动
git checkout main
git checkout -b hotfix/bug
# 修复...
git add .
git commit -m "fix: xxx"
git checkout main
git merge hotfix/bug
git push origin main

# 回到原功能分支继续开发
git checkout feat/my-feature
git stash pop                # 恢复暂存改动
```

#### 7.2 修正最后一次提交

```bash
# 提交消息写错
git commit --amend -m "correct message"

# 漏加文件
git add forgot-this.py
git commit --amend --no-edit   # 补加进上一次提交，不改消息
```

#### 7.3 撤销提交

- **`git revert`**（安全，适合已推送的提交）：创建一个新提交来反向撤销指定提交的改动，不修改历史。

```bash
   git revert HEAD      # 撤销最近一次提交
```

- **`git reset`**（危险，会丢失提交）：回退到指定提交，之后的所有提交被移除。

```bash
   git reset --hard HEAD~1   # 硬回退，本地改动全部丢失
   git reset --soft HEAD~1   # 软回退，改动保留在暂存区
```

#### 7.4 合并多个小提交（交互式 rebase）

```bash
git rebase -i HEAD~3    # 合并最近 3 个提交
# 在编辑器中，将除第一个外的 pick 改为 squash，保存退出
# 然后编写新的合并提交消息
```

#### 7.5 远程有更新且本地有未提交改动

```bash
git stash                    # 暂存本地改动
git pull origin main         # 拉取远程更新
git stash pop                # 恢复本地改动（若有冲突则手动解决）
```

#### 7.6 查看提交详情

```bash
git show <commit-hash>              # 查看某次提交的完整改动
git show --stat <commit-hash>       # 仅查看变更文件列表
git diff <hash1> <hash2>            # 比较两次提交的差异
```

### 8 最佳实践与避坑指南

#### 8.1 严禁操作

|            行为             |          后果          |
| :-----------------------: | :------------------: |
| `git push --force` 到 main |    覆盖他人提交，破坏团队协作     |
|       直接在 main 上开发        |      不稳定代码污染主分支      |
|   提交 `.env`、密码、API Key    | 敏感信息永久暴露（即使删除，历史仍可查） |
|      提交超大文件（>100MB）       |   GitHub 拒绝，后续处理复杂   |
|           长期不提交           | 改动量大，Review 困难，冲突风险高 |

#### 8.2 必须配置的 .gitignore（Python 示例）

```text
# Python 缓存
__pycache__/
*.pyc
*.pyo
*.egg-info/
# 虚拟环境
.venv/
venv/
# 环境变量
.env
.env.local
.env.production
# IDE 配置
.idea/
.vscode/
# 操作系统
.DS_Store
Thumbs.db
# 本地数据（大文件）
*.db
*.sqlite
data/raw/
```

#### 8.3 Git 黄金法则

- **频繁提交，小步前进**：每次提交只做一个小改动。
- **提交前检查**：使用 `git diff` 复核改动内容。
- **提交消息清晰**：说明“为什么改”，而非仅“改了什么”。
- **保持 main 可用**：不稳定代码只留在功能分支。
- **每日同步**：`git pull` 保持与远程一致。
- **敏感信息不入库**：使用环境变量或密钥管理服务。

#### 8.4 终极恢复工具：`git reflog`

当误删分支、错误 reset 后，`git reflog` 记录了所有 HEAD 变动，可助你找回丢失状态：

```bash
git reflog
# 找到目标状态对应的索引，如 HEAD@{5}
git reset --hard HEAD@{5}
```

## 附录：命令速查卡

|    分类     |                 命令                  |       作用       |
| :-------: | :---------------------------------: | :------------: |
|  **初始化**  |             `git init`              |    初始化本地仓库     |
|           |          `git clone <url>`          |     克隆远程仓库     |
|  **日常**   |            `git status`             |  查看工作区和暂存区状态   |
|           |             `git diff`              |    查看未暂存的改动    |
|           |         `git diff --cached`         |  查看已暂存但未提交的改动  |
|           |          `git add <file>`           |   添加指定文件到暂存区   |
|           |             `git add .`             |   添加所有改动到暂存区   |
|           |        `git commit -m "msg"`        |    提交暂存区内容     |
|           |             `git push`              |     推送到远程      |
|  **分支**   |            `git branch`             |     列出本地分支     |
|           |         `git branch <name>`         |      创建分支      |
|           |        `git checkout <name>`        |      切换分支      |
|           |      `git checkout -b <name>`       |     创建并切换      |
|           |        `git merge <branch>`         |   合并分支到当前分支    |
|           |       `git branch -d <name>`        |     删除本地分支     |
|  **远程**   |           `git remote -v`           |    查看远程仓库地址    |
|           |             `git fetch`             |  拉取远程更新（不合并）   |
|           |             `git pull`              |     拉取并合并      |
|           |     `git push origin <branch>`      |     推送指定分支     |
|           | `git push origin --delete <branch>` |     删除远程分支     |
| **撤销/修复** |             `git stash`             |    暂存未提交改动     |
|           |           `git stash pop`           |    恢复最近一次暂存    |
|           |        `git commit --amend`         |     修改上次提交     |
|           |       `git reset HEAD <file>`       |    从暂存区移除文件    |
|           |      `git checkout -- <file>`       |   丢弃工作区未暂存改动   |
|           |          `git revert HEAD`          |  撤销最近一次提交（安全）  |
|           |            `git reflog`             | 查看所有 HEAD 操作历史 |
|  **日志**   |         `git log --oneline`         |    简洁查看提交历史    |
|           |            `git log -p`             |  查看每次提交的具体改动   |

## 参考资料

<strong style="color: #db8ef7;">[1]</strong> [Git 工作流程](https://www.runoob.com/git/git-workflow.html)
<strong style="color: #db8ef7;">[2]</strong> [Git 从单人开发到多人协作](https://zhuanlan.zhihu.com/p/2033979954317243990)
<strong style="color: #db8ef7;">[3]</strong> [大厂真实 Git 开发工作流程](https://juejin.cn/post/7327863960008392738)
<strong style="color: #db8ef7;">[4]</strong> [大厂git分支管理规范：gitflow规范指南](https://www.cnblogs.com/kevin-ying/p/14329768.html)