"""
AloneWork CLI - 国产化、终端原生、深度中文优化的AI编程Agent

核心原则：
- 本地部署优先：所有核心功能本地运行
- API调用模式：通过API调用外部模型，代码不上传
- 隐私保护：用户代码完全本地化，不经过云端
- 离线支持：支持本地模型，完全离线可用
"""

__version__ = "0.2.3"
__author__ = "AloneWork Team"
__email__ = "aloneworkworkspace@163.com"

from alonechat.cli import main

from alonechat.core import (
    BaseAgent,
    BaseLLM,
    BaseMemory,
    BaseTool,
    ToolDef,
    AgentResult,
    AgentEvent,
    AgentState,
    Message,
    ToolCall,
    ToolResult as CoreToolResult,
    Orchestrator,
    WorkflowGraph,
    WorkflowNode,
    AgentBus,
    AgentMessage,
    ModeManager,
    DualModeManager,
)

from alonechat.framework_agent import (
    ReActAgent,
    MTCAgent,
    CodeAgent,
    AgentModeManager,
    ExecutionMode,
    ModeConfig as FrameworkModeConfig,
    ModeSwitchEvent,
    create_mode_manager,
    ModeRouter,
    create_router,
)

from alonechat.tools.framework_registry import ToolRegistry

from alonechat.framework_config import (
    AgentConfig,
    ConfigManager,
    get_config,
    get_config_manager,
)

from alonechat.framework_entry import (
    Agent,
    create_agent,
    AgentModeManager as EntryModeManager,
    ModeRouter as EntryModeRouter,
)

__all__ = [
    "main",
    "BaseAgent",
    "BaseLLM",
    "BaseMemory",
    "BaseTool",
    "ToolDef",
    "AgentResult",
    "AgentEvent",
    "AgentState",
    "Message",
    "ToolCall",
    "CoreToolResult",
    "Orchestrator",
    "WorkflowGraph",
    "WorkflowNode",
    "AgentBus",
    "AgentMessage",
    "ModeManager",
    "DualModeManager",
    "ReActAgent",
    "MTCAgent",
    "CodeAgent",
    "AgentModeManager",
    "ExecutionMode",
    "FrameworkModeConfig",
    "ModeSwitchEvent",
    "create_mode_manager",
    "ModeRouter",
    "create_router",
    "ToolRegistry",
    "AgentConfig",
    "ConfigManager",
    "get_config",
    "get_config_manager",
    "Agent",
    "create_agent",
    "EntryModeManager",
    "EntryModeRouter",
]
