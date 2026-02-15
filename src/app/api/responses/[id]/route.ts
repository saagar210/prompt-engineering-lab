import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResponseUpdateSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { handleApiError } from "@/lib/middleware/errorHandler";

const putHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = ResponseUpdateSchema.parse(body);

    const response = await prisma.response.update({
      where: { id },
      data: {
        rating: data.rating ?? undefined,
        notes: data.notes ?? undefined,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(putHandler)
);

const deleteHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    await prisma.response.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(deleteHandler)
);
