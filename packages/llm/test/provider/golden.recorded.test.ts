import * as OpenAICompatible from "../../src/providers/openai-compatible"
import { describeRecordedGoldenScenarios } from "../recorded-golden"

const deepseek = OpenAICompatible.deepseek
  .configure({ apiKey: process.env.DEEPSEEK_API_KEY ?? "fixture" })
  .model("deepseek-chat")

describeRecordedGoldenScenarios([
  {
    name: "DeepSeek Chat",
    prefix: "openai-compatible-chat",
    model: deepseek,
    requires: ["DEEPSEEK_API_KEY"],
    scenarios: ["text"],
  },
])
