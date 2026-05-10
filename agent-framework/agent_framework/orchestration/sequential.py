from typing import Any, Callable, Dict, List


class SequentialFlow:
    def __init__(self, tasks: List[Callable[[Any], Any]]):
        self.tasks = tasks

    def run(self, initial_input: Any) -> Dict[str, Any]:
        result = initial_input
        trajectory = []
        for i, task in enumerate(self.tasks):
            try:
                output = task(result)
                trajectory.append({
                    "step": i + 1,
                    "status": "success",
                    "input": result,
                    "output": output,
                })
                result = output
            except Exception as e:
                trajectory.append({
                    "step": i + 1,
                    "status": "failed",
                    "input": result,
                    "error": str(e),
                })
                return {
                    "success": False,
                    "result": result,
                    "trajectory": trajectory,
                    "failed_at_step": i + 1,
                }
        return {
            "success": True,
            "result": result,
            "trajectory": trajectory,
        }
