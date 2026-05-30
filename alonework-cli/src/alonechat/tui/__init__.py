"""
AloneChat TUI - 交互式终端界面

模仿 Claude Code 和 DeepSeek TUI 的交互式界面：
- 欢迎面板显示版本和提示
- 状态栏显示模型、目录、使用量
- Composer 输入区域支持 /command 形式
- 自动语言切换（中文/English）
"""

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
import json
import os
import sys
import asyncio
import locale as stdlib_locale

from rich.console import Console, Group
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.layout import Layout
from rich.live import Live
from rich.prompt import Prompt
from rich.style import Style
from rich.align import Align

console = Console()


def detect_system_locale() -> str:
    try:
        lang = os.environ.get("LANG", "") or os.environ.get("LC_ALL", "") or os.environ.get("LC_CTYPE", "")
        if lang:
            code = lang.split(".")[0].split("_")[0]
            if code.startswith("zh"):
                return "zh-Hans"
            if code in ("ja", "ko", "pt", "es", "fr", "de", "ru"):
                return code
        sys_locale = stdlib_locale.getdefaultlocale()[0] or ""
        if sys_locale.startswith("zh"):
            return "zh-Hans"
        if sys_locale.split("_")[0] in ("ja", "ko"):
            return sys_locale.split("_")[0]
    except Exception:
        pass
    return "en"


def load_translations(locale_code: str) -> Dict[str, str]:
    translations_dir = Path(__file__).parent.parent / "configs" / "locales"
    file_path = translations_dir / f"{locale_code}.json"
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    fallback = translations_dir / "en.json"
    if fallback.exists():
        with open(fallback, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


class I18nTUI:
    def __init__(self, locale: Optional[str] = None):
        self._locale = locale or detect_system_locale()
        self._translations: Dict[str, str] = {}
        self._load()
    
    def _load(self) -> None:
        self._translations = load_translations(self._locale)
    
    @property
    def locale(self) -> str:
        return self._locale
    
    def switch(self, locale: str) -> bool:
        if locale in ("en", "zh-Hans", "zh-Hant", "ja", "ko"):
            self._locale = locale
            self._load()
            return True
        return False
    
    def t(self, key: str, **kwargs) -> str:
        text = self._translations.get(key)
        if text is None:
            en = load_translations("en")
            text = en.get(key, key)
        if kwargs:
            try:
                text = text.format(**kwargs)
            except (KeyError, IndexError):
                pass
        return text
    
    @property
    def is_chinese(self) -> bool:
        return self._locale.startswith("zh")


_i18n: Optional[I18nTUI] = None


def get_i18n() -> I18nTUI:
    global _i18n
    if _i18n is None:
        _i18n = I18nTUI()
    return _i18n


@dataclass
class TUIConfig:
    app_name: str = "AloneWork"
    version: str = "0.2.3"
    model: str = "deepseek-v4-flash"
    effort: str = "high"
    show_tips: bool = True
    show_whats_new: bool = True


class WelcomePanel:
    def __init__(self, config: TUIConfig, i18n: I18nTUI):
        self.config = config
        self.i18n = i18n
    
    def render(self, cwd: Path, api_key_masked: str = "sk-****") -> Panel:
        t = self.i18n.t
        lines = []
        
        lines.append("")
        lines.append(f"[bold cyan]{t('welcome.title', version=self.config.version)}[/bold cyan]")
        lines.append("")
        
        tips_key = "welcome.tips"
        if self.i18n.is_chinese:
            tips = [
                t('welcome.tips'),
                "使用 /help 查看所有可用命令",
                "按 Ctrl+C 退出，Ctrl+D 清空输入",
            ]
        else:
            tips = [
                "Run /init to create a CLAUDE.md file",
                "Use /help to see all available commands",
                "Press Ctrl+C to exit, Ctrl+D to clear input",
            ]
        
        lines.append(f"[bold]{t('welcome.tips_title')}[/bold]")
        for tip in tips[:3]:
            lines.append(f"  [dim]•[/dim] {tip}")
        lines.append("")
        
        whats_new_key = "whats_new_title"
        if self.i18n.is_chinese:
            new_items = [
                "新增多智能体协作系统（Supervisor-Worker）",
                "新增工作流编排引擎",
                "新增数据收集与训练数据导出",
                "新增环境管理命令",
            ]
        else:
            new_items = [
                "Added multi-agent collaboration (Supervisor-Worker)",
                "Added workflow orchestration engine",
                "Added data collection and training export",
                "Added environment management commands",
            ]
        
        lines.append(f"[bold]{t(whats_new_key)}[/bold]")
        for item in new_items[:2]:
            lines.append(f"  [dim]•[/dim] {item}")
        lines.append("")
        
        api_label = t('api_billing', key_val=api_key_masked)
        lines.append(f"[dim]{api_label}[/dim]")
        lines.append(f"[dim]{cwd}[/dim]")
        lines.append("")
        release_note = t('release_notes')
        lines.append(f"[dim]{release_note}[/dim]")
        
        return Panel(
            "\n".join(lines),
            border_style="cyan",
            padding=(1, 2),
        )


class StatusBar:
    def __init__(self, config: TUIConfig, i18n: I18nTUI):
        self.config = config
        self.i18n = i18n
        self.agent_name = os.environ.get("USERNAME", "User")
        self.progress = 0
    
    def render(self) -> str:
        t = self.i18n.t
        model_str = f"[bold cyan]{self.config.model}[/bold cyan]"
        agent_str = f"[bold green]{self.agent_name}[/bold green]"
        
        progress_bar = self._render_progress()
        
        agent_label = t('status.agent', name=self.agent_name)
        auto_label = t('status.auto')
        ver_label = t('status.version', version=self.config.version)
        
        if self.i18n.is_chinese:
            return f"{agent_label} · {model_str}  🐳  · {auto_label}  {self.progress}% {progress_bar}  {ver_label}"
        else:
            return f"{agent_label} · {model_str}  🐳  · {auto_label}  {self.progress}% {progress_bar}  {ver_label}"
    
    def _render_progress(self) -> str:
        filled = int(self.progress / 10)
        empty = 10 - filled
        return f"[cyan]{'▰' * filled}[/cyan][dim]{'▱' * empty}[/dim]"


class WorkPanel:
    def __init__(self, i18n: I18nTUI):
        self.i18n = i18n
        self.tasks: List[Dict[str, Any]] = []
        self.output_lines: List[str] = []
    
    def add_task(self, task: str, status: str = "pending") -> None:
        self.tasks.append({"task": task, "status": status})
    
    def add_output(self, line: str) -> None:
        self.output_lines.append(line)
    
    def render(self, height: int = 15) -> Panel:
        t = self.i18n.t
        lines = []
        
        work_title = t('work.title')
        no_active = t('work.no_active')
        tasks_label = t('work.tasks')
        
        if self.tasks:
            lines.append(f"[bold]{tasks_label}[/bold]")
            for task in self.tasks[-5:]:
                status_icon = "✓" if task["status"] == "done" else "○"
                status_color = "green" if task["status"] == "done" else "yellow"
                lines.append(f"  [{status_color}]{status_icon}[/{status_color}] {task['task']}")
        else:
            lines.append(f"[dim]{no_active}[/dim]")
        
        for _ in range(height - len(lines) - 2):
            lines.append("")
        
        if self.output_lines:
            output_label = t('work.output')
            lines.append(f"[dim]─── {output_label} ───[/dim]")
            lines.extend(self.output_lines[-3:])
        
        return Panel(
            "\n".join(lines),
            title=f"[bold]{work_title}[/bold]",
            border_style="dim",
        )


class Composer:
    def __init__(self, config: TUIConfig, i18n: I18nTUI):
        self.config = config
        self.i18n = i18n
        self.history: List[str] = []
        self.placeholder = i18n.t('composer.placeholder')
        self._completer = None
        self._executor = None
    
    def set_executor(self, executor) -> None:
        """设置命令执行器用于补全 / Set command executor for completion"""
        self._executor = executor
        from alonechat.tui.completer import create_completer_from_executor
        self._completer = create_completer_from_executor(executor)
    
    def render(self, current_input: str = "") -> Panel:
        t = self.i18n.t
        composer_title = t('composer.placeholder').split()[0] if self.i18n.is_chinese else "Composer"
        
        if current_input:
            content = f"[bold cyan]>[/bold cyan] {current_input}"
        else:
            content = f"[dim]{self.placeholder}[/dim]"
        
        return Panel(
            content,
            title=f"[bold]{composer_title}[/bold]",
            border_style="cyan",
        )
    
    def get_input(self) -> str:
        try:
            from prompt_toolkit import prompt
            from prompt_toolkit.history import InMemoryHistory
            from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
            from prompt_toolkit.shortcuts import CompleteStyle
            
            history = InMemoryHistory()
            
            for item in self.history[-100:]:
                history.append_string(item)
            
            completer = self._completer
            auto_suggest = AutoSuggestFromHistory()
            
            message = [
                ("class:prompt", "> ")
            ]
            
            result = prompt(
                message=message,
                completer=completer,
                history=history,
                auto_suggest=auto_suggest,
                multiline=False,
                complete_while_typing=True,
                enable_history_search=True,
                style=self._get_prompt_style(),
                key_bindings=self._get_prompt_bindings(),
                complete_style=CompleteStyle.MULTI_COLUMN,
                complete_in_thread=True,
                reserve_space_for_menu=12,
                enable_open_in_editor=False,
                refresh_interval=0.1,
            )
            
            if result:
                masked = AloneChatTUI._mask_sensitive(result)
                if masked != result:
                    console.print(f"[dim]  输入已隐藏敏感信息 / Input masked for security[/dim]")
                self.history.append(masked)
            return result or ""
            
        except (KeyboardInterrupt, EOFError):
            return "/exit"
    
    def _get_prompt_bindings(self):
        """获取键盘绑定 / Get key bindings - Tab自动补全"""
        from prompt_toolkit.key_binding import KeyBindings
        
        kb = KeyBindings()
        
        @kb.add('escape')
        def _(event):
            event.current_buffer.text = ""
        
        @kb.add('c-c')
        def _(event):
            event.exit_exception = KeyboardInterrupt()
        
        @kb.add('tab')
        def _(event):
            """Tab键：自动补全当前选中项 / Tab: Auto-complete current selection"""
            buffer = event.current_buffer
            if buffer.complete_state:
                buffer.complete_next()
            else:
                buffer.start_completion(select_first=True)
        
        return kb
    
    def _get_prompt_style(self):
        """获取提示样式 / Get prompt style - Claude Code风格"""
        from prompt_toolkit.styles import Style
        
        return Style.from_dict({
            'prompt': '#00ffff bold',
            'completion-menu': 'bg:#0d1117 #c9d1d9',
            'completion-menu.completion': '#58a6ff',
            'completion-menu.completion.current': 'bg:#1f6feb #ffffff bold',
            'completion-menu.meta': '#8b949e italic',
            'scrollbar.background': '#21262d',
            'scrollbar.button': '#30363d',
            'scrollbar.arrow': '#8b949e',
            'bottom-toolbar': '#161b22 #c9d1d9',
            'bottom-toolbar.text': '#8b949e',
        })


class AloneChatTUI:
    def __init__(
        self,
        obj: Optional[dict] = None,
        config: Optional[TUIConfig] = None,
        session_manager: Optional[Any] = None,
        locale: Optional[str] = None,
    ):
        self.obj = obj or {}
        self.config = config or TUIConfig()
        self.i18n = I18nTUI(locale=locale)
        self.session_manager = session_manager
        self.welcome = WelcomePanel(self.config, self.i18n)
        self.status_bar = StatusBar(self.config, self.i18n)
        self.work = WorkPanel(self.i18n)
        self.composer = Composer(self.config, self.i18n)
        self.running = True
        self.cwd = Path.cwd()
        self._slash_executor = None
    
    def _get_slash_executor(self):
        if self._slash_executor is None:
            from alonechat.slash.executor import SlashCommandExecutor
            self._slash_executor = SlashCommandExecutor(
                obj=self.obj,
                session_manager=self.session_manager,
            )
        return self._slash_executor
    
    def show_welcome(self) -> None:
        console.clear()
        
        api_key = self._detect_api_key()
        if api_key:
            api_key_masked = f"sk-{api_key[3:7]}...{api_key[-4:]}"
            os.environ["DEEPSEEK_API_KEY"] = api_key
        else:
            api_key_masked = "Not configured" if not self.i18n.is_chinese else "未配置"
        
        console.print(self.welcome.render(self.cwd, api_key_masked))
        console.print()
        console.print(self.status_bar.render())
        console.print()
        
        if not api_key:
            init_hint = (
                "[yellow]提示: 检测到未配置 API Key，请运行 /init 配置[/yellow]"
                if self.i18n.is_chinese else
                "[yellow]Tip: No API key detected. Run /init to configure.[/yellow]"
            )
            console.print(init_hint)
            console.print()
    
    def _detect_api_key(self) -> Optional[str]:
        env_key = os.environ.get("DEEPSEEK_API_KEY", "")
        if env_key and len(env_key) > 10:
            return env_key
        
        config_path = Path.home() / ".alonechatrc"
        key_file = Path.home() / ".alonechat_key"
        
        try:
            if key_file.exists():
                from alonechat.config.manager import ConfigManager
                mgr = ConfigManager(config_path)
                decrypted = mgr.decrypt_api_key(key_file.read_text(encoding="utf-8").strip())
                if decrypted and len(decrypted) > 10:
                    return decrypted
        except Exception:
            pass
        
        return None
    
    @staticmethod
    def _mask_sensitive(text: str) -> str:
        import re
        patterns = [
            (r'(sk-[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})', r'\1****\2'),
            (r'([a-zA-Z0-9+/]{8})[a-zA-Z0-9+/=]{12,}={0,2}', r'\1****...'),
        ]
        result = text
        for pattern, repl in patterns:
            result = re.sub(pattern, repl, result)
        return result
    
    def show_main(self) -> None:
        console.clear()
        
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=1),
            Layout(name="body", ratio=1),
            Layout(name="composer", size=3),
        )
        
        layout["header"].update(
            Align.center(
                Text(f"{self.config.app_name} v{self.config.version}", style="bold cyan")
            )
        )
        layout["body"].update(self.work.render())
        layout["composer"].update(self.composer.render())
        
        console.print(layout)
    
    def process_command(self, command: str) -> bool:
        t = self.i18n.t
        command = command.strip()
        
        if not command:
            return True
        
        if command in ("/exit", "/quit", "/q"):
            goodbye = t('goodbye')
            console.print(f"[dim]{goodbye}![/dim]")
            return False
        
        if command in ("/clear", "/cls"):
            console.clear()
            return True
        
        if command == "/help":
            self.show_help()
            return True
        
        if command.startswith("/lang"):
            parts = command.split(maxsplit=1)
            if len(parts) > 1:
                lang = parts[1].strip()
                if self.i18n.switch(lang):
                    lang_info = self.i18n.t(f'status.model', self.i18n.locale)
                    console.print(f"[green]Language switched to {lang}[/green]")
                    self.composer.placeholder = self.i18n.t('composer.placeholder')
                else:
                    console.print(f"[red]Unsupported language: {lang}. Supported: en, zh-Hans[/red]")
            else:
                current = self.i18n.locale
                console.print(f"[dim]Current language: {current}[/dim]")
                console.print("[dim]Usage: /lang <locale> (en, zh-Hans)[/dim]")
            return True
        
        if command.startswith("/"):
            return self._execute_slash_command(command)
        
        return self._process_query(command)
    
    def _execute_slash_command(self, command: str) -> bool:
        t = self.i18n.t
        try:
            executor = self._get_slash_executor()
            parts = command.split(maxsplit=1)
            cmd_name = parts[0][1:]
            args = parts[1] if len(parts) > 1 else ""
            
            result = executor.execute(cmd_name, args)
            
            if result:
                console.print(result)
            
            return True
            
        except Exception as e:
            error_msg = t('error.error', msg=str(e))
            console.print(f"[red]{error_msg}[/red]")
            return True
    
    def _process_query(self, query: str) -> bool:
        self.work.add_task(query, "running")
        
        processing_label = "处理中:" if self.i18n.is_chinese else "Processing:"
        console.print(f"\n[bold cyan]{processing_label}[/bold cyan] {query}")
        
        try:
            from alonechat.commands.chat import start_interactive_with_query
            if self.session_manager:
                start_interactive_with_query(
                    self.obj,
                    initial_query=query,
                    session_manager=self.session_manager,
                )
            else:
                hint = "[dim]Session manager not initialized. Use /init first.[/dim]" if not self.i18n.is_chinese else "[dim]会话管理器未初始化，请先使用 /init[/dim]"
                console.print(hint)
        
        except Exception as e:
            error_msg = self.i18n.t('error.error', msg=str(e))
            console.print(f"[red]{error_msg}[/red]")
        
        self.work.tasks[-1]["status"] = "done"
        return True
    
    def show_help(self) -> None:
        t = self.i18n.t
        console.print()
        
        help_title = t('help.title')
        table = Table(title=help_title, show_header=False)
        table.add_column("Command", style="cyan")
        table.add_column("Description", style="dim")
        
        if self.i18n.is_chinese:
            commands = [
                ("/help", "显示帮助信息"),
                ("/init", "初始化项目配置"),
                ("/model", "切换或查看当前模型"),
                ("/config", "管理配置"),
                ("/status", "查看当前状态"),
                ("/stats", "使用统计"),
                ("/cost", "成本信息"),
                ("/clear", "清屏"),
                ("/exit", "退出 AloneChat"),
                ("/lang <语言>", "切换语言 (en, zh-Hans)"),
                ("", ""),
                ("数据命令:", ""),
                ("/data collect", "收集交互数据"),
                ("/data export", "导出训练数据"),
                ("/data stats", "数据统计"),
                ("", ""),
                ("工作流命令:", ""),
                ("/workflow create", "创建工作流"),
                ("/workflow run", "执行工作流"),
                ("/workflow plan", "规划任务"),
                ("", ""),
                ("环境命令:", ""),
                ("/env status", "环境状态"),
                ("/env checkpoint", "创建检查点"),
            ]
        else:
            commands = [
                ("/help", "Show this help message"),
                ("/init", "Initialize project configuration"),
                ("/model", "Switch or show current model"),
                ("/config", "Manage configuration"),
                ("/status", "Show current status"),
                ("/stats", "Show usage statistics"),
                ("/cost", "Show cost information"),
                ("/clear", "Clear screen"),
                ("/exit", "Exit AloneChat"),
                ("/lang <locale>", "Switch language (en, zh-Hans)"),
                ("", ""),
                ("Data Commands:", ""),
                ("/data collect", "Collect interaction data"),
                ("/data export", "Export training data"),
                ("/data stats", "Show data statistics"),
                ("", ""),
                ("Workflow Commands:", ""),
                ("/workflow create", "Create a new workflow"),
                ("/workflow run", "Execute a workflow"),
                ("/workflow plan", "Plan a task"),
                ("", ""),
                ("Environment Commands:", ""),
                ("/env status", "Show environment status"),
                ("/env checkpoint", "Create a checkpoint"),
            ]
        
        for cmd, desc in commands:
            if cmd and not cmd.endswith(":"):
                table.add_row(cmd, desc)
            elif cmd:
                table.add_row(f"[bold]{cmd}[/bold]", "")
            else:
                table.add_row("", "")
        
        console.print(table)
        console.print()
    
    def run(self) -> None:
        self.show_welcome()
        
        executor = self._get_slash_executor()
        self.composer.set_executor(executor)
        
        while self.running:
            try:
                command = self.composer.get_input()
                
                if not self.process_command(command):
                    self.running = False
                
            except KeyboardInterrupt:
                press_exit = self.i18n.t('press_exit')
                console.print(f"\n[dim]{press_exit}[/dim]")
            except EOFError:
                self.running = False
    
    async def run_async(self) -> None:
        self.show_welcome()
        
        executor = self._get_slash_executor()
        self.composer.set_executor(executor)
        
        while self.running:
            try:
                command = self.composer.get_input()
                
                if not self.process_command(command):
                    self.running = False
                
            except KeyboardInterrupt:
                press_exit = self.i18n.t('press_exit')
                console.print(f"\n[dim]{press_exit}[/dim]")
            except EOFError:
                self.running = False


def start_tui(
    obj: Optional[dict] = None,
    session_manager: Optional[Any] = None,
    config: Optional[TUIConfig] = None,
    locale: Optional[str] = None,
) -> None:
    tui = AloneChatTUI(obj=obj, config=config, session_manager=session_manager, locale=locale)
    tui.run()


async def start_tui_async(
    obj: Optional[dict] = None,
    session_manager: Optional[Any] = None,
    config: Optional[TUIConfig] = None,
    locale: Optional[str] = None,
) -> None:
    tui = AloneChatTUI(obj=obj, config=config, session_manager=session_manager, locale=locale)
    await tui.run_async()
