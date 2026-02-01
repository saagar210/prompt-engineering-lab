import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId, model, content, systemPrompt, stream } = body;

    if (!promptId || !model || !content) {
      return NextResponse.json({ error: "promptId, model, and content are required" }, { status: 400 });
    }

    if (stream) {
      const startTime = Date.now();

      const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: content,
          system: systemPrompt || undefined,
          stream: true,
        }),
      });

      if (!ollamaRes.ok || !ollamaRes.body) {
        const errText = await ollamaRes.text();
        return NextResponse.json({ error: `Ollama error: ${errText}` }, { status: 502 });
      }

      const reader = ollamaRes.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let tokenCount = 0;

      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const json = JSON.parse(line);
                  if (json.response) {
                    fullContent += json.response;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: json.response })}\n\n`));
                  }
                  if (json.done) {
                    tokenCount = (json.prompt_eval_count || 0) + (json.eval_count || 0);
                  }
                } catch {
                  // skip malformed lines
                }
              }
            }

            const executionTime = (Date.now() - startTime) / 1000;

            const response = await prisma.response.create({
              data: {
                promptId,
                modelName: model,
                content: fullContent,
                tokenCount: tokenCount || null,
                executionTime,
                source: "ollama",
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

    const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: content,
        system: systemPrompt || undefined,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      return NextResponse.json({ error: `Ollama error: ${errText}` }, { status: 502 });
    }

    const result = await ollamaRes.json();
    const executionTime = (Date.now() - startTime) / 1000;

    const tokenCount =
      (result.prompt_eval_count || 0) + (result.eval_count || 0);

    const response = await prisma.response.create({
      data: {
        promptId,
        modelName: model,
        content: result.response,
        tokenCount: tokenCount || null,
        executionTime,
        source: "ollama",
        rating: null,
        notes: null,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Ollama generate error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
