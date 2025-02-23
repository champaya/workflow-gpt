import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { google } from "@ai-sdk/google";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { perplexity } from "@ai-sdk/perplexity";

/**
 * AIモデルのプロバイダーを定義
 * 使用モデルを増やす場合はここに追加
 */
export const myProvider = customProvider({
  languageModels: {
    "gemini-2.0-flash-001": openrouter("google/gemini-2.0-flash-001"),
    "gemini-2.0-pro-exp-02-05": google("gemini-2.0-pro-exp-02-05"),
    "gemini-2.0-flash-thinking-exp": google("gemini-2.0-flash-thinking-exp"),
    "gpt-4o-mini": openrouter("openai/gpt-4o-mini"),
    "o1-mini": openrouter("openai/o1-mini"),
    "claude-3.5-haiku-20241022": openrouter(
      "anthropic/claude-3.5-haiku-20241022"
    ),
    "claude-3.5-sonnet": openrouter("anthropic/claude-3.5-sonnet"),
    "deepseek-chat": openrouter("deepseek/deepseek-chat"),
    "deepseek-r1": wrapLanguageModel({
      model: openrouter("deepseek/deepseek-r1"),
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
    }),
    perplexity: perplexity("sonar"),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

/**
 * 使用モデルのリスト
 * 使用モデルを増やす場合はここに追加
 */
export const chatModels: Array<ChatModel> = [
  {
    id: "gemini-2.0-flash-thinking-exp",
    name: "gemini-2.0-flash-thinking-exp",
    description: "Gemini 2.0 Flash Thinking Exp for complex, multi-step tasks",
  },
  {
    id: "gemini-2.0-flash-001",
    name: "gemini-2.0-flash-001",
    description: "Gemini 2.0 Flash 001 for fast, lightweight tasks",
  },
  {
    id: "gemini-2.0-pro-exp-02-05",
    name: "gemini-2.0-pro-exp-02-05",
    description: "Gemini 2.0 Pro Exp 02 05 for complex, multi-step tasks",
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    description: "GPT-4o Mini for complex, multi-step tasks",
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    description: "O1 Mini for complex, multi-step tasks",
  },
  {
    id: "claude-3.5-haiku-20241022",
    name: "claude-3.5-haiku-20241022",
    description: "Claude 3.5 Haiku 20241022 for complex, multi-step tasks",
  },
  {
    id: "claude-3.5-sonnet",
    name: "claude-3.5-sonnet",
    description: "Claude 3.5 Sonnet for complex, multi-step tasks",
  },
  {
    id: "deepseek-chat",
    name: "deepseek-chat",
    description: "DeepSeek Chat for reasoning",
  },
  {
    id: "deepseek-r1",
    name: "deepseek-r1",
    description: "DeepSeek R1 for reasoning",
  },
  {
    id: "perplexity",
    name: "perplexity",
    description: "Perplexity for reasoning",
  },
];
