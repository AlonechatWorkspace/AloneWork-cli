"""
成本显示模块 / Cost Display Module

使用Rich显示成本信息
Displays cost information using Rich
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, BarColumn

console = Console()
logger = logging.getLogger(__name__)


def display_cost_report(
    cost_data: Dict[str, Any],
    period: str = "session",
) -> None:
    """
    显示成本报告 / Display cost report
    """
    total_cost = cost_data.get("total_cost", 0)
    usage = cost_data.get("total_usage", cost_data.get("usage", {}))

    input_tokens = usage.get("input_tokens", 0)
    output_tokens = usage.get("output_tokens", 0)
    cache_read = usage.get("cache_read_tokens", 0)
    cache_write = usage.get("cache_write_tokens", 0)

    title_map = {
        "turn": "当前轮次成本",
        "session": "会话成本",
        "day": "今日成本",
        "week": "本周成本",
        "month": "本月成本",
    }
    title = title_map.get(period, "成本报告")

    content = Text()
    content.append(f"总成本: ", style="bold")
    content.append(f"${total_cost:.4f}\n\n", style="green")

    content.append("Token 使用:\n", style="bold")
    content.append(f"  输入: {format_tokens(input_tokens)}\n")
    content.append(f"  输出: {format_tokens(output_tokens)}\n")
    content.append(f"  缓存读取: {format_tokens(cache_read)}\n")
    content.append(f"  缓存写入: {format_tokens(cache_write)}\n")

    total_tokens = input_tokens + output_tokens
    if total_tokens > 0:
        content.append(f"\n总计: {format_tokens(total_tokens)} tokens\n")

    cache_total = cache_read + input_tokens
    if cache_total > 0:
        hit_rate = cache_read / cache_total
        content.append(f"\n缓存命中率: {hit_rate * 100:.1f}%\n", style="cyan")

    console.print(Panel(content, title=title, border_style="blue"))


def display_session_cost(session_data: Dict[str, Any]) -> None:
    """
    显示会话成本详情 / Display session cost details
    """
    session_id = session_data.get("session_id", "unknown")
    total_cost = session_data.get("total_cost", 0)
    turn_count = session_data.get("turn_count", 0)
    duration = session_data.get("duration_seconds", 0)
    model_costs = session_data.get("model_costs", {})

    console.print(f"\n[bold]会话: {session_id[:8]}...[/bold]\n")

    table = Table(show_header=False)
    table.add_column("指标", style="cyan")
    table.add_column("值", style="green")

    table.add_row("总成本", f"${total_cost:.4f}")
    table.add_row("对话轮次", str(turn_count))
    table.add_row("持续时间", format_duration(duration))
    if turn_count > 0:
        table.add_row("平均每轮成本", f"${total_cost / turn_count:.4f}")

    console.print(table)

    if model_costs:
        console.print("\n[bold]模型成本分布:[/bold]\n")

        model_table = Table(show_header=True, header_style="bold")
        model_table.add_column("模型", style="cyan")
        model_table.add_column("成本", style="green")
        model_table.add_column("占比", style="yellow")

        for model, cost in sorted(model_costs.items(), key=lambda x: x[1], reverse=True):
            percentage = (cost / total_cost * 100) if total_cost > 0 else 0
            model_table.add_row(model, f"${cost:.4f}", f"{percentage:.1f}%")

        console.print(model_table)


def display_daily_cost(daily_data: List[Dict[str, Any]], limit: int = 7) -> None:
    """
    显示每日成本历史 / Display daily cost history
    """
    if not daily_data:
        console.print("[yellow]没有历史数据[/yellow]")
        return

    console.print("\n[bold]每日成本历史:[/bold]\n")

    table = Table(show_header=True, header_style="bold")
    table.add_column("日期", style="cyan")
    table.add_column("成本", style="green")
    table.add_column("输入Token", style="yellow")
    table.add_column("输出Token", style="yellow")
    table.add_column("会话数", style="magenta")

    for day in daily_data[:limit]:
        usage = day.get("total_usage", day.get("usage", {}))
        table.add_row(
            day.get("date", "unknown"),
            f"${day.get('total_cost', 0):.4f}",
            format_tokens(usage.get("input_tokens", 0)),
            format_tokens(usage.get("output_tokens", 0)),
            str(day.get("session_count", 0)),
        )

    console.print(table)


def display_cost_breakdown(records: List[Dict[str, Any]]) -> None:
    """
    显示成本明细 / Display cost breakdown
    """
    if not records:
        console.print("[yellow]没有成本记录[/yellow]")
        return

    console.print("\n[bold]成本明细:[/bold]\n")

    table = Table(show_header=True, header_style="bold")
    table.add_column("时间", style="cyan")
    table.add_column("模型", style="green")
    table.add_column("输入", style="yellow")
    table.add_column("输出", style="yellow")
    table.add_column("成本", style="magenta")

    for record in records[:20]:
        timestamp = record.get("timestamp", "")
        if isinstance(timestamp, str) and len(timestamp) > 19:
            timestamp = timestamp[:19]

        usage = record.get("usage", {})
        table.add_row(
            timestamp,
            record.get("model_id", "unknown"),
            format_tokens(usage.get("input_tokens", 0)),
            format_tokens(usage.get("output_tokens", 0)),
            f"${record.get('total_cost', 0):.4f}",
        )

    console.print(table)

    if len(records) > 20:
        console.print(f"\n[dim]显示前20条，共 {len(records)} 条记录[/dim]")


def display_cache_stats(cache_stats: Dict[str, Any]) -> None:
    """
    显示缓存统计 / Display cache statistics
    """
    total = cache_stats.get("total_requests", 0)
    hits = cache_stats.get("cache_hits", 0)
    misses = cache_stats.get("cache_misses", 0)
    tokens_saved = cache_stats.get("tokens_saved", 0)
    cost_saved = cache_stats.get("cost_saved", 0)
    hit_rate = cache_stats.get("hit_rate", 0)

    console.print("\n[bold]缓存统计:[/bold]\n")

    content = Text()
    content.append(f"总请求: {total}\n")
    content.append(f"缓存命中: {hits} ", style="green")
    content.append(f"未命中: {misses}\n", style="red")
    content.append(f"命中率: {hit_rate * 100:.1f}%\n\n", style="cyan")
    content.append(f"节省Token: {format_tokens(tokens_saved)}\n")
    content.append(f"节省成本: ${cost_saved:.4f}\n", style="green")

    console.print(Panel(content, border_style="green"))


def display_cost_alert(alert: Dict[str, Any]) -> None:
    """
    显示成本警告 / Display cost alert
    """
    alert_type = alert.get("alert_type", "unknown")
    threshold = alert.get("threshold", 0)
    current = alert.get("current_value", 0)
    message = alert.get("message", "")

    console.print(f"\n[bold red]⚠ 成本警告[/bold red]")
    console.print(f"[yellow]{message}[/yellow]")
    console.print(f"  阈值: ${threshold:.4f}")
    console.print(f"  当前: ${current:.4f}")
    console.print(f"  比例: {current / threshold * 100:.1f}%")


def format_tokens(tokens: int) -> str:
    """
    格式化Token数量 / Format token count
    """
    if tokens >= 1_000_000:
        return f"{tokens / 1_000_000:.2f}M"
    elif tokens >= 1_000:
        return f"{tokens / 1_000:.1f}K"
    return str(tokens)


def format_duration(seconds: float) -> str:
    """
    格式化持续时间 / Format duration
    """
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds / 60:.1f}m"
    else:
        return f"{seconds / 3600:.1f}h"


def format_cost_table_row(cost: float, threshold: float) -> str:
    """
    格式化成本表格行 / Format cost table row
    """
    percentage = (cost / threshold * 100) if threshold > 0 else 0

    if percentage >= 100:
        return f"[red]${cost:.4f} ({percentage:.0f}%)[/red]"
    elif percentage >= 80:
        return f"[yellow]${cost:.4f} ({percentage:.0f}%)[/yellow]"
    else:
        return f"[green]${cost:.4f} ({percentage:.0f}%)[/green]"
