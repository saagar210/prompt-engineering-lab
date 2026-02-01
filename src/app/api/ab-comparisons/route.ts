import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { responseAId, responseBId, winnerId } = await request.json();

  if (!responseAId || !responseBId || !winnerId) {
    return NextResponse.json(
      { error: "responseAId, responseBId, and winnerId are required" },
      { status: 400 }
    );
  }

  const comparison = await prisma.aBComparison.create({
    data: { responseAId, responseBId, winnerId },
  });

  return NextResponse.json(comparison, { status: 201 });
}

export async function GET(request: NextRequest) {
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
}
