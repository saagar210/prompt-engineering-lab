import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testCase = await prisma.testCase.findUnique({
    where: { id },
    include: { runs: { orderBy: { createdAt: "desc" } } },
  });

  if (!testCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(testCase);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const testCase = await prisma.testCase.update({
    where: { id },
    data: {
      name: body.name,
      variables: typeof body.variables === "string" ? body.variables : JSON.stringify(body.variables || {}),
      expectedOutput: body.expectedOutput || null,
    },
  });

  return NextResponse.json(testCase);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.testCase.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
