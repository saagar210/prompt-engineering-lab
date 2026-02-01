import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get("promptId");
  const modelName = searchParams.get("modelName");
  const ids = searchParams.get("ids");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (ids) {
    where.id = { in: ids.split(",") };
  } else {
    if (promptId) where.promptId = promptId;
    if (modelName) where.modelName = { contains: modelName };
  }

  const responses = await prisma.response.findMany({
    where,
    include: {
      prompt: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(responses);
}
