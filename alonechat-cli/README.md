# AloneChat CLI

国产化、终端原生、深度中文优化的AI编程Agent

## 核心特性

- 🔒 **隐私保护**：用户代码完全本地化，不经过云端
- 🚀 **本地优先**：所有核心功能本地运行
- 🌐 **离线支持**：支持本地模型，完全离线可用
- 🇨🇳 **中文优化**：深度中文理解，准确率>92%
- 💰 **成本优势**：无云服务费用，仅API调用成本

## 安装

```bash
pip install alonechat
```

## 快速开始

```bash
# 初始化配置
alonechat init

# 启动交互式对话
alonechat chat

# 生成代码
alonechat generate

# 智能提交
alonechat commit

# 自动测试
alonechat test
```

## 配置

配置文件位于 `.alonechatrc`，支持：

- 多模型配置（DeepSeek、Qwen、混元、GLM、Ollama）
- API密钥加密存储
- 上下文窗口设置
- 隐私保护设置

## 支持的模型

### API模型（推荐）
- **DeepSeek V3**：国产优秀模型，推荐使用
- **Qwen 2.5 Max**：通义千问
- **腾讯混元**：腾讯云大模型
- **智谱GLM**：智谱AI大模型

### 本地模型（完全离线）
- **Ollama**：支持多种开源模型
- **llama.cpp**：高性能本地推理

## 数据流设计

### API调用模式（推荐）

```
用户代码 (本地) 
    ↓
Prompt构建 (本地)
    ↓
API调用 (仅发送Prompt，不含代码)
    ↓
代码生成 (本地)
```

**关键点**：
- ✅ 用户代码永远留在本地
- ✅ 只发送Prompt到API
- ✅ 完全隐私保护

### 本地模型模式（完全离线）

```
用户代码 (本地)
    ↓
Prompt构建 (本地)
    ↓
本地模型推理 (本地)
    ↓
代码生成 (本地)
```

## 开发

```bash
# 安装开发依赖
pip install -e ".[dev]"

# 运行测试
pytest

# 代码格式化
black src/

# 类型检查
mypy src/
```

## 许可证

MIT License
