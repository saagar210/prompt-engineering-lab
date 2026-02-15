import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { substituteVariables } from "@/lib/templateUtils";
import { TestRunSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { handleApiError } from "@/lib/middleware/errorHandler";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const postHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: { prompt: true },
    });

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 });
    }

    const variables = JSON.parse(testCase.variables || "{}");
    const content = substituteVariables(testCase.prompt.content, variables);
    const systemPrompt = testCase.prompt.systemPrompt
      ? substituteVariables(testCase.prompt.systemPrompt, variables)
      : undefined;

    // Default to first available Ollama model
    const modelsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    const modelsData = await modelsRes.json();
    const modelName = modelsData.models?.[0]?.name;

    if (!modelName) {
      return NextResponse.json({ error: "No Ollama models available" }, { status: 502 });
    }

    const startTime = Date.now();

    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: content,
        system: systemPrompt,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      return NextResponse.json({ error: "Ollama generation failed" }, { status: 502 });
    }

    const result = await ollamaRes.json();
    const executionTime = (Date.now() - startTime) / 1000;
    const output = result.response || "";

    // Determine pass/fail
    let passed: boolean | null = null;
    if (testCase.expectedOutput) {
      passed = output.trim().toLowerCase().includes(testCase.expectedOutput.trim().toLowerCase());
    }

    const testRun = await prisma.testRun.create({
      data: {
        testCaseId: id,
        modelName,
        output,
        passed,
        executionTime,
      },
    });

    return NextResponse.json(testRun, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 20 },
  withCsrfProtection(postHandler)
);
