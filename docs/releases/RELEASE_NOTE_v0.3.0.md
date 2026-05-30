# AloneChat Workspace v0.3.0

> **从思考到行动，从单兵到军团。**

***

## 发布语

v0.2.3 注入了灵魂，v0.3.0 组建了军团。

这个版本做了三件大事：**环境原生的智能体系统** + **工作流编排引擎** + **TUI交互式界面**。

**"为了行动而思考"架构落地**：不再是模型独立推理后吐出答案，而是构建完整的行动环境——Agent 在环境中行动、接收反馈、修正计划、继续推进。训练对象从"模型本身"转向"模型+环境"系统。这是研究方向的根基性变化。

**Supervisor-Worker 多智能体协作**：Leader 统筹调度，Worker 专注执行（代码/数据/研究/测试四种专业 Agent），三者通过消息总线通信，支持动态重规划与自我反思。任务分解支持五种策略（顺序/并行/层次/条件/自适应），自动选择最优路径。

**工作流编排引擎**：顺序、并行、条件、循环四类节点构成完整 DAG 工作流图。代码审查、数据处理管道、研究分析均可定义为可复用工作流模板。执行器支持暂停/恢复/取消/检查点，失败不丢失进度。

**TUI 交互式终端界面**：模仿 Claude Code / DeepSeek TUI 的交互体验。启动即显示欢迎面板、状态栏、工作区和 Composer 输入区域。所有操作通过 `/command` 形式完成，不再依赖 `alonework subcommand` 格式。自动检测系统语言并切换中文界面，API Key 自动检测与脱敏隐藏。

**数据收集而非训练**：每一次交互被完整记录为轨迹，经过多维度质量评估（完成度/效率/奖励/错误率），输出结构化 JSONL 训练数据。不做在线训练，选择权在用户手中。

依然不完美，但比 0.2.3 行动了许多。这就是"为了行动而思考"的意义。

***

## 功能亮点

### 🤖 Supervisor-Worker 多智能体协作

```
┌─────────────────────────────────────────────────────────┐
│                    Supervisor Agent                     │
│  ┌──────────┐   ┌────────────────────────────────┐      │
│  │ 任务理解 │──→│     Task Planner              │      │
│  │ 子任务拆分│   │  5种分解策略                  │      │
│  └──────────┘   │  · sequential / parallel       │      │
│        │       │  · hierarchical / conditional    │      │
│        ▼       │  · adaptive                   │      │
│  ┌──────────┐   └────────────────────────────────┘      │
│  │ Workers  │←──→ ┌────────────┐                      │
│  ├─CodeAgent│     │ Message Bus │                      │
│  ├─DataAgent│     │ 消息总线    │                      │
│  ├─ResearchA│     └────────────┘                      │
│  └─TestAgent│     ┌────────────┐                      │
│                   │ Reflection  │                      │
│                   │ 自我反思    │                      │
│                   └────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

- **Supervisor**: 任务理解、子任务拆分、Worker 调度、结果聚合、动态重规划
- **CodeAgent**: 代码生成、修改、重构、审查
- **DataAgent**: 数据处理、分析、转换、查询
- **ResearchAgent**: 搜索、阅读、总结、知识收集
- **TestAgent**: 测试生成、运行、验证、覆盖率
- **MessageBus**: Agent 间消息传递、共享内存、请求-响应模式
- **ReflectionEngine**: 自我反思、策略调整、模式学习

### 🔄 工作流编排引擎

```
┌─────────────────────────────────────────────────────────┐
│                 Workflow Engine                       │
│                                                         │
│  [START] → [Action] → [Condition] ─→ [Branch A]      │
│                ↓                    └→ [Branch B]      │
│           [Parallel]                                   │
│         ↙       ↘                                       │
│    [Task1] [Task2]                                     │
│         ↓       ↓                                       │
│        [Loop] → [END]                                  │
│                                                         │
│  节点类型: Action / Condition / Parallel / Loop        │
│  执行特性: 暂停/恢复/取消/检查点/轨迹记录               │
└─────────────────────────────────────────────────────────┘
```

- **WorkflowDefinition**: DAG 结构的工作流定义，节点+边
- **WorkflowEngine**: 异步执行引擎，支持并发控制
- **TaskPlanner**: 五种任务分解策略，关键路径分析
- **WorkflowExecutor**: 执行生命周期管理，重试+超时+检查点
- **预设模板**: code_review / data_pipeline / research 三种开箱即用

### 📊 数据收集与质量评估

```
用户对话 → TrajectoryRecorder → DataCollector → QualityEvaluator → DataExporter
                                                                    ↓
                                                            JSONL 训练数据
```

- **TrajectoryRecorder**: 完整记录每一步交互（观察/思考/行动/反馈/奖励）
- **DataCollector**: 会话级数据整理，支持过滤与分组
- **QualityEvaluator**: 四维度评分（完成度/效率/奖励/错误率）
- **DataExporter**: 导出 JSONL/JSON 格式，含统计信息

### 🌍 行动环境系统

```
┌─────────────────────────────────────────────────────────┐
│               Action Environment                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │WorldState│  │AgentState│  │InteractionHistory│     │
│  │ 世界状态  │  │ Agent状态 │  │   交互历史       │     │
│  └──────────┘  └──────────┘  └──────────────────┘     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │FeedbackSys│  │  Sandbox │  │  State Checkpoint│    │
│  │ 反馈系统  │  │  沙箱安全 │  │   状态检查点      │     │
│  └──────────┘  └──────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

- **ActionEnvironment**: 行动-观察-反馈闭环核心
- **FeedbackSystem**: 观察收集、奖励计算、错误分析
- **Sandbox**: 行动验证、安全限制、资源管控
- **EnvironmentState**: 完整状态管理，支持检查点与恢复

### 🖥️ TUI 交互式终端界面

```
╭─────────────────────────────────────────────────────────────╮
│                                                             │
│  AloneChat v0.3.0                                         │
│                                                             │
│  快速开始                                                   │
│    • 运行 /init 创建项目配置                               │
│    • 使用 /help 查看所有可用命令                            │
│    • 按 Ctrl+C 退出                                        │
│                                                             │
│  新功能                                                     │
│    • 多智能体协作系统 (Supervisor-Worker)                   │
│    • 工作流编排引擎                                        │
│                                                             │
│  sk-abcd...1234 · API 用量计费                             │
│  E:\project                                                │
│                                                             │
╰─────────────────────────────────────────────────────────────╯

代理 User · deepseek-v4-flash  🐳  · auto  0% ▱▱▱▱▱▱▱▱▱▱  v0.3.0

> 编写任务或使用 / 查看命令...
╭─────────────────────────────────────────────────────────────╮
│ Composer                                                  │
╰─────────────────────────────────────────────────────────────╯
```

- **WelcomePanel**: 版本信息、快速提示、新功能展示
- **StatusBar**: Agent 名称、模型、进度条、版本号
- **WorkPanel**: 任务列表、执行状态、输出预览
- **Composer**: `/command` 形式的命令输入
- **I18n**: 自动检测系统语言（中文/English），`/lang` 切换
- **Security**: API Key 自动检测与脱敏，输入敏感信息自动隐藏

### 🌐 国际化支持

| 语言 | 代码 | 状态 |
|------|------|------|
| English | en | ✅ |
| 简体中文 | zh-Hans | ✅ |

支持自动检测系统 locale，也可通过 `/lang en` 或 `/lang zh-Hans` 手动切换。

***

## 快速开始

```bash
# 安装
cd alonework-cli
pip install -e .

# 启动 TUI（交互式界面）
alonework

# 或者使用传统命令形式
alonework init                          # 初始化配置
alonework --help                        # 查看帮助

# 在 TUI 中使用 /command
/init                                      # 初始化
/help                                      # 帮助
/lang zh-Hans                              # 切换中文
/model                                     # 查看模型

# 数据管理
/data collect                              # 收集交互数据
/data export                                # 导出训练数据
/data quality --threshold 0.7              # 质量评估
/data stats                                  # 数据统计

# 工作流
/workflow create my_wf --preset code_review # 创建工作流
/workflow run my_wf                        # 执行工作流
/workflow plan "重构认证模块"             # 规划任务

# 环境
/env status                                 # 环境状态
/env checkpoint --name before_refactor     # 创建检查点
/env restore before_refactor              # 恢复检查点
/env tree                                    # 状态树
```

***

## 架构概览

```
AloneChat Workspace v0.3.0
│
├── alonework-cli/                    # 命令行层
│   └── src/alonechat/
│       ├── tui/                     # TUI 交互式界面
│       │   ├── __init__.py          # 主入口 (AloneChatTUI)
│       │   ├── i18n.py             # 国际化 (I18nTUI)
│       │   ├── welcome.py          # 欢迎面板
│       │   ├── status_bar.py       # 状态栏
│       │   ├── work_panel.py       # 工作区
│       │   └── composer.py         # 输入区域
│       │
│       ├── orchestration/            # 工作流编排
│       │   ├── workflow.py          # 工作流定义与引擎
│       │   ├── planner.py           # 任务规划器
│       │   ├── executor.py          # 执行器
│       │   └── nodes/               # 工作流节点
│       │       ├── action_node.py
│       │       ├── condition_node.py
│       │       ├── parallel_node.py
│       │       └── loop_node.py
│       │
│       ├── agents/                  # 多智能体协作
│       │   ├── supervisor.py        # Supervisor Agent
│       │   ├── workers/
│       │   │   ├── code_agent.py
│       │   │   ├── data_agent.py
│       │   │   ├── research_agent.py
│       │   │   └── test_agent.py
│       │   ├── communication.py     # 消息通信
│       │   └── reflection.py        # 自我反思
│       │
│       ├── environment/             # 行动环境
│       │   ├── action_env.py        # 行动环境核心
│       │   ├── feedback.py          # 反馈系统
│       │   ├── sandbox.py           # 安全沙箱
│       │   └── state.py             # 状态管理
│       │
│       ├── data/                    # 数据收集
│       │   ├── trajectory.py        # 轨迹记录
│       │   ├── collector.py         # 数据收集
│       │   ├── quality.py           # 质量评估
│       │   └── exporter.py          # 数据导出
│       │
│       ├── commands/               # CLI 命令
│       │   ├── data.py              # data 命令组
│       │   ├── workflow.py          # workflow 命令组
│       │   ├── env.py               # env 命令组
│       │   └── ...
│       │
│       └── configs/
│           ├── locales/             # 翻译文件
│           │   ├── en.json
│           │   └── zh-Hans.json
│           ├── data_config.yaml
│           ├── environment_config.yaml
│           ├── agents_config.yaml
│           └── workflow_config.yaml
│
├── agent-framework/                 # 核心逻辑层
│   └── agent_framework/
│       ├── agent/                 # Agent 实现
│       ├── orchestration/          # 编排引擎
│       ├── sandbox/                # 沙箱
│       └── locale/                 # 国际化基础
│
└── alonechat-desktop/              # 桌面层
    └── src/components/agent/
```

***

## 版本历史

| 版本 | 核心里程碑 |
|------|-----------|
| v0.1.x | 基础建设，DeepSeek V4 Flash 深度优化 |
| v0.2.x | 数据层+环境层+Agent层+工作流引擎+CLI 增强 |
| v0.3.x | TUI 交互界面 + I18n 国际化 + 命令改名 alonework |

***

**GitHub**: <https://github.com/Ryan-178/AloneChatWorkspace>

**邮箱**: <alonechatworkspace@163.com>
