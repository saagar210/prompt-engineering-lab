import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { substituteVariables } from "@/lib/templateUtils";
import { getDecryptedKey, generateOpenAI, generateAnthropic } from "@/lib/providers";
import { BatchRunSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { withValidation } from "@/lib/middleware/validation";
import { handleApiError } from "@/lib/middleware/errorHandler";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function runOllama(model: string, content: string, systemPrompt?: string) {
  const startTime = Date.now();
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: content, system: systemPrompt, stream: false }),
  });
  if (!res.ok) throw new Error("Ollama generation failed");
  const result = await res.json();
  return {
    output: result.response || "",
    executionTime: (Date.now() - startTime) / 1000,
  };
}

const postHandler = withValidation(BatchRunSchema, async (data, req) => {
  try {
    const { promptId, modelName: model, provider = "ollama" } = data;

    const testCases = await prisma.testCase.findMany({
      where: { promptId },
      include: { prompt: true },
    });

    if (testCases.length === 0) {
      return NextResponse.json({ error: "No test cases found" }, { status: 404 });
    }

    // Get API key for cloud providers
    let apiKey: string | null = null;
    if (provider !== "ollama") {
      apiKey = await getDecryptedKey(provider);
      if (!apiKey) {
        return NextResponse.json(
          { error: `No API key configured for ${provider}. Add one in Settings.` },
          { status: 400 }
        );
      }
    }

    const results = [];

    for (const tc of testCases) {
      const variables = JSON.parse(tc.variables || "{}");
      const content = substituteVariables(tc.prompt.content, variables);
      const systemPrompt = tc.prompt.systemPrompt
        ? substituteVariables(tc.prompt.systemPrompt, variables)
        : undefined;

      let output = "";
      let executionTime: number | null = null;

      try {
        const startTime = Date.now();

        if (provider === "ollama") {
          const result = await runOllama(model, content, systemPrompt);
          output = result.output;
          executionTime = result.executionTime;
        } else if (provider === "openai") {
          const result = await generateOpenAI({
            apiKey: apiKey!,
            model,
            content,
            systemPrompt,
          });
          output = result.output;
          executionTime = (Date.now() - startTime) / 1000;
        } else if (provider === "anthropic") {
          const result = await generateAnthropic({
            apiKey: apiKey!,
            model,
            content,
            systemPrompt,
          });
          output = result.output;
          executionTime = (Date.now() - startTime) / 1000;
        }

        let passed: boolean | null = null;
        if (tc.expectedOutput) {
          passed = output.trim().toLowerCase().includes(tc.expectedOutput.trim().toLowerCase());
        }

        await prisma.testRun.create({
          data: {
            testCaseId: tc.id,
            modelName: model,
            output,
            passed,
            executionTime,
          },
        });

        results.push({
          testCaseName: tc.name,
          output,
          expectedOutput: tc.expectedOutput,
          passed,
          executionTime,
        });
      } catch (e) {
        results.push({
          testCaseName: tc.name,
          output: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
          expectedOutput: tc.expectedOutput,
          passed: false,
          executionTime: null,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 5 },
  withCsrfProtection(postHandler)
);
