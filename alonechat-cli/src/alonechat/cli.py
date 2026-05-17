"""
AloneChat CLI主入口

提供命令行接口，支持：
- init: 初始化项目配置
- chat: 启动交互式对话
- generate: 代码生成
- test: 自动测试
- commit: 智能提交
"""

import click
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from alonechat import __version__
from alonechat.commands import init, chat, generate, test, commit
from alonechat.config import ConfigManager

console = Console()


@click.group()
@click.version_option(version=__version__, prog_name="AloneChat")
@click.option("--config", "-c", help="配置文件路径", type=click.Path())
@click.option("--verbose", "-v", is_flag=True, help="详细输出")
@click.pass_context
def main(ctx: click.Context, config: str | None, verbose: bool) -> None:
    """
    AloneChat - 国产化、终端原生、深度中文优化的AI编程Agent
    
    \b
    核心特性：
    - 🔒 隐私保护：代码完全本地化
    - 🚀 本地优先：核心功能本地运行
    - 🌐 离线支持：支持本地模型
    - 🇨🇳 中文优化：深度中文理解
    
    \b
    快速开始：
    $ alonechat init          # 初始化配置
    $ alonechat chat          # 启动对话
    $ alonechat generate      # 生成代码
    """
    ctx.ensure_object(dict)
    
    ctx.obj["verbose"] = verbose
    ctx.obj["config_manager"] = ConfigManager(config_path=config)
    
    if verbose:
        console.print(f"[dim]AloneChat v{__version__}[/dim]")
        if config:
            console.print(f"[dim]配置文件: {config}[/dim]")


main.add_command(init.init_command, name="init")
main.add_command(chat.chat_command, name="chat")
main.add_command(generate.generate_command, name="generate")
main.add_command(test.test_command, name="test")
main.add_command(commit.commit_command, name="commit")


if __name__ == "__main__":
    main()
