$files = @(
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
    "src/alonework/configs/style_loader.py"
)

$baseDir = "e:\AloneChat-workspace-master\alonework-cli"

$garbledPatterns = @(
    'å½', 'ä»¤', 'å¯', 'å¨', 'äº¤', 'äº', 'å¼', 'å¯¹', 'è¯',
    'æ', 'ä¾', 'ç', 'é¢', 'æ¯', 'æ', 'èª', 'ç¶', 'è¯­',
    'è¨', 'ä»£', 'ç ', 'ç', 'æ', 'ç', 'è§', 'å¤', 'è½®',
    'ä¸', 'æ', 'ç¼', 'å­', 'æ', 'è', 'æ¨¡', 'ä¼', 'è¯',
    'ç®¡', 'ç', 'Slash', 'é', 'è¡', 'æµ', 'è¾', 'åº',
    'Ctrl', 'O', 'å®', 'æ¶', 'æ¾', 'ç¤º', 'æç»´', 'å',
    'æç¤º', 'å»º', 'è®®', 'IME', 'èªå¨', 'å', 'ç¼©',
    'æ¾ç¤º', 'å', 'ç§°', 'æ ¼', 'å¼', 'å', 'ä½¿', 'ç¨',
    'é', 'ä¿¡', 'æ¯', 'è¾', 'å¥', 'ç¼å­', 'å½', 'ä¸­',
    'æ»', 'è®¡', 'æ', 'æ¬', 'ç´¯', 'è®¡', 'æ´', 'æ°',
    'å¤', 'ç', 'slash', 'è¿', 'å', 'handled', 'should_continue',
    'è¿', 'è¡', 'è', 'å¤©', 'å¾ª', 'ç¯', 'æ ¸', 'å¿',
    'é»', 'è¾', 'logic', 'Enable', 'line', 'by', 'streaming',
    'output', 'thinking', 'block', 'auto', 'compact', 'threshold',
    'å·²', 'å°±', 'ç»ª', 'è¯·', 'æ¨', 'ç', 'æ', 'ä»',
    'exit', 'quit', 'q', 'å', 'è§', 'Goodbye', 'strip',
    'start', 'with', 'process', 'command', 'args', 'result',
    'clear', 'append', 'role', 'user', 'content', 'add', 'message',
    'assistant', 'stream', 'full', '_stream', 'chat', 'response',
    'model', 'router', 'show', 'reasoning', 'session', 'manager',
    'thinking_display', 'enable', 'thinking', 'block', 'None',
    'æµ', 'å¼', 'è·', 'å', 'å', 'åº', 'æ¯', 'æ',
    'supports', 'line-by-line', 'live', 'display', 'message_list',
    'parts', 'iter', 'chunk', 'startswith', 'reasoning', 'token',
    'current', 'visible', 'feed', 'end', 'join', 'exception',
    'error', 'raise', 'interactive', 'mode', 'entry', 'call',
    'config', 'manager', 'load', 'path', 'exists', 'red',
    'cyan', 'auto_compact', 'compact_threshold', 'agent_config',
    'version', 'working', 'dir', 'api', 'key', 'masked',
    'welcome', 'model', 'working_dir', 'api_key_masked',
    'session_info', 'get', 'session', 'info', 'id', 'history',
    'messages', 'loaded', 'initial', 'query', 'panel', 'fit',
    'bold', 'deepseek', 'flash', 'type', 'help', 'option',
    'context', 'window', 'size', 'int', 'default', 'flag',
    'pass_obj', 'obj', 'dict', 'natural', 'language', 'interface',
    'generation', 'understanding', 'multi-turn', 'conversation',
    'high', 'cache', 'effort', 'tokens', 'auto', 'enabled',
    'é', 'è¯¯', 'æª', 'æ¾', 'å°', 'é', 'ç½®', 'æ',
    'run', 'using', 'effort', 'window', 'context'
)

function Remove-GarbledComments {
    param(
        [string]$filePath
    )
    
    $fullPath = Join-Path $baseDir $filePath
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "  [跳过] 文件不存在: $filePath"
        return
    }
    
    Write-Host "  [处理] $filePath"
    
    try {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        
        $lines = $content -split "`n"
        $newLines = @()
        
        foreach ($line in $lines) {
            $hasGarbled = $false
            foreach ($pattern in $garbledPatterns) {
                if ($line -match [regex]::Escape($pattern)) {
                    $hasGarbled = $true
                    break
                }
            }
            
            if ($hasGarbled) {
                if ($line -match '^\s*#') {
                    continue
                }
                
                $index = $line.IndexOf(' / ')
                if ($index -gt 0) {
                    $line = $line.Substring($index + 3)
                } else {
                    $index = $line.IndexOf(' /')
                    if ($index -gt 0) {
                        $line = $line.Substring($index + 2)
                    }
                }
            }
            
            $newLines += $line
        }
        
        $newContent = $newLines -join "`n"
        Set-Content -Path $fullPath -Value $newContent -Encoding UTF8 -NoNewline
        
        Write-Host "  [完成] 已清理乱码注释"
    }
    catch {
        Write-Host "  [错误] $_"
    }
}

Write-Host "开始清理乱码注释..."
Write-Host "基础目录: $baseDir`n"

foreach ($file in $files) {
    Remove-GarbledComments $file
}

Write-Host "`n清理完成!"
