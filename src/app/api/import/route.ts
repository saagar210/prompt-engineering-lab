import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImportPrompt {
  title: string;
  content: string;
  systemPrompt?: string | null;
  category?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
  tags?: string[];
  versions?: {
    content: string;
    systemPrompt?: string | null;
    versionNumber: number;
    changeNote?: string | null;
  }[];
  responses?: {
    modelName: string;
    content: string;
    tokenCount?: number | null;
    executionTime?: number | null;
    source?: string;
    rating?: number | null;
    notes?: string | null;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompts: ImportPrompt[] = body.prompts;

    if (!Array.isArray(prompts)) {
      return NextResponse.json({ error: "Invalid format: expected { prompts: [...] }" }, { status: 400 });
    }

    let count = 0;

    for (const p of prompts) {
      if (!p.title || !p.content) continue;

      await prisma.prompt.create({
        data: {
          title: p.title,
          content: p.content,
          systemPrompt: p.systemPrompt || null,
          category: p.category || null,
          notes: p.notes || null,
          isFavorite: p.isFavorite || false,
          tags: p.tags?.length
            ? { create: p.tags.map((tag) => ({ tag })) }
            : undefined,
          versions: p.versions?.length
            ? {
                create: p.versions.map((v) => ({
                  content: v.content,
                  systemPrompt: v.systemPrompt || null,
                  versionNumber: v.versionNumber,
                  changeNote: v.changeNote || null,
                })),
              }
            : {
                create: {
                  content: p.content,
                  systemPrompt: p.systemPrompt || null,
                  versionNumber: 1,
                  changeNote: "Imported",
                },
              },
          responses: p.responses?.length
            ? {
                create: p.responses.map((r) => ({
                  modelName: r.modelName,
                  content: r.content,
                  tokenCount: r.tokenCount ?? null,
                  executionTime: r.executionTime ?? null,
                  source: r.source || "imported",
                  rating: r.rating ?? null,
                  notes: r.notes ?? null,
                })),
              }
            : undefined,
        },
      });
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
