from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum

from agent_framework.core.base_agent import BaseAgent, AgentResult


class WorkflowNode(BaseModel):
    id: str = Field(..., description="Node ID")
    agent: Optional[Any] = Field(default=None, description="Agent instance or task function")
    dependencies: List[str] = Field(default_factory=list, description="Dependency node IDs")
    condition: Optional[str] = Field(default=None, description="Condition expression for branching")
    input_transform: Optional[str] = Field(default=None, description="Input transformation expression")


class WorkflowGraph(BaseModel):
    nodes: List[WorkflowNode] = Field(default_factory=list)
    edges: List[tuple] = Field(default_factory=list)


class Orchestrator(ABC):
    @abstractmethod
    def run(self, agent: BaseAgent, task: str) -> AgentResult:
        pass

    @abstractmethod
    def run_multi(self, agents: List[BaseAgent], task: str) -> List[AgentResult]:
        pass

    @abstractmethod
    def run_workflow(self, graph: WorkflowGraph, initial_input: Any) -> Dict[str, Any]:
        pass
