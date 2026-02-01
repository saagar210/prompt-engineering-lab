import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PromptUpdateInput } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: PromptUpdateInput = await request.json();

  const existing = await prisma.prompt.findUnique({
    where: { id },
    include: { tags: true, versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const contentChanged =
    existing.content !== body.content ||
    existing.systemPrompt !== (body.systemPrompt || null);

  const latestVersion = existing.versions[0]?.versionNumber || 0;

  // Update tags: delete existing and recreate
  await prisma.promptTag.deleteMany({ where: { promptId: id } });

  const prompt = await prisma.prompt.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
      systemPrompt: body.systemPrompt || null,
      category: body.category || null,
      notes: body.notes || null,
      isFavorite: body.isFavorite ?? existing.isFavorite,
      tags: body.tags?.length
        ? { create: body.tags.map((tag: string) => ({ tag })) }
        : undefined,
      versions: contentChanged
        ? {
            create: {
              content: body.content,
              systemPrompt: body.systemPrompt || null,
              versionNumber: latestVersion + 1,
              changeNote: body.changeNote || null,
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
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.prompt.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
