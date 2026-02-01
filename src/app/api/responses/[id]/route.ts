import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ResponseUpdateInput } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: ResponseUpdateInput = await request.json();

  const response = await prisma.response.update({
    where: { id },
    data: {
      rating: body.rating ?? undefined,
      notes: body.notes ?? undefined,
    },
  });

  return NextResponse.json(response);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.response.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
