---
title: 【MarkDown】数学公式语法
date: 2025-05-20 07:31:53
updated: 2025-05-20 07:31:53
tags:
  - Katex
  - Latex
categories:
  - Markdown
keywords: 
description: 
top_img: 
comments: true
cover: 
toc: true
toc_number: true
toc_style_simple: false
katex: true
highlight_shrink: false
aside: true
noticeOutdate: false
abbrlink: 2a8b085e
---


## 行内式与行间式

**行内式`$`（复合公式使用`{}`括起来）：** $\sqrt{x+y}$

**行间式`$$`（`\tag`表示公式使用自定义序号）：**
$$
x+y=1 \tag{start}
$$

## 上下标

**上标使用`^`，下标使用`_`（多行公式反斜杠`\\`换行）：**
$$
x^2+y_{n+1}=x^{x_1+y} \\
x^2+y_1=2
$$

## 括号

**函数括号（unicode编码括号）直接使用：**
$$
f(x,y)=x^2+y_2, x\in[1,10], y\in\{1, 2, 3\}
$$
**公式括号（自适应括号）使用`\left`和`\right`表示（如果不想受公式高度影响可以加`.`，比如`\left.`）：**
$$
\left.(\sqrt{1\over2}\right)
$$
**具体括号使用见下表（`{...}`表示公式）：**

|   括号名称   |                             括号                             |         代码         |
| :----------: | :----------------------------------------------------------: | :------------------: |
|    小括号    |                             $()$                             |          ()          |
|    中括号    |                             $[]$                             |          []          |
|    花括号    |                            $\{\}$                            |          {}          |
|    尖括号    | $\langle{}\rangle\rightarrow\langle{1, 2, 3, ..., n}\rangle$ | \langle{...}\rangle  |
| 自适应中括号 | $\left(\right)\rightarrow\left( \frac{x}{ \frac{y + 89z}{78382x +y} } \right)$ | \left(...\right) |
| 自适应花括号 | $\left\{\right\}\rightarrow\left\{ \frac{x}{ \frac{y + 89z}{78382x +y} } \right\}$ | \left\{...\right\} |
|    上括号    |     $\overbrace{}\rightarrow\overbrace{1, 2, 3, ..., n}$     |   \overbrace{...}    |
|    下括号    |    $\underbrace{}\rightarrow\underbrace{1, 2, 3, ..., n}$    |   \underbrace{...}   |

## 省略号

**底端对齐的省略使用`\ldots`：**
$$
1, 2, 3, 4, \ldots, 5
$$
**中线对齐的省略使用`\cdots`：**
$$
1, 2, 3, 4, \cdots, 5
$$
**竖直对齐的省略使用`\vdots`：**
$$
\begin{bmatrix}
{a_{11}}&{a_{12}}&{a_{13}}\\
{a_{21}}&{a_{22}}&{a_{23}}\\
{\vdots}&{\vdots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{a_{m3}}\\
\end{bmatrix}
$$
**斜对齐的省略使用`\cdots`：**
$$
\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}
$$

## 空格

**具体空格使用见下表：**

| 符号名称 |     符号     |  代码  |
| :------: | :----------: | :----: |
| 普通空格 | $A \space B$ | \space |
| 加长空格 | $A \quad B$  | \quad  |
|  长空格  | $A \qquad B$ | \qquad |

## 箭头符号

**具体箭头符号使用见下表：**

|   符号名称   |          符号          |        代码         |
| :----------: | :--------------------: | :-----------------: |
|  向左短箭头  |      $\leftarrow$      |     \leftarrow      |
|  向右短箭头  |     $\rightarrow$      |     \rightarrow     |
|  双向短箭头  |   $\leftrightarrow$    |   \leftrightarrow   |
|  向左长箭头  |    $\longleftarrow$    |   \longleftarrow    |
|  向右长箭头  |   $\longrightarrow$    |   \longrightarrow   |
|  双向长箭头  | $\longleftrightarrow$  | \longleftrightarrow |
| 向左双短箭头 |      $\Leftarrow$      |     \Leftarrow      |
| 向右双短箭头 |     $\Rightarrow$      |     \Rightarrow     |
| 双向双短箭头 |   $\Leftrightarrow$    |   \Leftrightarrow   |
| 向左双长箭头 |    $\Longleftarrow$    |   \Longleftarrow    |
| 向右双长箭头 |   $\Longrightarrow$    |   \Longrightarrow   |
| 双向双长箭头 | $\Longleftrightarrow$ | \Longleftrightarrow |

## 关系符号

**具体关系符号使用见下表（`{...}`表示公式）：**

|     符号名称     |          符号          |          代码          |
| :--------------: | :--------------------: | :--------------------: |
|        加        |          $+$           |           +            |
|        减        |          $-$           |           -            |
| 加减（先加后减） |         $\pm$          |          \pm           |
| 加减（先减后加） |         $\mp$          |          \mp           |
|        乘        |        $\times$        |         \times         |
|    乘（点乘）    |      $x \cdot y$       |         \cdot          |
|    乘（星乘）    |       $x \ast y$       |          \ast          |
|        除        |         $\div$         |          \div          |
|    除（斜除）    |         $x/y$          |           /            |
|       等于       |          $=$           |           =            |
|  不等于（无q）   |         $\ne$          |          \ne           |
|      不等于      |         $\neq$         |          \neq          |
|      约等于      |       $\approx$        |        \approx         |
|      恒等于      |        $\equiv$        |         \equiv         |
|       大于       |          $>$           |           >            |
|       小于       |          $<$           |           <            |
|     大于等于     |         $\ge$          |          \ge           |
|        -         |         $\geq$         |          \geq          |
|     小于等于     |         $\le$          |          \le           |
|        -         |         $\leq$         |          \leq          |
|      远大于      |         $\gg$          |          \gg           |
|      远小于      |         $\ll$          |          \ll           |
|    不大于等于    |        $\ngeq$         |         \ngeq          |
|        -         |       $\not\ge$        |        \not\ge         |
|        -         |       $\not\geq$       |        \not\geq        |
|    不小于等于    |        $\nleq$         |         \nleq          |
|        -         |       $\not\le$        |        \not\le         |
|        -         |       $\not\leq$       |        \not\leq        |
|       相似       |        $\sim$         |          \sim          |
|      正比于      |       $\propto$        |        \propto         |
|       垂直       |        $\perp$        |         \perp          |
|       弧度       | $\overset{\frown}{AB}$ | \overset{\frown} {...} |
|      上划线      |   $\overline{ABC}$    |     \overline{...}     |
|      绝对值      |        $|x+y|$         |          \|\|          |
|      平行线      |      $\parallel$       |       \parallel        |
|       单线       |         $\mid$         |          \mid          |

## 集合符号

**具体集合符号使用见下表：**

|    符号名称    |      符号       |     代码      |
| :------------: | :-------------: | :-----------: |
|      属于      |      $\in$      |      \in      |
|     不属于     |    $\notin$     |    \notin     |
|       -        |    $\not\in$    |    \not\in    |
|   子集（左）   |    $\subset$    |    \subset    |
|   子集（右）   |    $\supset$    |    \supset    |
|  真子集（左）  |   $\subseteq$   |   \subseteq   |
|  真子集（右）  |   $\supseteq$   |   \supseteq   |
|  非子集（左）  |  $\not\subset$  |  \not\subset  |
|  非子集（右）  |  $\not\supset$  |  \not\supset  |
| 非真子集（左） | $\not\subseteq$ | \not\subseteq |
|       -        |  $\subsetneq$   |  \subsetneq   |
| 非真子集（右） | $\not\supseteq$ | \not\supseteq |
|       -        |  $\supsetneq$   |  \supsetneq   |
|      交集      |     $\cap$      |     \cap      |
|      并集      |     $\cup$      |     \cup      |
|      差集      |   $\setminus$   |   \setminus   |
|      同或      |   $\bigodot$    |   \bigodot    |
|      同与      |  $\bigotimes$   |  \bigotimes   |
|    实数集合    |  $\mathbb{R}$   |  \mathbb{R}   |
|   自然数集合   |  $\mathbb{Z}$   |  \mathbb{Z}   |
|      空集      |   $\emptyset$   |   \emptyset   |

## 矢量符号

**具体矢量符号使用见下表（`{...}`表示公式）：**

|  符号名称  |                             符号                             |         代码         |
| :--------: | :----------------------------------------------------------: | :------------------: |
| 单符号矢量 |              $\vec{}\space\rightarrow\vec{ab}$               |      \vec{...}       |
| 多符号矢量 | $\overrightarrow{}\space\rightarrow\overrightarrow{abcdefghijk}$ | \overrightarrow{...} |

## 三角形符号

**具体三角形符号使用见下表（`{...}`表示公式）：**

| 符号名称 |              符号              |  代码  |
| :------: | :----------------------------: | :----: |
|   夹角   | $\angle\rightarrow\angle{ABC}$ | \angle |
|   角度   |  $^\circ\rightarrow60^\circ$   | ^\circ |
|   分度   |       $'\rightarrow59'$        |   '    |

## 希腊字母

**希腊字母使用如下（共24个）：**

|  希腊字母  |   代码   |      是否可变      |  希腊字母  |   代码   |     是否可变     |
| :--------: | :------: | :----------------: | :--------: | :------: | :--------------: |
|  $\alpha$  |  \alpha  |                    |  $\beta$   |  \beta   |                  |
|  $\gamma$  |  \gamma  |                    |  $\delta$  |  \delta  |                  |
| $\epsilon$ | \epsilon | **$\epsilon$可变** |  $\zeta$   |  \zeta   |                  |
|   $\eta$   |   \eta   |                    |  $\theta$  |  \theta  | **$\theta$可变** |
|  $\iota$   |  \iota   |                    |  $\kappa$  |  \kappa  | **$\kappa$可变** |
| $\lambda$  | \lambda  |                    |   $\mu$    |   \mu    |                  |
|   $\nu$    |   \nu    |                    |   $\xi$    |   \xi    |                  |
| $\omicron$ | \omicron |                    |   $\pi$    |   \pi    |  **$\pi$可变**   |
|   $\rho$   |   \rho   |   **$\rho$可变**   |  $\sigma$  |  \sigma  | **$\sigma$可变** |
|   $\tau$   |   \tau   |                    | $\upsilon$ | \upsilon |                  |
|   $\phi$   |   \phi   |   **$\phi$可变**   |   $\chi$   |   \chi   |                  |
|   $\psi$   |   \psi   |                    |  $\omega$  |  \omega  |                  |

**其中前面以`var`开头的为变体写法，LaTeX中可以变体的希腊字母在上表中有标出，有以下七个：**

| 希腊字母原型 |   代码   | 希腊字母变体  |    代码     |
| :----------: | :------: | :-----------: | :---------: |
|  $\epsilon$  | \epsilon | $\varepsilon$ | \varepsilon |
|   $\theta$   |  \theta  |  $\vartheta$  |  \vartheta  |
|   $\kappa$   |  \kappa  |  $\varkappa$  |  \varkappa  |
|    $\pi$     |   \pi    |   $\varpi$    |   \varpi    |
|    $\rho$    |   \rho   |   $\varrho$   |   \varrho   |
|   $\sigma$   |  \sigma  |  $\varsigma$  |  \varsigma  |
|    $\phi$    |   \phi   |   $\varphi$   |   \varphi   |

**大写希腊字母只要将第一个字母大写即可：**

| 大写希腊字母 |   代码   | 大写希腊字母 |   代码   |
| :----------: | :------: | :----------: | :------: |
|   $\Alpha$   |  \Alpha  |   $\Beta$    |  \Beta   |
|   $\Gamma$   |  \Gamma  |   $\Delta$   |  \Delta  |
|  $\Epsilon$  | \Epsilon |   $\Zeta$    |  \Zeta   |
|    $\Eta$    |   \Eta   |   $\Theta$   |  \Theta  |
|   $\Iota$    |  \Iota   |   $\Kappa$   |  \Kappa  |
|  $\Lambda$   | \Lambda  |    $\Mu$     |   \Mu    |
|    $\Nu$     |   \Nu    |    $\Xi$     |   \Xi    |
|  $\Omicron$  | \Omicron |    $\Pi$     |   \Pi    |
|    $\Rho$    |   \Rho   |   $\Sigma$   |  \Sigma  |
|    $\Tau$    |   \Tau   |  $\Upsilon$  | \Upsilon |
|    $\Phi$    |   \Phi   |    $\Chi$    |   \Chi   |
|    $\Psi$    |   \Psi   |   $\Omega$   |  \Omega  |

**变体的大写字母和大写字母写法一样，但是变成了斜体，LaTeX中可以变体且能大写的只有四个，如下：**

| 大写希腊字母原型 |  代码  | 大写希腊字母变体（斜体） |   代码    |
| :--------------: | :----: | :----------------------: | :-------: |
|     $\Theta$     | \Theta |       $\varTheta$        | \varTheta |
|      $\Pi$       |  \Pi   |         $\varPi$         |  \varPi   |
|     $\Sigma$     | \Sigma |       $\varSigma$        | \varSigma |
|      $\Phi$      |  \Phi  |        $\varPhi$         |  \varPhi  |

## 数学符号

**具体数学符号使用见下表：**

| 符号名称 |   符号   |  代码  |
| :------: | :------: | :----: |
|   无穷   | $\infty$ | \infty |
|   虚数   | $\imath$ | \imath |
|   实数   | $\jmath$ | \jmath |

## 注音和标注符号

**具体注音和标注符号使用见下表（`{...}`表示公式）：**

|           符号名称           |      |            符号             |         代码          |
| :--------------------------: | ---- | :-------------------------: | :-------------------: |
|   条（平均值，拼音第一声）   |      |          $\bar{a}$          |       \bar{...}       |
|           帽子符号           |      |          $\hat{a}$          |       \hat{...}       |
|   加宽帽子符号（线性回归）   |      |        $\widehat{a}$        |     \widehat{...}     |
|      检查（拼音第三声）      |      |         $\check{a}$         |      \check{...}      |
|     急性的（拼音第二声）     |      |         $\acute{a}$         |      \acute{...}      |
| 极慢的，沉重的（拼音第四声） |      |         $\grave{a}$         |      \grave{...}      |
|           颚化符号           |      |         $\tilde{a}$         |      \tilde{...}      |
|         加宽颚化符号         |      |       $\widetilde{a}$       |    \widetilde{...}    |
|           短音符号           |      |         $\breve{a}$         |      \breve{...}      |
|           数学圆环           |      |       $\mathring{a}$        |    \mathring{...}     |
|     一个点（等价无穷小）     |      |          $\dot{a}$          |       \dot{...}       |
|       两个点（一阶导）       |      |         $\ddot{a}$          |      \ddot{...}       |
|            三个点            |      |         $\dddot{a}$         |       \dddot{.}       |
|             向量             |      |          $\vec{a}$          |       \vec{...}       |
|            上划线            |      |    $\overline{ABCDEFG}$     |    \overline{...}     |
|            下划线            |      |    $\underline{ABCDEFG}$    |    \underline{...}    |
|           左上箭头           |      |  $\overleftarrow{ABCDEFG}$  |  \overleftarrow{...}  |
|           右上箭头           |      | $\overrightarrow{ABCDEFG}$  | \overrightarrow{...}  |
|           左下箭头           |      | $\underleftarrow{ABCDEFG}$  | \underleftarrow{...}  |
|           右下箭头           |      | $\underrightarrow{ABCDEFG}$ | \underrightarrow{...} |

## 分数

**分数使用`\frac`，表现形式为`\frac{a}{b}`（其中`a`为分子，`b`为分母）：**
$$
\frac{1-x}{y+1}
$$
**分数也可以使用`\over`，表现形式为`a \over b`（其中`a`为分子，`b`为分母）：**
$$
x \over {x+1}
$$

**分数还可以使用`\cfrac`实现，表现形式为`\cfrac{a}{b}`（其中`a`为分子，`b`为分母，是大号公式）** 
$$
\cfrac{1-x}{y+1}
$$

## 根式

**根式使用`\sqrt`，表现形式为`\sqrt[a]{b}`（其中a表示为开方的次数，默认不填写`[a]`表示开平方，`b`表示需要开方的公式）：**
$$
\sqrt[y_1+5]{x+56}
$$

## 对数

**具体对数使用见下表（`{a}`表示对数底数公式，`{b}`表示对数的单项公式）：**

|    符号名称    |     符号     |    代码     |
| :------------: | :----------: | :---------: |
|  任意底数对数  | $\log_5{xy}$ | \log_{a}{b} |
| 以10为底的对数 | $\lg{8791}$  |   \lg{b}    |
| 以e为底的对数  |  $\ln{y^2}$  |   \ln{b}    |

## 因果

**具体因果关系使用见下表：**

| 符号名称 |     符号     |    代码    |
| :------: | :----------: | :--------: |
|   因为   |  $\because$  |  \because  |
|   所以   | $\therefore$ | \therefore |

## 极限

**极限使用`\lim`实现，表现形式为`\lim_{a \rightarrow +\infty} b`（其中`a`为公式`b`的变量，`b`为含变量`a`的公式）：**
$$
\lim_{x \rightarrow +\infty} \frac{x + 1}{1-x^2}
$$

## 求和与累积

**求和使用`\sum`实现，表现形式为`\sum_{a}^{b}{c}`（其中`a`表示求和的初始条件既下标，`b`表示求和的最终条件既上标，`c`表示求和的单项公式）：**
$$
\sum_{i=1}^{n}{a_i}
$$
**累积使用`\prod`实现，表现形式为`\prod_{a}^{b}{c}`（其中`a`表示累积的初始条件既下标，`b`表示累积的最终条件既上标，`c`表示累积的单项公式）：**
$$
\prod_{i=1}^{n}{a_i+b_i}
$$

## 求导

**求导使用 `\prime`实现：**
$$
y \prime = nx^{n-1}
$$

## 微积分

**积分使用`\int`实现，表现形式为`\int_{a}^{b}{c}dx`（其中`a`表示积分的下限既下标，`b`表示积分的上限既上标，`c`表示积分的单项公式）：**
$$
\int_{0}^{+\infty}{\frac{9x+x^3-cos(x^2)}{\sqrt[5]{x^{x+2}+sin(x)}}}dx
$$

**具体微积分使用见下表：**

|     符号名称     |                             符号                             |    代码    |
| :--------------: | :----------------------------------------------------------: | :--------: |
|     二重积分     |                           $\iint$                            |   \iint    |
|     三重积分     |                           $\iiint$                           |   \iiint   |
|     四重积分     |                          $\iiiint$                           |  \iiiint   |
| 曲线（曲面）积分 |                           $\oint$                            |   \oint    |
|       偏导       |      $\partial\rightarrow{\partial{x}\over\partial{y}}$      |  \partial  |
|       微分       |                         $\mathrm{d}$                         | \mathrm{d} |
|     矢量微分     | $\nabla\rightarrow\nabla=\frac{\partial}{\partial{x}}I+\frac{\partial}{\partial{y}}J+\frac{\partial}{\partial{z}}K$ |   \nabla   |

## 矩阵

**用`\begin{matrix}`标志矩阵环境的开始，用`\end{matrix}`标志矩阵环境的结束，每一行末尾标记`\\`换行，行间元素之间以`&`分隔（表示对齐）：**
$$
\begin{matrix}
1&0&0\\
0&1&0\\
0&0&1\\
\end{matrix}
$$
**对于矩阵来说，不同的边框使用不同的标记词，具体如下表：**

| 起始和结束标记处替换词名称 |                          效果                           | 起始和结束标记处替换词 |
| :------------------------: | :-----------------------------------------------------: | :--------------------: |
|                            |                                                         |                        |
|         小括号边框         | $\begin{pmatrix} 1&0&0\\ 0&1&0\\ 0&0&1\\ \end{pmatrix}$ |        pmatrix         |
|                            |                                                         |                        |
|         中括号边框         | $\begin{bmatrix} 1&0&0\\ 0&1&0\\ 0&0&1\\ \end{bmatrix}$ |        bmatrix         |
|                            |                                                         |                        |
|         大括号边框         | $\begin{Bmatrix} 1&0&0\\ 0&1&0\\ 0&0&1\\ \end{Bmatrix}$ |        Bmatrix         |
|                            |                                                         |                        |
|         单竖线边框         | $\begin{vmatrix} 1&0&0\\ 0&1&0\\ 0&0&1\\ \end{vmatrix}$ |        vmatrix         |
|                            |                                                         |                        |
|         双竖线边框         | $\begin{Vmatrix} 1&0&0\\ 0&1&0\\ 0&0&1\\ \end{Vmatrix}$ |        Vmatrix         |

## 方程组

**对于方程组（分段函数），通常使用 case 环境来处理，起始`\begin{cases}`标志开始，以`\end{cases}`声明环境使用结束：**
$$
\begin{cases}
a_1x+b_1y+c_1z=d_1\\
a_2x+b_2y+c_2z=d_2\\
a_3x+b_3y+c_3z=d_3\\
\end{cases}
$$

## 长公式布局

**如果不需要对齐，对于长公式可以使用`multline`环境来处理：**
$$
\begin{multline}
x=a+b+c+{}\\
d+e+f
\end{multline}
$$
**如果需要对齐，则可以使用`split`环境来进行拆分：**
$$
\begin{split}
x= &a+b+c+{}\\
&d+e+f
\end{split}
$$

## 公式组布局

**对于不需要对齐的公式组可以使用`gather`环境来处理：**
$$
\begin{gather}
x= &a+b+c\\
y= &d+e+f
\end{gather}
$$
**如果需要对齐，那么可以使用`align`环境来进行处理：**
$$
\begin{align}
x= &a+b+c\\
y= &d+e+f
\end{align}
$$

## 数学字体

**`数学黑体`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathbf{A} | $\mathbf{A}$ | \mathbf{J} | $\mathbf{J}$ | \mathbf{S} | $\mathbf{S}$ |
| \mathbf{B} | $\mathbf{B}$ | \mathbf{K} | $\mathbf{K}$ | \mathbf{T} | $\mathbf{T}$ |
| \mathbf{C} | $\mathbf{C}$ | \mathbf{L} | $\mathbf{L}$ | \mathbf{U} | $\mathbf{U}$ |
| \mathbf{D} | $\mathbf{D}$ | \mathbf{M} | $\mathbf{M}$ | \mathbf{V} | $\mathbf{V}$ |
| \mathbf{E} | $\mathbf{E}$ | \mathbf{N} | $\mathbf{N}$ | \mathbf{W} | $\mathbf{W}$ |
| \mathbf{F} | $\mathbf{F}$ | \mathbf{O} | $\mathbf{O}$ | \mathbf{X} | $\mathbf{X}$ |
| \mathbf{G} | $\mathbf{G}$ | \mathbf{P} | $\mathbf{P}$ | \mathbf{Y} | $\mathbf{Y}$ |
| \mathbf{H} | $\mathbf{H}$ | \mathbf{Q} | $\mathbf{Q}$ | \mathbf{Z} | $\mathbf{Z}$ |
| \mathbf{I} | $\mathbf{I}$ | \mathbf{R} | $\mathbf{R}$ |            |              |

**`数学罗马体`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathrm{A} | $\mathrm{A}$ | \mathrm{J} | $\mathrm{J}$ | \mathrm{S} | $\mathrm{S}$ |
| \mathrm{B} | $\mathrm{B}$ | \mathrm{K} | $\mathrm{K}$ | \mathrm{T} | $\mathrm{T}$ |
| \mathrm{C} | $\mathrm{C}$ | \mathrm{L} | $\mathrm{L}$ | \mathrm{U} | $\mathrm{U}$ |
| \mathrm{D} | $\mathrm{D}$ | \mathrm{M} | $\mathrm{M}$ | \mathrm{V} | $\mathrm{V}$ |
| \mathrm{E} | $\mathrm{E}$ | \mathrm{N} | $\mathrm{N}$ | \mathrm{W} | $\mathrm{W}$ |
| \mathrm{F} | $\mathrm{F}$ | \mathrm{O} | $\mathrm{O}$ | \mathrm{X} | $\mathrm{X}$ |
| \mathrm{G} | $\mathrm{G}$ | \mathrm{P} | $\mathrm{P}$ | \mathrm{Y} | $\mathrm{Y}$ |
| \mathrm{H} | $\mathrm{H}$ | \mathrm{Q} | $\mathrm{Q}$ | \mathrm{Z} | $\mathrm{Z}$ |
| \mathrm{I} | $\mathrm{I}$ | \mathrm{R} | $\mathrm{R}$ |            |              |

**`数学斜体`如下表：**


|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathit{A} | $\mathit{A}$ | \mathit{J} | $\mathit{J}$ | \mathit{S} | $\mathit{S}$ |
| \mathit{B} | $\mathit{B}$ | \mathit{K} | $\mathit{K}$ | \mathit{T} | $\mathit{T}$ |
| \mathit{C} | $\mathit{C}$ | \mathit{L} | $\mathit{L}$ | \mathit{U} | $\mathit{U}$ |
| \mathit{D} | $\mathit{D}$ | \mathit{M} | $\mathit{M}$ | \mathit{V} | $\mathit{V}$ |
| \mathit{E} | $\mathit{E}$ | \mathit{N} | $\mathit{N}$ | \mathit{W} | $\mathit{W}$ |
| \mathit{F} | $\mathit{F}$ | \mathit{O} | $\mathit{O}$ | \mathit{X} | $\mathit{X}$ |
| \mathit{G} | $\mathit{G}$ | \mathit{P} | $\mathit{P}$ | \mathit{Y} | $\mathit{Y}$ |
| \mathit{H} | $\mathit{H}$ | \mathit{Q} | $\mathit{Q}$ | \mathit{Z} | $\mathit{Z}$ |
| \mathit{I} | $\mathit{I}$ | \mathit{R} | $\mathit{R}$ |            |              |

**`数学打印机字体`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathtt{A} | $\mathtt{A}$ | \mathtt{J} | $\mathtt{J}$ | \mathtt{S} | $\mathtt{S}$ |
| \mathtt{B} | $\mathtt{B}$ | \mathtt{K} | $\mathtt{K}$ | \mathtt{T} | $\mathtt{T}$ |
| \mathtt{C} | $\mathtt{C}$ | \mathtt{L} | $\mathtt{L}$ | \mathtt{U} | $\mathtt{U}$ |
| \mathtt{D} | $\mathtt{D}$ | \mathtt{M} | $\mathtt{M}$ | \mathtt{V} | $\mathtt{V}$ |
| \mathtt{E} | $\mathtt{E}$ | \mathtt{N} | $\mathtt{N}$ | \mathtt{W} | $\mathtt{W}$ |
| \mathtt{F} | $\mathtt{F}$ | \mathtt{O} | $\mathtt{O}$ | \mathtt{X} | $\mathtt{X}$ |
| \mathtt{G} | $\mathtt{G}$ | \mathtt{P} | $\mathtt{P}$ | \mathtt{Y} | $\mathtt{Y}$ |
| \mathtt{H} | $\mathtt{H}$ | \mathtt{Q} | $\mathtt{Q}$ | \mathtt{Z} | $\mathtt{Z}$ |
| \mathtt{I} | $\mathtt{I}$ | \mathtt{R} | $\mathtt{R}$ |            |              |

**`Blackboard Bold alphabet font`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathbb{A} | $\mathbb{A}$ | \mathbb{J} | $\mathbb{J}$ | \mathbb{S} | $\mathbb{S}$ |
| \mathbb{B} | $\mathbb{B}$ | \mathbb{K} | $\mathbb{K}$ | \mathbb{T} | $\mathbb{T}$ |
| \mathbb{C} | $\mathbb{C}$ | \mathbb{L} | $\mathbb{L}$ | \mathbb{U} | $\mathbb{U}$ |
| \mathbb{D} | $\mathbb{D}$ | \mathbb{M} | $\mathbb{M}$ | \mathbb{V} | $\mathbb{V}$ |
| \mathbb{E} | $\mathbb{E}$ | \mathbb{N} | $\mathbb{N}$ | \mathbb{W} | $\mathbb{W}$ |
| \mathbb{F} | $\mathbb{F}$ | \mathbb{O} | $\mathbb{O}$ | \mathbb{X} | $\mathbb{X}$ |
| \mathbb{G} | $\mathbb{G}$ | \mathbb{P} | $\mathbb{P}$ | \mathbb{Y} | $\mathbb{Y}$ |
| \mathbb{H} | $\mathbb{H}$ | \mathbb{Q} | $\mathbb{Q}$ | \mathbb{Z} | $\mathbb{Z}$ |
| \mathbb{I} | $\mathbb{I}$ | \mathbb{R} | $\mathbb{R}$ |            |              |

**`Euler script font`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathscr{A} | $\mathscr{A}$ | \mathscr{J} | $\mathscr{J}$ | \mathscr{S} | $\mathscr{S}$ |
| \mathscr{B} | $\mathscr{B}$ | \mathscr{K} | $\mathscr{K}$ | \mathscr{T} | $\mathscr{T}$ |
| \mathscr{C} | $\mathscr{C}$ | \mathscr{L} | $\mathscr{L}$ | \mathscr{U} | $\mathscr{U}$ |
| \mathscr{D} | $\mathscr{D}$ | \mathscr{M} | $\mathscr{M}$ | \mathscr{V} | $\mathscr{V}$ |
| \mathscr{E} | $\mathscr{E}$ | \mathscr{N} | $\mathscr{N}$ | \mathscr{W} | $\mathscr{W}$ |
| \mathscr{F} | $\mathscr{F}$ | \mathscr{O} | $\mathscr{O}$ | \mathscr{X} | $\mathscr{X}$ |
| \mathscr{G} | $\mathscr{G}$ | \mathscr{P} | $\mathscr{P}$ | \mathscr{Y} | $\mathscr{Y}$ |
| \mathscr{H} | $\mathscr{H}$ | \mathscr{Q} | $\mathscr{Q}$ | \mathscr{Z} | $\mathscr{Z}$ |
| \mathscr{I} | $\mathscr{I}$ | \mathscr{R} | $\mathscr{R}$ |            |              |

**`the Computer Modern calligraphy font`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathcal{A} | $\mathcal{A}$ | \mathcal{J} | $\mathcal{J}$ | \mathcal{S} | $\mathcal{S}$ |
| \mathcal{B} | $\mathcal{B}$ | \mathcal{K} | $\mathcal{K}$ | \mathcal{T} | $\mathcal{T}$ |
| \mathcal{C} | $\mathcal{C}$ | \mathcal{L} | $\mathcal{L}$ | \mathcal{U} | $\mathcal{U}$ |
| \mathcal{D} | $\mathcal{D}$ | \mathcal{M} | $\mathcal{M}$ | \mathcal{V} | $\mathcal{V}$ |
| \mathcal{E} | $\mathcal{E}$ | \mathcal{N} | $\mathcal{N}$ | \mathcal{W} | $\mathcal{W}$ |
| \mathcal{F} | $\mathcal{F}$ | \mathcal{O} | $\mathcal{O}$ | \mathcal{X} | $\mathcal{X}$ |
| \mathcal{G} | $\mathcal{G}$ | \mathcal{P} | $\mathcal{P}$ | \mathcal{Y} | $\mathcal{Y}$ |
| \mathcal{H} | $\mathcal{H}$ | \mathcal{Q} | $\mathcal{Q}$ | \mathcal{Z} | $\mathcal{Z}$ |
| \mathcal{I} | $\mathcal{I}$ | \mathcal{R} | $\mathcal{R}$ |            |              |

**`Euler Fraktur alphabet font`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathfrak{A} | $\mathfrak{A}$ | \mathfrak{J} | $\mathfrak{J}$ | \mathfrak{S} | $\mathfrak{S}$ |
| \mathfrak{B} | $\mathfrak{B}$ | \mathfrak{K} | $\mathfrak{K}$ | \mathfrak{T} | $\mathfrak{T}$ |
| \mathfrak{C} | $\mathfrak{C}$ | \mathfrak{L} | $\mathfrak{L}$ | \mathfrak{U} | $\mathfrak{U}$ |
| \mathfrak{D} | $\mathfrak{D}$ | \mathfrak{M} | $\mathfrak{M}$ | \mathfrak{V} | $\mathfrak{V}$ |
| \mathfrak{E} | $\mathfrak{E}$ | \mathfrak{N} | $\mathfrak{N}$ | \mathfrak{W} | $\mathfrak{W}$ |
| \mathfrak{F} | $\mathfrak{F}$ | \mathfrak{O} | $\mathfrak{O}$ | \mathfrak{X} | $\mathfrak{X}$ |
| \mathfrak{G} | $\mathfrak{G}$ | \mathfrak{P} | $\mathfrak{P}$ | \mathfrak{Y} | $\mathfrak{Y}$ |
| \mathfrak{H} | $\mathfrak{H}$ | \mathfrak{Q} | $\mathfrak{Q}$ | \mathfrak{Z} | $\mathfrak{Z}$ |
| \mathfrak{I} | $\mathfrak{I}$ | \mathfrak{R} | $\mathfrak{R}$ |            |              |

**`Shadow Fiend font`如下表：**

|    代码    |   实现效果   |    代码    |   实现效果   |    代码    |   实现效果   |
| :--------: | :----------: | :--------: | :----------: | :--------: | :----------: |
| \mathsf{A} | $\mathsf{A}$ | \mathsf{J} | $\mathsf{J}$ | \mathsf{S} | $\mathsf{S}$ |
| \mathsf{B} | $\mathsf{B}$ | \mathsf{K} | $\mathsf{K}$ | \mathsf{T} | $\mathsf{T}$ |
| \mathsf{C} | $\mathsf{C}$ | \mathsf{L} | $\mathsf{L}$ | \mathsf{U} | $\mathsf{U}$ |
| \mathsf{D} | $\mathsf{D}$ | \mathsf{M} | $\mathsf{M}$ | \mathsf{V} | $\mathsf{V}$ |
| \mathsf{E} | $\mathsf{E}$ | \mathsf{N} | $\mathsf{N}$ | \mathsf{W} | $\mathsf{W}$ |
| \mathsf{F} | $\mathsf{F}$ | \mathsf{O} | $\mathsf{O}$ | \mathsf{X} | $\mathsf{X}$ |
| \mathsf{G} | $\mathsf{G}$ | \mathsf{P} | $\mathsf{P}$ | \mathsf{Y} | $\mathsf{Y}$ |
| \mathsf{H} | $\mathsf{H}$ | \mathsf{Q} | $\mathsf{Q}$ | \mathsf{Z} | $\mathsf{Z}$ |
| \mathsf{I} | $\mathsf{I}$ | \mathsf{R} | $\mathsf{R}$ |            |              |

**字体大小设置如下表：**

| 字体大小 |       预览       |       代码       |
| :------: | :--------------: | :--------------: |
|   极小   |    $\tiny{A}$    |    \tiny{...}    |
| 脚本大小 | $\scriptsize{A}$ | \scriptsize{...} |
|    小    |   $\small{A}$    |   \small{...}    |
| 正常大小 | $\normalsize{A}$ | \normalsize{...} |
|    大    |   $\large{A}$    |   \large{...}    |
|   更大   |   $\Large{A}$    |   \Large{...}    |
|   极大   |   $\LARGE{A}$    |   \LARGE{...}    |
|   超大   |    $\huge{A}$    |    \huge{..}     |
|  超级大  |    $\Huge{A}$    |    \Huge{...}    |

