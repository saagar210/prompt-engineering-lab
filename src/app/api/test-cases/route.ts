import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TestCaseCreateSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { withValidation } from "@/lib/middleware/validation";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getHandler = async (request: NextRequest) => {
  try {
    const promptId = new URL(request.url).searchParams.get("promptId");
    if (!promptId) {
      return NextResponse.json({ error: "promptId is required" }, { status: 400 });
    }

    const testCases = await prisma.testCase.findMany({
      where: { promptId },
      include: {
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, passed: true, modelName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(testCases);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);

const postHandler = withValidation(TestCaseCreateSchema, async (data, req) => {
  try {
    const testCase = await prisma.testCase.create({
      data: {
        promptId: data.promptId,
        name: data.name,
        variables: data.variables,
        expectedOutput: data.expectedOutput || null,
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(postHandler)
);
