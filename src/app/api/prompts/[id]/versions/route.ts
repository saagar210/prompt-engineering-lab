import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const versions = await prisma.promptVersion.findMany({
    where: { promptId: id },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json(versions);
}
