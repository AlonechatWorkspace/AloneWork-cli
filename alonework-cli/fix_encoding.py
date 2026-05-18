#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
编码修复脚本 / Encoding Fix Script

修复 Python 文件的编码问题，将乱码的中文字符修复为正确的 UTF-8 编码
Fix encoding issues in Python files, converting garbled Chinese characters to correct UTF-8 encoding
"""

import os
from pathlib import Path
from typing import Optional, Tuple

FILES_TO_FIX = [
    "src/alonework/utils/__init__.py",
    "src/alonework/utils/progress.py",
    "src/alonework/utils/streaming.py",
    "src/alonework/utils/thinking_block.py",
    "src/alonework/utils/logger.py",
    "src/alonework/utils/interactive.py",
    "src/alonework/commands/chat.py",
    "src/alonework/commands/generate.py",
    "src/alonework/commands/commit.py",
    "src/alonework/commands/test.py",
    "src/alonework/commands/agent.py",
    "src/alonework/deepseek/__init__.py",
    "src/alonework/deepseek/context_manager.py",
    "src/alonework/deepseek/prompt_engineer.py",
    "src/alonework/lsp/__init__.py",
    "src/alonework/lsp/client.py",
    "src/alonework/lsp/features.py",
    "src/alonework/mcp/cli.py",
    "src/alonework/mcp/config.py",
    "src/alonework/input/__init__.py",
    "src/alonework/input/session.py",
    "src/alonework/input/history.py",
    "src/alonework/input/key_bindings.py",
    "src/alonework/input/external_editor.py",
    "src/alonework/background/__init__.py",
    "src/alonework/background/manager.py",
    "src/alonework/background/task.py",
    "src/alonework/background/agent_runner.py",
    "src/alonework/agents/__init__.py",
    "src/alonework/agents/definition.py",
    "src/alonework/agents/executor.py",
    "src/alonework/agents/manager.py",
    "src/alonework/chinese/__init__.py",
    "src/alonework/chinese/nlp.py",
    "src/alonework/chinese/code_style.py",
    "src/alonework/code/generator.py",
    "src/alonework/git/__init__.py",
    "src/alonework/git/git_manager.py",
    "src/alonework/git/smart_commit.py",
    "src/alonework/permissions/__init__.py",
    "src/alonework/permissions/manager.py",
    "src/alonework/permissions/prompts.py",
    "src/alonework/permissions/rules.py",
    "src/alonework/planning/__init__.py",
    "src/alonework/execution/__init__.py",
    "src/alonework/slash/__init__.py",
    "src/alonework/slash/executor.py",
    "src/alonework/slash/parser.py",
    "src/alonework/slash/registry.py",
    "src/alonework/slash/custom_loader.py",
    "src/alonework/slash/command_skill_bridge.py",
    "src/alonework/configs/config_loader.py",
    "src/alonework/configs/style_loader.py",
]

SKIP_FILES = [
    "src/alonework/context/__init__.py",
    "src/alonework/session/__init__.py",
    "src/alonework/session/manager.py",
    "src/alonework/session/storage.py",
    "src/alonework/models/__init__.py",
    "src/alonework/config/__init__.py",
    "src/alonework/commands/init.py",
    "src/alonework/cli.py",
    "src/alonework/__init__.py",
]

def detect_encoding(file_path: Path) -> Tuple[str, float]:
    with open(file_path, 'rb') as f:
        raw_data = f.read()
    
    if raw_data.startswith(b'\xff\xfe'):
        return ('utf-16', 1.0)
    if raw_data.startswith(b'\xfe\xff'):
        return ('utf-16-be', 1.0)
    if raw_data.startswith(b'\xef\xbb\xbf'):
        return ('utf-8-sig', 1.0)
    
    try:
        raw_data.decode('utf-8')
        return ('utf-8', 0.9)
    except UnicodeDecodeError:
        pass
    
    try:
        raw_data.decode('gbk')
        return ('gbk', 0.85)
    except UnicodeDecodeError:
        pass
    
    try:
        raw_data.decode('gb2312')
        return ('gb2312', 0.8)
    except UnicodeDecodeError:
        pass
    
    return ('utf-8', 0.5)

def fix_file_encoding(file_path: Path, base_dir: Path) -> bool:
    full_path = base_dir / file_path
    
    if not full_path.exists():
        print(f"  [跳过] 文件不存在: {file_path}")
        return False
    
    print(f"  [检查] {file_path}")
    
    try:
        with open(full_path, 'rb') as f:
            raw_data = f.read()
        
        try:
            content = raw_data.decode('utf-8')
            print(f"  [正常] UTF-8 编码正确")
            return True
        except UnicodeDecodeError:
            pass
        
        try:
            content = raw_data.decode('gbk')
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [修复] GBK -> UTF-8")
            return True
        except UnicodeDecodeError:
            pass
        
        try:
            content = raw_data.decode('gb2312')
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [修复] GB2312 -> UTF-8")
            return True
        except UnicodeDecodeError:
            pass
        
        print(f"  [错误] 无法识别编码")
        return False
        
    except Exception as e:
        print(f"  [异常] {e}")
        return False

def main():
    base_dir = Path(__file__).parent
    print(f"开始修复文件编码...")
    print(f"基础目录: {base_dir}")
    print()
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for file_path in FILES_TO_FIX:
        result = fix_file_encoding(file_path, base_dir)
        if result:
            fixed_count += 1
        else:
            error_count += 1
    
    print()
    print(f"修复完成!")
    print(f"成功: {fixed_count}")
    print(f"失败: {error_count}")
    print(f"跳过: {skipped_count}")

if __name__ == "__main__":
    main()
