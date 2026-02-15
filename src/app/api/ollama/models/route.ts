import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { handleApiError } from "@/lib/middleware/errorHandler";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getHandler = async (_request: NextRequest) => {
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
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
