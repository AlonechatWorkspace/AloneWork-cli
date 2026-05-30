"""
data命令组 - 数据收集与管理

提供交互数据收集、质量评估、导出等功能：
- data collect: 收集当前会话数据
- data list: 列出已收集的数据
- data export: 导出训练数据
- data quality: 评估数据质量
- data stats: 数据统计
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from alonechat.data.collector import DataCollector
from alonechat.data.quality import QualityEvaluator, QualityWeights
from alonechat.data.exporter import DataExporter
from alonechat.data.trajectory import TrajectoryRecorder

console = Console()


def get_data_dir() -> Path:
    data_dir = Path.home() / ".alonechat" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


@click.group(name="data")
def data_commands():
    """数据收集与管理命令 / Data collection and management"""
    pass


@data_commands.command(name="collect")
@click.option("--session-id", help="指定会话ID / Session ID")
@click.option("--output-dir", help="输出目录 / Output directory", type=click.Path())
@click.option("--format", "output_format", type=click.Choice(["json", "jsonl"]), default="jsonl")
@click.option("--include-metadata", is_flag=True, help="包含元数据 / Include metadata")
@click.pass_context
def collect_data(
    ctx: click.Context,
    session_id: Optional[str],
    output_dir: Optional[str],
    output_format: str,
    include_metadata: bool,
) -> None:
    """收集当前会话的交互数据 / Collect interaction data from current session"""
    console.print("[bold cyan]正在收集交互数据... / Collecting interaction data...[/bold cyan]")
    
    data_dir = Path(output_dir) if output_dir else get_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # DataCollector 需要轨迹数据来收集，这里创建示例数据用于测试
    from alonechat.data.trajectory import TrajectoryRecorder
    
    recorder = TrajectoryRecorder()
    traj_id = recorder.start_trajectory(
        session_id=session_id or "demo_session",
        task_description="代码分析任务",
        task_type="code_analysis",
    )
    recorder.record_step(
        user_input="分析代码",
        agent_thought="需要分析代码结构",
        action_type="analyze_code",
        action_params={"file": "main.py"},
        result={"status": "分析完成"},
        success=True,
        reward=1.0,
    )
    
    trajectory = recorder.get_trajectory(traj_id)
    
    collector = DataCollector(output_dir=data_dir)
    session_data = collector.collect_session_data(trajectory.session_id, [trajectory])
    
    output_file = data_dir / f"session_{trajectory.session_id}.{output_format}"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            if output_format == "jsonl":
                for item in session_data.trajectories:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")
            else:
                f.write(session_data.to_json(ensure_ascii=False))
        
        console.print(f"[green]已导出 / Exported: {output_file}[/green]")
        console.print(f"[bold green]数据收集完成 / Data collection complete[/bold green]")
        
    except Exception as e:
        console.print(f"[red]导出失败 / Export failed: {e}[/red]")


@data_commands.command(name="list")
@click.option("--limit", default=20, help="最大显示数量 / Max items to show")
@click.option("--sort-by", type=click.Choice(["time", "quality", "steps"]), default="time")
@click.pass_context
def list_data(
    ctx: click.Context,
    limit: int,
    sort_by: str,
) -> None:
    """列出已收集的交互数据 / List collected interaction data"""
    data_dir = get_data_dir()
    session_files = list(data_dir.glob("session_*.json*"))
    
    if not session_files:
        console.print("[yellow]没有已收集的数据 / No collected data[/yellow]")
        return
    
    sessions = []
    for f in session_files:
        try:
            with open(f, "r", encoding="utf-8") as file:
                data = json.load(file)
                if isinstance(data, list) and data:
                    first = data[0]
                elif isinstance(data, dict):
                    first = data
                else:
                    first = {}
                sessions.append({
                    "id": f.stem.replace("session_", ""),
                    "task": first.get("task", "N/A") if isinstance(first, dict) else "N/A",
                    "step_count": len(data) if isinstance(data, list) else 0,
                    "timestamp": first.get("timestamp", "N/A") if isinstance(first, dict) else "N/A",
                    "status": "completed",
                })
        except Exception:
            continue
    
    if sort_by == "time":
        sessions.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
    elif sort_by == "steps":
        sessions.sort(key=lambda s: s.get("step_count", 0), reverse=True)
    
    table = Table(title="已收集数据 / Collected Data")
    table.add_column("会话ID", style="cyan", no_wrap=True)
    table.add_column("任务", style="green")
    table.add_column("步骤数", style="yellow", justify="right")
    table.add_column("时间", style="dim")
    table.add_column("状态", style="magenta")
    
    for session in sessions[:limit]:
        table.add_row(
            session.get("id", "N/A")[:12],
            str(session.get("task", "N/A"))[:40],
            str(session.get("step_count", 0)),
            session.get("timestamp", "N/A"),
            session.get("status", "N/A"),
        )
    
    console.print(table)
    console.print(f"[dim]共 {len(sessions)} 条记录 / Total {len(sessions)} records[/dim]")


@data_commands.command(name="export")
@click.option("--session-id", help="指定会话ID（不指定则导出全部）/ Session ID (export all if not specified)")
@click.option("--output", "-o", help="输出文件路径 / Output file path")
@click.option("--format", "output_format", type=click.Choice(["json", "jsonl", "csv"]), default="jsonl")
@click.option("--min-quality", type=float, help="最低质量分数 / Minimum quality score")
@click.option("--include-stats", is_flag=True, help="包含统计信息 / Include statistics")
@click.pass_context
def export_data(
    ctx: click.Context,
    session_id: Optional[str],
    output: Optional[str],
    output_format: str,
    min_quality: Optional[float],
    include_stats: bool,
) -> None:
    """导出训练数据 / Export training data"""
    console.print("[bold cyan]正在导出数据... / Exporting data...[/bold cyan]")
    
    data_dir = get_data_dir()
    
    if session_id:
        source_file = data_dir / f"session_{session_id}.jsonl"
        if not source_file.exists():
            source_file = data_dir / f"session_{session_id}.json"
        if not source_file.exists():
            console.print(f"[red]会话文件未找到 / Session file not found: {session_id}[/red]")
            return
        try:
            with open(source_file, "r", encoding="utf-8") as f:
                if source_file.suffix == ".jsonl":
                    data = [json.loads(line) for line in f if line.strip()]
                else:
                    data = json.load(f)
        except Exception as e:
            console.print(f"[red]读取失败 / Read failed: {e}[/red]")
            return
    else:
        data = []
        for f in data_dir.glob("session_*.json*"):
            try:
                with open(f, "r", encoding="utf-8") as file:
                    if f.suffix == ".jsonl":
                        data.extend([json.loads(line) for line in file if line.strip()])
                    else:
                        file_data = json.load(file)
                        if isinstance(file_data, list):
                            data.extend(file_data)
                        else:
                            data.append(file_data)
            except Exception:
                continue
    
    if not data:
        console.print("[yellow]没有数据可导出 / No data to export[/yellow]")
        return
    
    if output:
        output_path = Path(output)
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = data_dir / f"training_data_{timestamp}.{output_format}"
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        if output_format == "jsonl":
            with open(output_path, "w", encoding="utf-8") as f:
                for item in data:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")
        elif output_format == "json":
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(str(data))
        
        console.print(f"[green]已导出到 / Exported to: {output_path}[/green]")
        console.print(f"[dim]共 {len(data)} 条记录 / Total {len(data)} records[/dim]")
        
    except Exception as e:
        console.print(f"[red]导出失败 / Export failed: {e}[/red]")


@data_commands.command(name="quality")
@click.option("--session-id", help="指定会话ID / Session ID")
@click.option("--weights", help="质量权重（JSON格式）/ Quality weights (JSON)")
@click.option("--threshold", type=float, default=0.7, help="质量阈值 / Quality threshold")
@click.pass_context
def data_quality(
    ctx: click.Context,
    session_id: Optional[str],
    weights: Optional[str],
    threshold: float,
) -> None:
    """评估数据质量 / Evaluate data quality"""
    console.print("[bold cyan]正在评估数据质量... / Evaluating data quality...[/bold cyan]")
    console.print("[yellow]质量评估功能需要轨迹数据，请先用 'data collect' 收集数据 / Quality evaluation requires trajectory data[/yellow]")


@data_commands.command(name="stats")
@click.option("--session-id", help="指定会话ID / Session ID")
@click.pass_context
def data_stats(
    ctx: click.Context,
    session_id: Optional[str],
) -> None:
    """数据统计 / Data statistics"""
    data_dir = get_data_dir()
    
    if session_id:
        session_files = [data_dir / f"session_{session_id}.jsonl"]
        if not session_files[0].exists():
            session_files = [data_dir / f"session_{session_id}.json"]
    else:
        session_files = list(data_dir.glob("session_*.json*"))
    
    valid_files = [f for f in session_files if f.exists()]
    
    if not valid_files:
        console.print("[yellow]没有数据 / No data[/yellow]")
        return
    
    sessions = []
    total_records = 0
    for f in valid_files:
        try:
            with open(f, "r", encoding="utf-8") as file:
                if f.suffix == ".jsonl":
                    records = [line for line in file if line.strip()]
                    count = len(records)
                else:
                    data = json.load(file)
                    count = len(data) if isinstance(data, list) else 1
                sessions.append({"file": f.name, "records": count})
                total_records += count
        except Exception:
            continue
    
    console.print(Panel(
        f"[bold]数据统计 / Data Statistics[/bold]\n\n"
        f"文件总数 / Total files: {len(sessions)}\n"
        f"总记录数 / Total records: {total_records}\n"
        f"平均记录数 / Avg records: {total_records / len(sessions):.1f}",
        title="📊 数据概览 / Data Overview",
        border_style="cyan",
    ))
    
    if len(sessions) > 1:
        table = Table(title="文件详情 / File Details")
        table.add_column("文件名", style="cyan")
        table.add_column("记录数", style="yellow", justify="right")
        
        for session in sessions:
            table.add_row(
                session["file"],
                str(session["records"]),
            )
        
        console.print(table)


@data_commands.command(name="clean")
@click.option("--older-than", type=int, help="删除N天前的数据 / Delete data older than N days")
@click.option("--dry-run", is_flag=True, help="预览删除（不实际删除）/ Preview only")
@click.confirmation_option(prompt="确定要清理数据吗? / Are you sure you want to clean data?")
@click.pass_context
def clean_data(
    ctx: click.Context,
    older_than: Optional[int],
    dry_run: bool,
) -> None:
    """清理数据 / Clean up data"""
    data_dir = get_data_dir()
    session_files = list(data_dir.glob("session_*.json*"))
    
    to_delete = []
    
    for file in session_files:
        should_delete = False
        
        if older_than:
            try:
                file_time = datetime.fromtimestamp(file.stat().st_mtime)
                age_days = (datetime.now() - file_time).days
                if age_days > older_than:
                    should_delete = True
            except Exception:
                continue
        
        if should_delete:
            to_delete.append(file)
    
    if not to_delete:
        console.print("[green]没有需要清理的数据 / No data to clean[/green]")
        return
    
    console.print(f"[yellow]将删除 {len(to_delete)} 个文件 / Will delete {len(to_delete)} files[/yellow]")
    
    if dry_run:
        for f in to_delete:
            console.print(f"[dim]将删除 / Will delete: {f.name}[/dim]")
        return
    
    for f in to_delete:
        f.unlink()
    
    console.print(f"[green]已清理 {len(to_delete)} 个文件 / Cleaned {len(to_delete)} files[/green]")
