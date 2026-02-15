import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResponseCreateSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { withValidation } from "@/lib/middleware/validation";
import { handleApiError } from "@/lib/middleware/errorHandler";

const postHandler = withValidation(ResponseCreateSchema, async (data, req) => {
  try {
    const response = await prisma.response.create({
      data: {
        promptId: data.promptId,
        modelName: data.modelName,
        content: data.content,
        tokenCount: data.tokenCount ?? null,
        executionTime: data.executionTime ?? null,
        costEstimate: data.costEstimate ?? null,
        source: data.source || "manual",
        rating: data.rating ?? null,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(postHandler)
);
