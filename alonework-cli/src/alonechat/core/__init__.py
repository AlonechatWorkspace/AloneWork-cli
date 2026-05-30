"""
Agent Framework Core Module
Agent框架核心模块

提供核心类型定义和基础抽象类
Provides core type definitions and base abstract classes
"""

from alonechat.core.types import (
    AgentState,
    MessageRole,
    Message,
    ToolCall,
    ToolResult,
    AgentMode,
    InteractionMode,
    ModeConfig,
    FilePermission,
    ExecutionEnvironment,
    TaskStatus,
    TaskPriority,
)
from alonechat.core.base_agent import BaseAgent, AgentResult, AgentEvent
from alonechat.core.base_llm import BaseLLM
from alonechat.core.base_memory import BaseMemory
from alonechat.core.base_tool import BaseTool, ToolDef, ToolResult as ToolResultDef
from alonechat.core.mode_manager import ModeManager
from alonechat.core.dual_mode_manager import DualModeManager, ModeConfig as AgentModeConfig, ModeSwitchReason
from alonechat.core.orchestrator import Orchestrator, WorkflowGraph, WorkflowNode
from alonechat.core.agent_bus import AgentBus, AgentMessage

__all__ = [
    "AgentState",
    "MessageRole",
    "Message",
    "ToolCall",
    "ToolResult",
    "AgentMode",
    "InteractionMode",
    "ModeConfig",
    "FilePermission",
    "ExecutionEnvironment",
    "TaskStatus",
    "TaskPriority",
    "BaseAgent",
    "AgentResult",
    "AgentEvent",
    "BaseLLM",
    "BaseMemory",
    "BaseTool",
    "ToolDef",
    "ToolResultDef",
    "ModeManager",
    "DualModeManager",
    "AgentModeConfig",
    "ModeSwitchReason",
    "Orchestrator",
    "WorkflowGraph",
    "WorkflowNode",
    "AgentBus",
    "AgentMessage",
]
