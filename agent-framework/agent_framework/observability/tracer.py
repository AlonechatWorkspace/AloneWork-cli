import time
from typing import Any, Dict, List, Optional
from datetime import datetime

from agent_framework.core.base_llm import UsageInfo


class ExecutionTracer:
    def __init__(self):
        self.llm_calls: List[Dict[str, Any]] = []
        self.tool_calls: List[Dict[str, Any]] = []
        self.react_steps: List[Dict[str, Any]] = []
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None

    def start(self) -> None:
        self.start_time = time.time()

    def stop(self) -> None:
        self.end_time = time.time()

    def record_llm_call(self, request: Dict[str, Any], response: Dict[str, Any], usage: UsageInfo) -> None:
        self.llm_calls.append({
            "timestamp": datetime.utcnow().isoformat(),
            "request": request,
            "response": response,
            "usage": usage.model_dump() if usage else {},
        })

    def record_tool_call(self, name: str, params: Dict[str, Any], result: Any, execution_time_ms: float, success: bool) -> None:
        self.tool_calls.append({
            "timestamp": datetime.utcnow().isoformat(),
            "tool": name,
            "params": params,
            "result": result if success else None,
            "error": None if success else str(result),
            "execution_time_ms": execution_time_ms,
            "success": success,
        })

    def record_react_step(self, iteration: int, step_type: str, thought: str, action: Optional[str] = None, observation: Optional[str] = None) -> None:
        self.react_steps.append({
            "timestamp": datetime.utcnow().isoformat(),
            "iteration": iteration,
            "type": step_type,
            "thought": thought,
            "action": action,
            "observation": observation,
        })

    def get_trace(self) -> Dict[str, Any]:
        total_time_ms = 0.0
        if self.start_time is not None:
            end = self.end_time if self.end_time is not None else time.time()
            total_time_ms = (end - self.start_time) * 1000

        total_tokens = 0
        total_cost = 0.0
        for call in self.llm_calls:
            u = call.get("usage", {})
            total_tokens += u.get("total_tokens", 0)
            total_cost += u.get("estimated_cost", 0.0)

        return {
            "llm_calls": self.llm_calls,
            "tool_calls": self.tool_calls,
            "react_steps": self.react_steps,
            "total_time_ms": total_time_ms,
            "total_tokens": total_tokens,
            "total_cost": total_cost,
        }

    def clear(self) -> None:
        self.llm_calls.clear()
        self.tool_calls.clear()
        self.react_steps.clear()
        self.start_time = None
        self.end_time = None
