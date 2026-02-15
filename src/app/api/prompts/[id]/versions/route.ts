import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const versions = await prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { versionNumber: "desc" },
    });

    return NextResponse.json(versions);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
