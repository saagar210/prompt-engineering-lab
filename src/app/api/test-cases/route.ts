import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, name, variables, expectedOutput } = body;

  if (!promptId || !name) {
    return NextResponse.json({ error: "promptId and name are required" }, { status: 400 });
  }

  const testCase = await prisma.testCase.create({
    data: {
      promptId,
      name,
      variables: typeof variables === "string" ? variables : JSON.stringify(variables || {}),
      expectedOutput: expectedOutput || null,
    },
  });

  return NextResponse.json(testCase, { status: 201 });
}
