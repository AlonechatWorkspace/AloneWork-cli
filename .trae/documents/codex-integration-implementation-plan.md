# Codex Fork 深度改造 - 完整实施计划

## 一、项目现状分析

### 1.1 Codex Rust 代码库架构

克隆的 Codex 仓库位于 `codex-rust-v0.134.0-alpha.3/`，是一个 Rust 工作空间，包含 **100+ crate**：

| 模块 | Crate 名 | 职责 |
|------|----------|------|
| **模型提供者** | `model-provider`, `model-provider-info` | LLM 后端抽象，定义 `ModelProvider` trait |
| **编码模式** | `code-mode` | 代码执行模式，shell 命令运行 |
| **核心引擎** | `core` | 会话管理、上下文编排、工具执行 |
| **CLI 入口** | `cli` | 命令行入口，子命令分发 |
| **TUI** | `tui` | 终端交互界面 (ratatui) |
| **工具系统** | `tools` | 工具定义、发现、执行 |
| **MCP** | `codex-mcp`, `mcp-server` | Model Context Protocol 支持 |
| **本地模型** | `ollama`, `lmstudio` | 本地模型适配器 |
| **沙箱** | `sandboxing`, `linux-sandbox` | 安全沙箱执行 |
| **配置** | `config` | TOML 配置管理 |
| **协议** | `protocol`, `app-server-protocol` | API 协议定义 |
| **App Server** | `app-server` | WebSocket/Stdio 服务 |

### 1.2 关键发现

**Wire API 变更**：Codex v0.134.0 已移除 Chat Completions API 支持，仅保留 Responses API (`wire_api = "responses"`)。这意味着：
- DeepSeek V4 使用 Chat Completions API → **不能直接对接 Codex**
- 需要恢复 `wire_api = "chat"` 支持，或构建 API 代理

**自定义 Provider 机制**：Codex 已支持通过 `config.toml` 定义自定义 provider：
```toml
[model_providers.deepseek]
name = "DeepSeek"
base_url = "https://api.deepseek.com/v1"
env_key = "DEEPSEEK_API_KEY"
wire_api = "responses"  # 需要 Responses API 兼容
```

**AloneChat Agent 框架**：Python 实现，已有 `BaseLLM`、`CodeAgent`、`MTCAgent` 等基础组件。

---

## 二、实施路线图

### 阶段 1：环境搭建与编译验证（第 1-2 天）

#### 步骤 1.1：编译 Codex Rust 二进制
```bash
cd codex-rust-v0.134.0-alpha.3/codex-rs
cargo build --release -p codex-cli
```

#### 步骤 1.2：验证基本功能
```bash
# 测试 CLI 启动
./target/release/codex --version
./target/release/codex --help
```

#### 步骤 1.3：确认 Windows 兼容性
- Codex 已有 `windows-sandbox-rs` 模块
- 需要验证 Windows 上的沙箱和文件系统行为
- 测试 `codex exec` 和 `codex app-server` 在 Windows 上的运行

---

### 阶段 2：恢复 Chat Completions API 支持（第 3-7 天）

**目标**：让 Codex 支持 DeepSeek 等仅提供 Chat Completions API 的模型。

#### 步骤 2.1：在 `model-provider-info` 中添加 Chat WireApi

**修改文件**: `codex-rs/model-provider-info/src/lib.rs`

```rust
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum WireApi {
    /// The Responses API exposed by OpenAI at `/v1/responses`.
    #[default]
    Responses,
    /// The Chat Completions API at `/v1/chat/completions`.
    Chat,
}
```

#### 步骤 2.2：实现 Chat Completions 适配器

**新建文件**: `codex-rs/chat-completions-adapter/src/lib.rs`

核心职责：
- 将 Codex 内部的 Responses API 请求格式转换为 Chat Completions 格式
- 将 Chat Completions 流式响应转换为 Responses API 事件流
- 处理工具调用格式差异（function_call vs tool_calls）
- 处理 reasoning/thinking 字段差异

#### 步骤 2.3：在 API Client 中注册 Chat 适配路径

**修改文件**: `codex-rs/api/src/lib.rs` 或相关文件

根据 `WireApi::Chat` 选择不同的请求/响应处理路径。

#### 步骤 2.4：添加 DeepSeek 内置 Provider

**修改文件**: `codex-rs/model-provider-info/src/lib.rs`

```rust
pub const DEEPSEEK_PROVIDER_ID: &str = "deepseek";
const DEEPSEEK_PROVIDER_NAME: &str = "DeepSeek";

pub fn deepseek_provider() -> ModelProviderInfo {
    ModelProviderInfo {
        name: DEEPSEEK_PROVIDER_NAME.to_string(),
        base_url: Some("https://api.deepseek.com/v1".to_string()),
        env_key: Some("DEEPSEEK_API_KEY".to_string()),
        wire_api: WireApi::Chat,
        ..Default::default()
    }
}
```

---

### 阶段 3：Python CodexBridge 构建（第 8-14 天）

#### 步骤 3.1：创建 CodexBridge 模块

**新建文件**: `agent-framework/agent_framework/code/codex_bridge.py`

```python
class CodexBridge:
    """Python <-> Codex CLI 桥接层"""
    
    def __init__(self, codex_binary_path: str, config: dict):
        self.codex_bin = codex_binary_path
        self.config = config
    
    async def exec(self, prompt: str, cwd: str, **kwargs) -> AsyncGenerator[str, None]:
        """调用 codex exec 非交互模式"""
        
    async def review(self, diff: str, **kwargs) -> str:
        """调用 codex review 代码审查"""
        
    async def app_server(self, transport: str = "stdio"):
        """启动 codex app-server"""
        
    def build_config_toml(self, provider: str, model: str, **overrides) -> str:
        """生成 Codex config.toml"""
```

#### 步骤 3.2：实现流式输出解析

**新建文件**: `agent-framework/agent_framework/code/codex_parser.py`

解析 Codex CLI 的 JSON/文本输出，提取：
- Agent 思考过程
- 工具调用和结果
- 代码变更（diff）
- 错误信息

#### 步骤 3.3：实现 App Server 协议客户端

**新建文件**: `agent-framework/agent_framework/code/codex_app_client.py`

通过 WebSocket/Stdio 与 Codex App Server 通信：
- 发送用户消息
- 接收流式响应
- 管理会话生命周期
- 处理审批请求

---

### 阶段 4：双模式架构实现（第 15-21 天）

#### 步骤 4.1：模式管理器增强

**修改文件**: `agent-framework/agent_framework/core/mode_manager.py`

```python
class DualModeManager:
    """双模式管理器：MTC + CODE"""
    
    def __init__(self):
        self.mtc_config = ModeConfig(
            name="MTC",
            llm_provider="deepseek",
            model="deepseek-chat",
            system_prompt=MTCAgent.get_system_prompt(),
            allowed_tools=["document", "data", "research", "file"],
        )
        self.code_config = ModeConfig(
            name="CODE",
            llm_provider="codex",
            model="codex-default",
            system_prompt=CodeAgent.get_system_prompt(),
            allowed_tools=["shell", "file_edit", "git", "search"],
            use_codex_bridge=True,
        )
    
    async def switch_mode(self, session_id: str, target_mode: AgentMode):
        """模式切换，保留上下文"""
        
    async def get_agent(self, session_id: str) -> Union[MTCAgent, CodeAgent]:
        """获取当前模式的 Agent"""
```

#### 步骤 4.2：Code Agent 集成 CodexBridge

**修改文件**: `agent-framework/agent_framework/agent/code_agent.py`

```python
class CodeAgent(ReActAgent):
    def __init__(self, llm, tools, config, use_codex: bool = True):
        super().__init__(llm, tools, config)
        if use_codex:
            self.codex = CodexBridge(
                codex_binary_path=config.codex_binary_path,
                config=config.codex_config,
            )
    
    async def execute_task(self, task: Task) -> AgentResult:
        if self.codex:
            return await self._execute_with_codex(task)
        return await self._execute_with_llm(task)
    
    async def _execute_with_codex(self, task: Task) -> AgentResult:
        """通过 Codex Bridge 执行编码任务"""
        results = []
        async for chunk in self.codex.exec(task.description, cwd=task.workdir):
            results.append(chunk)
        return AgentResult(output="\n".join(results))
```

#### 步骤 4.3：MTC Agent 增强

**修改文件**: `agent-framework/agent_framework/agent/mtc_agent.py`

MTC 模式使用 DeepSeek V4，无需 Codex Bridge：
- 保持现有的 ReAct 循环
- 增强意图澄清系统
- 增强任务规划器
- 添加 Skills 体系

---

### 阶段 5：Codex Rust 源码深度改造（第 22-42 天）

#### 步骤 5.1：LLM 后端抽象增强

**修改文件**: `codex-rs/model-provider/src/provider.rs`

添加新的 Provider 能力描述：
```rust
pub trait ModelProvider: fmt::Debug + Send + Sync {
    fn info(&self) -> &ModelProviderInfo;
    fn capabilities(&self) -> ProviderCapabilities;
    fn wire_api(&self) -> WireApi { self.info().wire_api }
    // ... 现有方法
}
```

#### 步骤 5.2：中文 Prompt 优化

**新建文件**: `codex-rs/core/src/zh_prompts.rs`

```rust
pub const ZH_SYSTEM_PROMPT: &str = r#"你是一个专业的编程助手...
你可以执行 shell 命令来完成任务..."#;

pub const ZH_CODE_REVIEW_PROMPT: &str = r#"请审查以下代码变更..."#;

pub const ZH_ERROR_ANALYSIS_PROMPT: &str = r#"请分析以下错误信息..."#;
```

**修改文件**: `codex-rs/core/src/config/mod.rs`

添加语言配置项：
```rust
pub struct Config {
    // ... 现有字段
    pub language: String,  // "en" | "zh" | "ja" | ...
}
```

#### 步骤 5.3：工具链增强

**新建文件**: `codex-rs/tools/src/git_smart_commit.rs`

智能 Git 提交工具：
- 分析代码变更生成 commit message
- 支持 conventional commits 格式
- 中文/英文 commit message 支持

**新建文件**: `codex-rs/tools/src/security_audit.rs`

安全审计工具：
- 代码漏洞扫描
- 依赖安全检查
- 敏感信息泄露检测

**新建文件**: `codex-rs/tools/src/perf_analyzer.rs`

性能分析工具：
- 代码复杂度分析
- 性能瓶颈检测
- 优化建议生成

#### 步骤 5.4：MCP 服务器增强

**修改文件**: `codex-rs/mcp-server/src/lib.rs`

添加自定义 MCP 工具：
- `git_smart_commit`：智能提交
- `security_scan`：安全扫描
- `code_explain`：代码解释（中文）
- `project_scaffold`：项目脚手架

---

### 阶段 6：桌面应用集成（第 43-56 天）

#### 步骤 6.1：Tauri 应用集成 Codex

**修改文件**: `alonechat-desktop/src-tauri/src/commands/mod.rs`

```rust
#[tauri::command]
pub async fn codex_exec(prompt: String, cwd: String) -> Result<String, String> {
    // 调用 Codex CLI 或嵌入 Codex lib
}

#[tauri::command]
pub async fn switch_mode(mode: String) -> Result<String, String> {
    // 切换 MTC/CODE 模式
}
```

#### 步骤 6.2：前端模式切换 UI

**修改文件**: `alonechat-desktop/src/components/layout/header.tsx`

添加模式切换按钮：
- MTC 模式：办公主题色（蓝色系）
- CODE 模式：编码主题色（绿色系）
- 切换动画

#### 步骤 6.3：Codex 集成配置面板

**新建文件**: `alonechat-desktop/src/app/(main)/settings/codex-config.tsx`

配置项：
- Codex 二进制路径
- 默认模型选择
- Provider 配置（API Key、Base URL）
- 沙箱设置
- 审批策略

---

### 阶段 7：测试与优化（第 57-70 天）

#### 步骤 7.1：单元测试
- CodexBridge 通信测试
- 模式切换测试
- 中文 Prompt 效果测试
- 工具链功能测试

#### 步骤 7.2：集成测试
- MTC → CODE 模式无缝切换
- Codex CLI 与 Python 框架的端到端测试
- 桌面应用全链路测试

#### 步骤 7.3：性能优化
- Codex CLI 冷启动时间优化
- 流式输出延迟优化
- 内存占用优化

---

## 三、技术细节

### 3.1 CodexBridge 通信架构

```
┌─────────────────┐     stdio/websocket     ┌──────────────────┐
│  Python Agent    │ ◄──────────────────────► │  Codex CLI Binary │
│  Framework       │     JSON-RPC / SSE      │  (Rust)           │
│                  │                          │                   │
│  ┌─────────────┐ │                          │  ┌─────────────┐ │
│  │ CodeAgent   │ │                          │  │ App Server  │ │
│  │ MTCAgent    │ │                          │  │ Core Engine │ │
│  │ CodexBridge │ │                          │  │ Tools       │ │
│  └─────────────┘ │                          │  │ Sandbox     │ │
└─────────────────┘                          └──────────────────┘
         │                                            │
         │            ┌──────────────┐               │
         └───────────►│ DeepSeek V4  │◄──────────────┘
                      │ OpenAI GPT   │
                      │ Local Models │
                      └──────────────┘
```

### 3.2 模式切换状态机

```
                 ┌───────────┐
                 │  IDLE     │
                 └─────┬─────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
    ┌───────────────┐    ┌───────────────┐
    │   MTC MODE    │    │  CODE MODE    │
    │  (DeepSeek)   │◄──►│   (Codex)     │
    │               │    │               │
    │ - 文档处理    │    │ - 代码生成    │
    │ - 数据分析    │    │ - 调试重构    │
    │ - 信息调研    │    │ - Git 操作    │
    │ - Skills      │    │ - 沙箱执行    │
    └───────────────┘    └───────────────┘
```

### 3.3 config.toml 配置示例

```toml
# Codex 配置
model = "deepseek-chat"
model_provider = "deepseek"

[model_providers.deepseek]
name = "DeepSeek V4"
base_url = "https://api.deepseek.com/v1"
env_key = "DEEPSEEK_API_KEY"
wire_api = "chat"

[model_providers.openai_codex]
name = "OpenAI Codex"
base_url = "https://api.openai.com/v1"
env_key = "OPENAI_API_KEY"
wire_api = "responses"

[sandbox]
mode = "workspace-write"
```

### 3.4 关键依赖版本

| 依赖 | 版本 | 用途 |
|------|------|------|
| Rust | 1.82+ | Codex 编译 |
| Python | 3.11+ | Agent 框架 |
| tokio | 1.x | Rust 异步运行时 |
| pydantic | 2.x | Python 数据模型 |
| FastAPI | 0.100+ | API 服务 |
| Tauri | 2.x | 桌面应用 |

---

## 四、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Chat API 恢复复杂度高 | 阶段 2 延期 | 先用 Responses API proxy 过渡 |
| Codex CLI Windows 兼容性差 | 无法编译 | 使用 WSL2 或 Docker |
| DeepSeek Responses API 不兼容 | 无法直接对接 | 构建适配代理层 |
| 中文 Prompt 效果不佳 | 用户体验差 | 持续迭代优化 prompt |
| 双模式切换上下文丢失 | 任务中断 | 实现会话持久化 |

---

## 五、里程碑

| 里程碑 | 目标 | 验收标准 |
|--------|------|----------|
| M1 | Codex 编译成功 | `codex --version` 输出版本号 |
| M2 | DeepSeek 对接成功 | 通过 Codex 调用 DeepSeek API |
| M3 | Python Bridge 工作 | `codex_bridge.exec()` 返回结果 |
| M4 | 双模式切换 | MTC ↔ CODE 无缝切换 |
| M5 | 桌面应用集成 | Tauri 应用可使用双模式 |
| M6 | 中文优化完成 | 中文对话流畅自然 |

---

## 六、立即开始：第一步

下一步操作：
1. 编译 Codex Rust 二进制（`cargo build --release -p codex-cli`）
2. 在 `model-provider-info` 中添加 `WireApi::Chat` 变体
3. 创建 `agent-framework/agent_framework/code/codex_bridge.py` 骨架
