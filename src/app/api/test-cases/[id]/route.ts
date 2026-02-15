import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TestCaseUpdateSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: { runs: { orderBy: { createdAt: "desc" } } },
    });

    if (!testCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(testCase);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);

const putHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = TestCaseUpdateSchema.parse(body);

    const testCase = await prisma.testCase.update({
      where: { id },
      data: {
        name: data.name,
        variables: data.variables,
        expectedOutput: data.expectedOutput || null,
      },
    });

    return NextResponse.json(testCase);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(putHandler)
);

const deleteHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    await prisma.testCase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(deleteHandler)
);
