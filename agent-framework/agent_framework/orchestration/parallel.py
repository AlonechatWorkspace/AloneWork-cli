import asyncio
from typing import Any, Callable, Dict, List


class ParallelFlow:
    def __init__(self, tasks: List[Callable[[], Any]]):
        self.tasks = tasks

    async def run(self) -> Dict[str, Any]:
        async def _wrap(task: Callable[[], Any], index: int) -> Dict[str, Any]:
            try:
                if asyncio.iscoroutinefunction(task):
                    output = await task()
                else:
                    output = task()
                return {
                    "index": index,
                    "status": "success",
                    "output": output,
                }
            except Exception as e:
                return {
                    "index": index,
                    "status": "failed",
                    "error": str(e),
                }

        results = await asyncio.gather(*[_wrap(t, i) for i, t in enumerate(self.tasks)])
        return {
            "success": all(r["status"] == "success" for r in results),
            "results": results,
        }
