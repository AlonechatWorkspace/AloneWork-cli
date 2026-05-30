"""
Slash命令自动补全器 / Slash Command Auto-Completer

提供类似Claude Code的Tab补全功能 / Provides Claude Code-like Tab completion:
- 输入 / 显示所有可用命令列表 / Type / to show all available commands
- 双列布局: 命令+别名 | 详细描述 / Two-column layout: command+aliases | detailed description
- Tab键自动补全 / Tab key auto-completes
- 支持模糊搜索 / Supports fuzzy search
"""

from typing import List, Optional, Tuple
from prompt_toolkit.completion import Completer, Completion
from prompt_toolkit.document import Document

from alonechat.slash.registry import SlashCommandRegistry, SlashCommand


class SlashCommandCompleter(Completer):
    """
    Slash命令自动补全器 / Slash Command Auto-Completer
    
    实现prompt_toolkit的Completer接口 / Implements prompt_toolkit's Completer interface
    模仿Claude Code的双列补全菜单样式 / Mimics Claude Code's two-column completion menu style
    """
    
    def __init__(self, registry: Optional[SlashCommandRegistry] = None):
        self._registry = registry or SlashCommandRegistry()
        self._commands_cache: Optional[List[SlashCommand]] = None
        self._max_description_width = 80
    
    @property
    def registry(self) -> SlashCommandRegistry:
        return self._registry
    
    def set_registry(self, registry: SlashCommandRegistry) -> None:
        """设置命令注册表 / Set command registry"""
        self._registry = registry
        self._commands_cache = None
    
    def _get_all_commands(self) -> List[SlashCommand]:
        """获取所有命令（带缓存）/ Get all commands (with caching)"""
        if self._commands_cache is None:
            self._commands_cache = self._registry.list_commands()
            self._commands_cache.sort(key=lambda c: c.name)
        return self._commands_cache
    
    def _format_command_display(self, cmd: SlashCommand) -> str:
        """
        格式化命令显示文本 / Format command display text
        
        格式: /command (alias1, alias2)
        """
        if cmd.aliases:
            aliases_str = ", ".join(cmd.aliases[:2])
            return f"/{cmd.name} ({aliases_str})"
        return f"/{cmd.name}"
    
    def _wrap_description(self, description: str, max_width: int = 70) -> str:
        """
        自动换行描述文字 / Word-wrap description text
        
        保持单词完整性 / Preserve word integrity
        """
        if len(description) <= max_width:
            return description
        
        lines = []
        current_line = ""
        
        for word in description.split(" "):
            if len(current_line) + len(word) + 1 <= max_width:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return "\n".join(lines)
    
    def _create_display_text(self, cmd: SlashCommand) -> Tuple[str, str]:
        """
        创建显示文本对 / Create display text pair
        
        Returns:
            (command_text, description_text): 命令文本和描述文本
        """
        command_text = self._format_command_display(cmd)
        description_text = self._wrap_description(cmd.description, self._max_description_width)
        
        return (command_text, description_text)
    
    def get_completions(self, document: Document, complete_event=None):
        """
        获取补全建议 / Get completion suggestions
        
        Args:
            document: 当前文档内容 / Current document content
            complete_event: 补全事件 / Completion event
            
        Yields:
            Completion对象 / Completion objects with rich formatting
        """
        text = document.text_before_cursor
        
        if not text.startswith("/"):
            return
        
        prefix = text[1:].lower() if len(text) > 1 else ""
        
        matched_commands = []
        
        for cmd in self._get_all_commands():
            if not prefix:
                matched_commands.append((cmd, 0))
            elif cmd.name.lower().startswith(prefix):
                matched_commands.append((cmd, 0))
            elif any(alias.lower().startswith(prefix) for alias in cmd.aliases):
                matched_commands.append((cmd, 1))
        
        matched_commands.sort(key=lambda x: (x[1], x[0].name))
        
        for cmd, _ in matched_commands:
            command_text, description_text = self._create_display_text(cmd)
            
            completion_text = f"{cmd.name} "
            
            if prefix and len(prefix) < len(cmd.name):
                start_position = -len(prefix)
                insert_text = f"{cmd.name[len(prefix):]} "
            else:
                start_position = -len(text)
                insert_text = completion_text
            
            yield Completion(
                text=insert_text,
                start_position=start_position,
                display=command_text,
                display_meta=description_text,
                style="#00ffff",
                selected_style="bg:#00ffff fg:#000000 bold",
            )
    
    def invalidate_cache(self) -> None:
        """清除缓存 / Clear cache"""
        self._commands_cache = None


class MultiLineCompletionFormatter:
    """
    多行补全格式化器 / Multi-line Completion Formatter
    
    用于自定义补全菜单的显示样式 / Used for customizing completion menu display style
    """
    
    @staticmethod
    def format_completion_menu(completions: List[Tuple[str, str]], 
                                max_width: int = 100) -> List[str]:
        """
        格式化补全菜单 / Format completion menu
        
        Args:
            completions: [(command, description), ...] 补全列表
            max_width: 最大宽度
            
        Returns:
            格式化后的行列表 / Formatted line list
        """
        if not completions:
            return []
        
        max_cmd_len = max(len(cmd) for cmd, _ in completions)
        max_cmd_len = min(max_cmd_len, 35)
        
        formatted_lines = []
        for cmd, desc in completions:
            desc_width = max_width - max_cmd_len - 4
            
            if len(desc) > desc_width:
                words = desc.split()
                wrapped_desc = ""
                current_line = ""
                
                for word in words:
                    if len(current_line) + len(word) + 1 <= desc_width:
                        wrapped_desc += (" " + word if wrapped_desc else word)
                        current_line += (" " + word if current_line else word)
                    else:
                        if wrapped_desc:
                            wrapped_desc += "\n" + " " * (max_cmd_len + 4) + word
                            current_line = word
                        else:
                            wrapped_desc = word
                            current_line = word
                
                desc = wrapped_desc
            
            line = f"  {cmd:<{max_cmd_len}}  {desc}"
            formatted_lines.append(line)
        
        return formatted_lines


def create_completer_from_executor(executor) -> SlashCommandCompleter:
    """
    从执行器创建补全器 / Create completer from executor
    
    Args:
        executor: Slash命令执行器 / Slash command executor
        
    Returns:
        命令补全器实例 / Command completer instance
    """
    completer = SlashCommandCompleter(registry=executor.registry)
    return completer
