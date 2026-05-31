import { Config } from "effect"
import type { Auth } from "../src/route/auth"
import type { ModelFactory } from "../src/route/auth-options"
import * as OpenAICompatible from "../src/providers/openai-compatible"

type BaseOptions = {
  readonly baseURL?: string
  readonly headers?: Record<string, string>
}

type Model = {
  readonly id: string
}

declare const auth: Auth
declare const optionalAuthModel: ModelFactory<BaseOptions, "optional", Model>
declare const requiredAuthModel: ModelFactory<BaseOptions, "required", Model>
const configApiKey = Config.redacted("DEEPSEEK_API_KEY")

optionalAuthModel("deepseek-chat")
optionalAuthModel("deepseek-chat", {})
optionalAuthModel("deepseek-chat", { apiKey: "sk-test" })
optionalAuthModel("deepseek-chat", { apiKey: configApiKey })
optionalAuthModel("deepseek-chat", { auth })
optionalAuthModel("deepseek-chat", { auth, baseURL: "https://gateway.example.com/v1" })
optionalAuthModel("deepseek-chat", { apiKey: "sk-test", headers: { "x-source": "test" } })

// @ts-expect-error auth is an override, so apiKey cannot be supplied with it.
optionalAuthModel("deepseek-chat", { apiKey: "sk-test", auth })

requiredAuthModel("custom-model", { apiKey: "key" })
requiredAuthModel("custom-model", { apiKey: configApiKey })
requiredAuthModel("custom-model", { auth })
requiredAuthModel("custom-model", { auth, headers: { "x-tenant-id": "tenant" } })

// @ts-expect-error providers without config fallback need apiKey or auth.
requiredAuthModel("custom-model")

// @ts-expect-error providers without config fallback need apiKey or auth.
requiredAuthModel("custom-model", {})

// @ts-expect-error auth is an override, so apiKey cannot be supplied with it.
requiredAuthModel("custom-model", { apiKey: "key", auth })

OpenAICompatible.deepseek.configure({ apiKey: "deepseek-key" }).model("deepseek-chat")
// @ts-expect-error OpenAI-compatible family selectors only accept model ids.
OpenAICompatible.deepseek.configure({ apiKey: "deepseek-key" }).model("deepseek-chat", {})
