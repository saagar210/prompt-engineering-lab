import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PromptCreateSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { withValidation } from "@/lib/middleware/validation";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getPromptsHandler = async (request: NextRequest) => {
  try {
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
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getPromptsHandler
);

const createPromptHandler = withValidation(PromptCreateSchema, async (data, req) => {
  try {
    const prompt = await prisma.prompt.create({
      data: {
        title: data.title,
        content: data.content,
        systemPrompt: data.systemPrompt || null,
        category: data.category || null,
        notes: data.notes || null,
        isFavorite: data.isFavorite || false,
        tags: data.tags?.length
          ? { create: data.tags.map((tag: string) => ({ tag })) }
          : undefined,
        versions: {
          create: {
            content: data.content,
            systemPrompt: data.systemPrompt || null,
            versionNumber: 1,
            changeNote: "Initial version",
          },
        },
      },
      include: { tags: true, versions: true },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(createPromptHandler)
);
