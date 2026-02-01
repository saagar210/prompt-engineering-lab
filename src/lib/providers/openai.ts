import OpenAI from "openai";

// Cost per 1M tokens (input/output) — approximate as of 2025
const COST_TABLE: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "o1": { input: 15, output: 60 },
  "o3-mini": { input: 1.1, output: 4.4 },
};

export async function generateOpenAI(params: {
  apiKey: string;
  model: string;
  content: string;
  systemPrompt?: string;
}): Promise<{
  output: string;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
}> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.content });

  const response = await client.chat.completions.create({
    model: params.model,
    messages,
  });

  const choice = response.choices[0];
  const output = choice?.message?.content || "";
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  const costs = COST_TABLE[params.model] || { input: 5, output: 15 };
  const costEstimate =
    (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;

  return { output, inputTokens, outputTokens, costEstimate };
}

export async function* generateOpenAIStream(params: {
  apiKey: string;
  model: string;
  content: string;
  systemPrompt?: string;
}): AsyncGenerator<{ token?: string; done?: boolean; inputTokens?: number; outputTokens?: number; costEstimate?: number }> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: params.content });

  const stream = await client.chat.completions.create({
    model: params.model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  });

  let fullOutput = "";
  let inputTokens = 0;
  let outputTokens = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullOutput += delta;
      yield { token: delta };
    }
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens || 0;
      outputTokens = chunk.usage.completion_tokens || 0;
    }
  }

  const costs = COST_TABLE[params.model] || { input: 5, output: 15 };
  const costEstimate =
    (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;

  yield { done: true, inputTokens, outputTokens, costEstimate };
}
