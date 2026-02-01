import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ResponseInput } from "@/types";

export async function POST(request: NextRequest) {
  const body: ResponseInput = await request.json();

  const response = await prisma.response.create({
    data: {
      promptId: body.promptId,
      modelName: body.modelName,
      content: body.content,
      tokenCount: body.tokenCount ?? null,
      executionTime: body.executionTime ?? null,
      source: body.source || "manual",
      rating: body.rating ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
