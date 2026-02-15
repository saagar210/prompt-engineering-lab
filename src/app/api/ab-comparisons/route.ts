import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ABComparisonSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { withValidation } from "@/lib/middleware/validation";
import { handleApiError } from "@/lib/middleware/errorHandler";

const postHandler = withValidation(ABComparisonSchema, async (data, req) => {
  try {
    // Map schema fields to database fields
    // For ties, use a special "tie" identifier
    const winnerId = data.winner === 'A' ? data.responseIdA :
                     data.winner === 'B' ? data.responseIdB :
                     'tie';

    const comparison = await prisma.aBComparison.create({
      data: {
        responseAId: data.responseIdA,
        responseBId: data.responseIdB,
        winnerId: winnerId,
      },
    });

    return NextResponse.json(comparison, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(postHandler)
);

const getHandler = async (request: NextRequest) => {
  try {
    const responseId = new URL(request.url).searchParams.get("responseId");

    if (responseId) {
      const wins = await prisma.aBComparison.count({
        where: { winnerId: responseId },
      });
      const total = await prisma.aBComparison.count({
        where: {
          OR: [{ responseAId: responseId }, { responseBId: responseId }],
        },
      });
      return NextResponse.json({ responseId, wins, total });
    }

    const comparisons = await prisma.aBComparison.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(comparisons);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
