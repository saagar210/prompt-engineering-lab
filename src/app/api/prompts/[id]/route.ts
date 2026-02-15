import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PromptUpdateSchema } from "@/lib/types";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { withValidation } from "@/lib/middleware/validation";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getPromptHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        tags: true,
        responses: { orderBy: { createdAt: "desc" } },
        versions: { orderBy: { versionNumber: "desc" } },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getPromptHandler
);

const updatePromptHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = PromptUpdateSchema.parse(body);

    const existing = await prisma.prompt.findUnique({
      where: { id },
      include: { tags: true, versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const contentChanged =
      (data.content && existing.content !== data.content) ||
      (data.systemPrompt !== undefined && existing.systemPrompt !== (data.systemPrompt || null));

    const latestVersion = existing.versions[0]?.versionNumber || 0;

    // Update tags: delete existing and recreate if provided
    if (data.tags !== undefined) {
      await prisma.promptTag.deleteMany({ where: { promptId: id } });
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        content: data.content ?? existing.content,
        systemPrompt: data.systemPrompt !== undefined ? (data.systemPrompt || null) : existing.systemPrompt,
        category: data.category !== undefined ? (data.category || null) : existing.category,
        notes: data.notes !== undefined ? (data.notes || null) : existing.notes,
        isFavorite: data.isFavorite ?? existing.isFavorite,
        tags: data.tags?.length
          ? { create: data.tags.map((tag: string) => ({ tag })) }
          : undefined,
        versions: contentChanged
          ? {
              create: {
                content: data.content ?? existing.content,
                systemPrompt: data.systemPrompt !== undefined ? (data.systemPrompt || null) : existing.systemPrompt,
                versionNumber: latestVersion + 1,
                changeNote: data.changeNote || null,
              },
            }
          : undefined,
      },
      include: {
        tags: true,
        responses: { orderBy: { createdAt: "desc" } },
        versions: { orderBy: { versionNumber: "desc" } },
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(updatePromptHandler)
);

const deletePromptHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    await prisma.prompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(deletePromptHandler)
);
