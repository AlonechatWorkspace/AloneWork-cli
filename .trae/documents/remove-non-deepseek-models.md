# Plan: 删除其他模型支持，仅支持 DeepSeek

## 目标
移除代码库中除 DeepSeek 以外的所有模型和 Provider 支持，仅保留 DeepSeek。

## 实现步骤

### Step 1: 清理 Provider 插件注册列表
**文件**: `packages/core/src/plugin/provider/index.ts`

- 移除所有非 DeepSeek 相关的 Provider 插件导入和注册
- 仅保留以下插件：
  - `OpenAICompatiblePlugin` — DeepSeek 使用 OpenAI Compatible 协议
  - `DynamicProviderPlugin` — 动态加载 AI SDK provider 包（DeepSeek 可能需要）
- 移除的插件包括：Anthropic、OpenAI、Google、GoogleVertex、Azure、AmazonBedrock、Mistral、OpenRouter、Groq、Cerebras、Cohere、DeepInfra、GitHubCopilot、GitLab、Kilo、LLMGateway、Nvidia、Perplexity、SapAICore、TogetherAI、Vercel、Venice、XAI、Zenmux、CloudflareAIGateway、CloudflareWorkersAI、Alibaba、Gateway 等

### Step 2: 修改 ModelsDev 插件，仅注册 DeepSeek
**文件**: `packages/core/src/plugin/models-dev.ts`

- 在 `refresh` 函数中，过滤 `data` 对象，仅保留 `deepseek` 作为 provider
- 其他 provider 数据将被忽略，不注入 Catalog

### Step 3: 清理 LLM 层 Provider Profile（可选精简）
**文件**: `packages/llm/src/providers/openai-compatible-profile.ts`

- 仅保留 `deepseek` profile，移除 `baseten`、`cerebras`、`deepinfra`、`fireworks`、`groq`、`openrouter`、`togetherai`、`xai` 等

**文件**: `packages/llm/src/providers/openai-compatible.ts`

- 仅保留 `deepseek` 导出，移除 `baseten`、`cerebras`、`deepinfra`、`fireworks`、`groq`、`togetherai` 等导出

### Step 4: 清理 LLM 层其他 Provider 定义
**目录**: `packages/llm/src/providers/`

- 检查并清理其他非 DeepSeek 的 provider 定义文件（如 `anthropic.ts`、`openai.ts`、`google.ts` 等）
- 保留文件结构但确保只有 DeepSeek 被导出使用，或者直接移除未使用的文件

### Step 5: 验证
- 从 `packages/core` 运行 `bun typecheck` 确保类型正确
- 从 `packages/llm` 运行 `bun typecheck` 确保类型正确
- 从 `packages/opencode` 运行 `bun typecheck` 确保整体类型正确

## 关键设计决策
- DeepSeek 通过 `@ai-sdk/openai-compatible` 包接入，使用 OpenAI Chat 协议
- 保留 `OpenAICompatiblePlugin` 和 `DynamicProviderPlugin` 以确保 DeepSeek SDK 正常工作
- ModelsDev 数据源（models.dev API）的拉取和缓存逻辑保持不变，仅在注入 Catalog 时过滤为仅 DeepSeek
- 用户自定义 Provider 配置（`opencode.json` 中的 `providers` 字段）保持不受影响，仍可手动添加其他 provider
