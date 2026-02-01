import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Ollama not available" }, { status: 502 });
    }

    const data = await res.json();
    const models = (data.models || []).map((m: { name: string; size: number; modified_at: string }) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
    }));

    return NextResponse.json(models);
  } catch {
    return NextResponse.json({ error: "Cannot connect to Ollama" }, { status: 502 });
  }
}
