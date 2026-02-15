import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get("promptId");
    const modelName = searchParams.get("modelName");
    const ids = searchParams.get("ids");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (ids) {
      where.id = { in: ids.split(",") };
    } else {
      if (promptId) where.promptId = promptId;
      if (modelName) where.modelName = { contains: modelName };
    }

    const responses = await prisma.response.findMany({
      where,
      include: {
        prompt: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(responses);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
