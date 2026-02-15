import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { ApiKeyUpdateSchema } from "@/lib/types";
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
    const data = ApiKeyUpdateSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.provider) updateData.provider = data.provider;
    if (data.label) updateData.label = data.label;
    if (data.key) updateData.encryptedKey = encrypt(data.key);

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: apiKey.id,
      provider: apiKey.provider,
      label: apiKey.label,
    });
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
    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(deleteHandler)
);
