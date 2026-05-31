import { DynamicProviderPlugin } from "./dynamic"
import { OpenAICompatiblePlugin } from "./openai-compatible"

export const ProviderPlugins = [OpenAICompatiblePlugin, DynamicProviderPlugin]
