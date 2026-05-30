"""
会话管理命令 - Session Management Commands

提供会话管理的CLI命令
Provides CLI commands for session management

命令 / Commands:
- alonechat sessions list - 列出会话
- alonechat sessions search - 搜索会话
- alonechat sessions delete - 删除会话
- alonechat sessions stats - 会话统计
"""

import asyncio
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel


console = Console()


@click.group()
def sessions() -> None:
    """
    会话管理命令 / Session management commands
    
    管理会话的创建、加载、删除、搜索等操作
    Manage session creation, loading, deletion, search
    """
    pass


@sessions.command("list")
@click.option("--limit", "-l", default=20, help="最大显示数量 / Maximum count")
@click.option("--offset", "-o", default=0, help="偏移量 / Offset")
@click.option("--verbose", "-v", is_flag=True, help="显示详细信息 / Show verbose info")
def list_sessions(limit: int, offset: int, verbose: bool) -> None:
    """
    列出会话 / List sessions
    
    显示最近的会话列表
    Show recent session list
    """
    asyncio.run(_list_sessions_async(limit, offset, verbose))


async def _list_sessions_async(limit: int, offset: int, verbose: bool) -> None:
    from alonechat.session.manager import SessionManager
    
    manager = SessionManager()
    sessions = await manager.list_sessions(limit=limit, offset=offset)
    
    if not sessions:
        console.print("[yellow]暂无会话 / No sessions[/yellow]")
        return
    
    table = Table(title="会话列表 / Session List")
    table.add_column("ID", style="cyan", no_wrap=True)
    table.add_column("名称 / Name", style="green")
    table.add_column("模式 / Mode", style="yellow")
    table.add_column("消息数 / Messages", style="magenta")
    table.add_column("更新时间 / Updated", style="blue")
    
    for session in sessions:
        table.add_row(
            session.id[:8] + "...",
            session.display_name or "未命名",
            session.interaction_mode,
            str(len(session.messages)),
            session.updated_at.strftime("%Y-%m-%d %H:%M"),
        )
    
    console.print(table)
    
    if verbose:
        stats = await manager.get_stats()
        console.print(Panel(
            f"总会话数: {stats['total_sessions']}\n"
            f"总消息数: {stats['total_messages']}\n"
            f"已归档: {stats['archived']}",
            title="统计信息 / Statistics",
        ))


@sessions.command("search")
@click.argument("query")
@click.option("--limit", "-l", default=20, help="最大显示数量 / Maximum count")
def search_sessions(query: str, limit: int) -> None:
    """
    搜索会话 / Search sessions
    
    在会话名称和消息内容中搜索
    Search in session names and message content
    """
    asyncio.run(_search_sessions_async(query, limit))


async def _search_sessions_async(query: str, limit: int) -> None:
    from alonechat.session.manager import SessionManager
    
    manager = SessionManager()
    sessions = await manager.search_sessions(query, limit=limit)
    
    if not sessions:
        console.print(f"[yellow]未找到匹配的会话: {query}[/yellow]")
        return
    
    console.print(f"[green]找到 {len(sessions)} 个匹配的会话[/green]")
    
    table = Table(title=f"搜索结果: {query}")
    table.add_column("ID", style="cyan")
    table.add_column("名称", style="green")
    table.add_column("消息数", style="magenta")
    
    for session in sessions:
        table.add_row(
            session.id[:8] + "...",
            session.display_name or "未命名",
            str(len(session.messages)),
        )
    
    console.print(table)


@sessions.command("delete")
@click.argument("session_id")
@click.option("--force", "-f", is_flag=True, help="强制删除，不确认 / Force delete without confirmation")
def delete_session(session_id: str, force: bool) -> None:
    """
    删除会话 / Delete session
    
    删除指定的会话
    Delete specified session
    """
    asyncio.run(_delete_session_async(session_id, force))


async def _delete_session_async(session_id: str, force: bool) -> None:
    from alonechat.session.manager import SessionManager
    from rich.prompt import Confirm
    
    manager = SessionManager()
    
    if not force:
        if not Confirm.ask(f"确认删除会话 {session_id}?"):
            console.print("[yellow]已取消[/yellow]")
            return
    
    success = await manager.delete_session(session_id)
    
    if success:
        console.print(f"[green]✓ 已删除会话: {session_id}[/green]")
    else:
        console.print(f"[red]✗ 删除失败: {session_id}[/red]")


@sessions.command("stats")
def session_stats() -> None:
    """
    会话统计 / Session statistics
    
    显示会话存储的统计信息
    Show session storage statistics
    """
    asyncio.run(_session_stats_async())


async def _session_stats_async() -> None:
    from alonechat.session.manager import SessionManager
    
    manager = SessionManager()
    stats = await manager.get_stats()
    
    console.print(Panel(
        f"[cyan]总会话数 / Total Sessions:[/] {stats['total_sessions']}\n"
        f"[cyan]总消息数 / Total Messages:[/] {stats['total_messages']}\n"
        f"[cyan]已归档 / Archived:[/] {stats['archived']}\n"
        f"[cyan]数据库路径 / DB Path:[/] {stats.get('db_path', 'N/A')}",
        title="[bold]会话统计 / Session Statistics[/bold]",
    ))


@sessions.command("archive")
@click.argument("session_id")
def archive_session(session_id: str) -> None:
    """
    归档会话 / Archive session
    
    归档指定的会话
    Archive specified session
    """
    asyncio.run(_archive_session_async(session_id))


async def _archive_session_async(session_id: str) -> None:
    from alonechat.session.manager import SessionManager
    
    manager = SessionManager()
    success = await manager.archive_session(session_id)
    
    if success:
        console.print(f"[green]✓ 已归档会话: {session_id}[/green]")
    else:
        console.print(f"[red]✗ 归档失败: {session_id}[/red]")
