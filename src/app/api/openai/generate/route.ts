import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDecryptedKey, generateOpenAI, generateOpenAIStream } from "@/lib/providers";
import { GenerateRequestSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { handleApiError } from "@/lib/middleware/errorHandler";

const generateHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const data = GenerateRequestSchema.parse(body);
    const { promptId, model, content, systemPrompt, stream } = data;

    const apiKey = await getDecryptedKey("openai");
    if (!apiKey) {
      return NextResponse.json(
        { error: "No OpenAI API key configured. Add one in Settings." },
        { status: 400 }
      );
    }

    if (stream) {
      const startTime = Date.now();
      let fullContent = "";
      const encoder = new TextEncoder();

      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            const gen = generateOpenAIStream({ apiKey, model, content, systemPrompt });
            let finalMeta: { inputTokens: number; outputTokens: number; costEstimate: number } | null = null;

            for await (const chunk of gen) {
              if (chunk.token) {
                fullContent += chunk.token;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.token })}\n\n`));
              }
              if (chunk.done) {
                finalMeta = {
                  inputTokens: chunk.inputTokens || 0,
                  outputTokens: chunk.outputTokens || 0,
                  costEstimate: chunk.costEstimate || 0,
                };
              }
            }

            const executionTime = (Date.now() - startTime) / 1000;

            const response = await prisma.response.create({
              data: {
                promptId,
                modelName: model,
                content: fullContent,
                tokenCount: finalMeta ? finalMeta.inputTokens + finalMeta.outputTokens : null,
                executionTime,
                costEstimate: finalMeta?.costEstimate || null,
                source: "openai",
              },
            });

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, responseId: response.id })}\n\n`));
            controller.close();
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming fallback
    const startTime = Date.now();
    const result = await generateOpenAI({
      apiKey,
      model,
      content,
      systemPrompt,
    });
    const executionTime = (Date.now() - startTime) / 1000;

    const response = await prisma.response.create({
      data: {
        promptId,
        modelName: model,
        content: result.output,
        tokenCount: result.inputTokens + result.outputTokens,
        executionTime,
        costEstimate: result.costEstimate,
        source: "openai",
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("OpenAI generate error:", error);
    return handleApiError(error);
  }
};

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 10 },
  withCsrfProtection(generateHandler)
);
