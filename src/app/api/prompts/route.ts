import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PromptInput } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const isFavorite = searchParams.get("isFavorite");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (isFavorite === "true") {
    where.isFavorite = true;
  }

  if (tag) {
    where.tags = { some: { tag } };
  }

  const [data, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: {
        tags: true,
        _count: { select: { responses: true, versions: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const body: PromptInput = await request.json();

  const prompt = await prisma.prompt.create({
    data: {
      title: body.title,
      content: body.content,
      systemPrompt: body.systemPrompt || null,
      category: body.category || null,
      notes: body.notes || null,
      isFavorite: body.isFavorite || false,
      tags: body.tags?.length
        ? { create: body.tags.map((tag: string) => ({ tag })) }
        : undefined,
      versions: {
        create: {
          content: body.content,
          systemPrompt: body.systemPrompt || null,
          versionNumber: 1,
          changeNote: "Initial version",
        },
      },
    },
    include: { tags: true, versions: true },
  });

  return NextResponse.json(prompt, { status: 201 });
}
