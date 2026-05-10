import time
from typing import Any, Callable, Dict, List, Optional, Set

from agent_framework.core.orchestrator import WorkflowGraph, WorkflowNode


class DAGFlow:
    def __init__(self, graph: WorkflowGraph):
        self.graph = graph
        self._node_map: Dict[str, WorkflowNode] = {n.id: n for n in graph.nodes}
        self._results: Dict[str, Any] = {}
        self._trajectory: List[Dict[str, Any]] = []

    def _get_execution_order(self) -> List[str]:
        in_degree: Dict[str, int] = {n.id: 0 for n in self.graph.nodes}
        adj: Dict[str, List[str]] = {n.id: [] for n in self.graph.nodes}

        for edge in self.graph.edges:
            src, dst = edge
            if src in in_degree and dst in in_degree:
                adj[src].append(dst)
                in_degree[dst] += 1

        queue = [n for n, d in in_degree.items() if d == 0]
        order = []
        while queue:
            node_id = queue.pop(0)
            order.append(node_id)
            for neighbor in adj[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(order) != len(self.graph.nodes):
            raise ValueError("Workflow graph contains cycles")
        return order

    def run(self, initial_input: Any) -> Dict[str, Any]:
        start_time = time.time()
        execution_order = self._get_execution_order()
        self._results = {}
        self._trajectory = []

        for node_id in execution_order:
            node = self._node_map[node_id]
            deps = node.dependencies
            dep_results = {d: self._results.get(d) for d in deps}

            if deps:
                if node.input_transform:
                    task_input = self._apply_transform(node.input_transform, dep_results, initial_input)
                else:
                    task_input = dep_results
            else:
                task_input = initial_input

            if node.condition:
                should_run = self._eval_condition(node.condition, dep_results, task_input)
                if not should_run:
                    self._trajectory.append({
                        "node_id": node_id,
                        "status": "skipped",
                        "input": task_input,
                        "condition": node.condition,
                    })
                    continue

            step_start = time.time()
            try:
                agent = node.agent
                if callable(agent):
                    if isinstance(task_input, dict) and len(task_input) == 1 and node_id in execution_order:
                        output = agent(list(task_input.values())[0])
                    else:
                        output = agent(task_input)
                else:
                    from agent_framework.core.base_agent import BaseAgent
                    if isinstance(agent, BaseAgent):
                        result = agent.run(str(task_input))
                        output = result.answer
                    else:
                        output = None

                step_time = (time.time() - step_start) * 1000
                self._results[node_id] = output
                self._trajectory.append({
                    "node_id": node_id,
                    "status": "success",
                    "input": task_input,
                    "output": output,
                    "time_ms": step_time,
                })
            except Exception as e:
                step_time = (time.time() - step_start) * 1000
                self._trajectory.append({
                    "node_id": node_id,
                    "status": "failed",
                    "input": task_input,
                    "error": str(e),
                    "time_ms": step_time,
                })
                return {
                    "success": False,
                    "results": self._results,
                    "trajectory": self._trajectory,
                    "failed_node": node_id,
                    "total_time_ms": (time.time() - start_time) * 1000,
                }

        total_time_ms = (time.time() - start_time) * 1000
        return {
            "success": True,
            "results": self._results,
            "trajectory": self._trajectory,
            "total_time_ms": total_time_ms,
        }

    def _apply_transform(self, transform: str, dep_results: Dict[str, Any], initial_input: Any) -> Any:
        return dep_results

    def _eval_condition(self, condition: str, dep_results: Dict[str, Any], task_input: Any) -> bool:
        try:
            return bool(eval(condition, {"__builtins__": {}}, {"deps": dep_results, "input": task_input, "results": self._results}))
        except Exception:
            return True
