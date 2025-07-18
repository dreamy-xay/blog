---
title: 【Python】typing 和 typing_extensions 模块使用指南
date: 2025-05-26 09:48:57
updated: 2025-05-26 09:48:57
tags:
  - typing
  - typing_extensions
  - 编程规范
categories:
  - [Python]
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
abbrlink: 2f05bc66
---

## 前言

Python 的类型提示系统（通过 `typing` 模块实现）允许开发者：

- 提高代码可读性和可维护性；
- 在开发阶段捕获类型错误；
- 支持 IDE 的智能补全和重构；
- 配合静态类型检查工具（如 mypy）。

```python
from typing import Literal

def process_data(data_type: Literal['csv', 'json']) -> None:
    if data_type == 'csv':
        # process csv data
    if data_type == 'json':
        # process json data
    else；
    	# other
        pass
process_data('csv') # 这里调用函数会提示效果只能选csv或者json
```


## **typing** 模块

`typing` 模块是 Python 标准库的一部分，用于支持类型注解。它提供了一组类型提示（type hints），帮助开发者在代码中明确变量、函数参数和返回值的预期类型。这些类型提示不会影响代码的运行时行为，但可以被静态类型检查工具（如 Mypy）用来发现潜在的类型错误，提高代码的可维护性和可读性。

### 基本类型与集合类型

```python
from typing import Any, List, Dict, Tuple, Set, FrozenSet

# 基础类型
name: str = "Alice"
age: int = 25
height: float = 1.75
is_student: bool = True
data: Any = {"anything": "goes"}  # 任意类型

# 集合类型
names: List[str] = ["Alice", "Bob"]
scores: Tuple[int, int, float] = (90, 85, 92.5)
person: Dict[str, Any] = {"name": "Alice", "age": 30}
unique_ids: Set[int] = {101, 102, 103}
constants: FrozenSet[str] = frozenset(["PI", "E"])
```

### 特殊类型与类型操作

```python
from typing import Union, Optional, Literal, Final

# 联合类型
def process_data(data: Union[str, bytes]) -> None:
    ...

# 可选类型 (等价于 Union[T, None])
def find_user(id: int) -> Optional[str]:
    ...

# 字面量类型
def set_direction(direction: Literal["north", "south", "east", "west"]) -> None:
    ...

# 常量标记
MAX_SIZE: Final = 100
MAX_SIZE = 200  # 类型检查器会报错
```

### 函数与可调用对象

```python
from typing import Callable, Generator, Coroutine

# 函数类型
math_operation: Callable[[float, float], float] = lambda x, y: x * y

# 生成器类型
def count_up() -> Generator[int, None, None]:
    n = 0
    while True:
        yield n
        n += 1

# 异步协程
async def fetch_data() -> Coroutine[Any, Any, list[dict]]:
    ...
```

### 类型别名与泛型

```python
from typing import TypeVar, Generic, TypeAlias

# 类型别名
Vector: TypeAlias = list[float]

def scale(scalar: float, vector: Vector) -> Vector:
    return [scalar * num for num in vector]

# 泛型
T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self) -> None:
        self.items: list[T] = []
    
    def push(self, item: T) -> None:
        self.items.append(item)
    
    def pop(self) -> T:
        return self.items.pop()

# 初始化
int_stack = Stack[int]() # int_stack中的变量只能是int类型，其他类型将会报错
int_stack.push(42)

# TypeVar 可以分为有约束类和无约束的情况，无论如何设置，一个泛型在一个函数作用域下只能确定为一种数据类型
T = TypeVar("T", str, int) # 这里是有约束的情况，这里会要求你的泛型类型只能是str或者int
Y = TypeVar("Y") # 这里是无约束类型，这里的Y可以是任何数据类型
def add(a : T, b : T) -> T:
    return a + b

add(1, 2) # 正确，都是int，返回int类型
add("2", "3") # 正确，都是str，返回str类型
add(1, "3") # 错误，正在尝试将两个数据类型不同的数据相加
```

### 高级类型特性

```python
from typing import Protocol, TypedDict, NamedTuple, Annotated

# 协议（结构化类型）
class Flyer(Protocol):
    def fly(self) -> str:
        ...

class Bird:
    def fly(self) -> str:
        return "Flying!"

def takeoff(entity: Flyer) -> None:
    print(entity.fly())

# 类型化字典
class Person(TypedDict):
    name: str
    age: int
    email: Optional[str]

alice: Person = {"name": "Alice", "age": 30}

# 命名元组
class Coordinate(NamedTuple):
    x: float
    y: float
    z: float = 0.0

point = Coordinate(1.0, 2.5)

# 带元数据的类型
UserId = Annotated[int, "Unique identifier for user"]
```


### 函数重载与类成员函数覆写

```python
# overload 函数重载，可以给非成员函数进行重载，使一个函数可以实现多种参数情况的方法
from typing import overload

@overload
def add(a: int, b: int) -> int:
    return a + b

@overload
def add(a: str, b: str) -> str:
    return a + b

add(2,3) # 这样写正确，并且在输入add之后代码会提示选择两者中的哪一个方法

```

```python
# override 类成员函数覆写，python3.12之后或者更高版本支持的，低版本需要去typing_extensions中导入
from typing import override # python >= 3.12
from typing_extensions import override

class Animal:
    def __init__(self, name: str) -> None:
        self.name = name
    
    def speak(self) -> str:
        return ''
    
class Dog(Animal):
    def __init__(self, name: str) -> None:
        super().__init__(name)
    
    @override # 有了这个装饰器，speak机会自动覆盖掉之前的父类同名方法，如果有这个装饰器下的方法在父类中寻找不到就会给出警告    
    def speak(self) -> str:
        return 'wawawa'

# 调用:
d = Dog("小白")
print(d.speak()) # 输出 wawawa， 直接覆盖掉了父类的方法
```

## **typing_extensions** 扩展模块

`typing_extensions` 是一个第三方库，它提供了对 `typing` 模块的扩展和补充。它主要用于向后兼容，为 Python 旧版本提供一些在新版本 `typing` 模块中才有的特性，同时也提供了一些额外的类型注解工具。

### 后向兼容支持

```python
# Python 3.8+ 中 typing 包含这些类型
# 旧版本使用 typing_extensions
from typing_extensions import Literal, Final, TypedDict, Protocol

# 使用方式与 typing 模块相同
```

### 实验性类型特性

```python
from typing_extensions import Self, reveal_type, ParamSpec, Concatenate

# Self 类型 (Python 3.11+)
class Shape:
    def scale(self, factor: float) -> Self:
        self.size *= factor
        return self

# 调试类型
def process(value: int | str) -> None:
    reveal_type(value)  # 类型检查时显示类型

# 参数规范
P = ParamSpec('P')
R = TypeVar('R')

def logger(func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("Calling function")
        return func(*args, **kwargs)
    return wrapper

@logger
def add(a: int, b: int) -> int:
    return a + b
```

## 拓展
`TypeDict` 是一个特殊的类型。可以用来限制某个字典中的键和值的内容，可以搭配使用`Required`，`NotRequired`来约定哪些key-value不是必要的。

```python
from typing import TypeDict
from typing_extensions import Required, NotRequired

class Person(TypeDict):
    name: str # 默认属性是 Required 即必须填写
    age: Required[int] # 显示约定属性是 Required
    email: NotRequired[str] # 显示约定属性是 NotRequired 即非必须填写

# 调用：
my_dict1: Person = {'name':'job', 'age': 18} # 这样写是正确的，在之前这种方式定义之后，这里初始化的时候编辑器会跳出提示，这里email是非必须填写，所以可以不需要填写。
```

```python
# Unpack 解包，可以解包一个可迭代对象比如字典、列表等：
from typing import TypeDict
from typing_extensions import Unpack

class Person(TypeDict):
    name: str
    age: Required[int]

# 调用：
def get_person_infor(*args, **kwargs: Upack[Person]) -> str:
    return f'{kwargs["name"]} is {kwargs["age"]} years old'

my_dict: Person = {'name':'job', 'age': 18}
# 当键入get_person_infor(),放到函数上就会跳出提示：get_person_infor(args: Unknown, name: str, age: int) -> str 这里将Person自动解析了

# 除了这上面的显示解析，还可以使用隐式解析，即使用*
get_person_infor(*my_dict)
```


## 静态类型检查工具 MyPy

MyPy 是一款静态类型检查工具，用于检查 Python 代码中的类型错误，它支持 Python 3.5 及以上版本。

### 安装

通过 pip 安装，在终端或命令行中运行以下命令：

```bash
pip install mypy
```

### 使用

安装完成后，就可以使用 MyPy 来检查 Python 代码了。以下是几种常见的使用方式：

#### 检查单个文件

如果只需要检查一个文件，可以直接指定文件名：

```bash
mypy script.py
```

#### 检查整个目录

若要检查整个目录下的所有 Python 文件，可以指定目录名：

```bash
mypy myproject/
```

这将递归地检查 `myproject` 目录及其子目录中的所有 `.py` 文件。

### 配置

为了更好地适应项目需求，可以通过配置文件或命令行选项来定制 MyPy 的行为。

#### 配置文件

- **创建配置文件**：在项目的根目录下创建一个 `mypy.ini` 文件，例如：

```ini
[mypy]
ignore_missing_imports = True
disallow_untyped_defs = True
```

- **配置选项**：在配置文件中可以设置多种选项，如：
	- `ignore_missing_imports`：忽略缺失的导入模块的类型检查。
	- `disallow_untyped_defs`：禁止未注解类型的函数定义。
	- `strict`：启用严格模式，强制执行更严格的类型检查。

#### 命令行选项

- **指定选项**：也可以在运行 MyPy 时通过命令行选项来指定配置，例如：
```bash
mypy --ignore-missing-imports --disallow-untyped-defs script.py
```

### 忽略类型检查

在某些情况下，可能需要忽略特定的类型检查。以下是几种忽略类型检查的方法：

#### 忽略特定行

如果需要忽略某一行的类型检查，可以在该行末尾添加 `# type: ignore` 注释，例如：

```python
result = some_function()  # type: ignore
```

#### 忽略特定文件

可以在配置文件中指定忽略某些文件或目录的类型检查，例如：

```ini
[mypy]
exclude = myproject/old_code/
```

## 参考资料

- [Python 官方 typing 文档](https://docs.python.org/3/library/typing.html)
- [Mypy 文档](https://mypy.readthedocs.io/)
- [Python Type Hints 指南](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)

