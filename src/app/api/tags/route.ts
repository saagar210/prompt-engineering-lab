import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getHandler = async (request: NextRequest) => {
  try {
    const tags = await prisma.promptTag.findMany({
      select: { tag: true },
      distinct: ["tag"],
      orderBy: { tag: "asc" },
    });

    return NextResponse.json(tags.map((t: { tag: string }) => t.tag));
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
