import { prisma } from "@/lib/prisma";
import type { Prompt, PromptVersion } from "@/generated/prisma/client";

// Input types
export interface CreatePromptInput {
  title: string;
  content: string;
  systemPrompt?: string;
  category?: string;
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface UpdatePromptInput extends Partial<CreatePromptInput> {
  changeNote?: string;
}

export interface ListPromptsFilters {
  search?: string;
  category?: string;
  tag?: string;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
}

// Return types
export interface PromptWithRelations extends Prompt {
  tags: Array<{ id: string; promptId: string; tag: string }>;
  versions?: PromptVersion[];
  responses?: Array<{
    id: string;
    promptId: string;
    modelName: string;
    content: string;
    tokenCount: number | null;
    executionTime: number | null;
    costEstimate: number | null;
    rating: number | null;
    notes: string | null;
    source: string;
    createdAt: Date;
  }>;
  _count?: {
    responses: number;
    versions: number;
  };
}

export interface ListPromptsResult {
  data: PromptWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Creates a new prompt with tags and initial version (v1)
 */
export async function createPrompt(input: CreatePromptInput): Promise<PromptWithRelations> {
  const prompt = await prisma.prompt.create({
    data: {
      title: input.title,
      content: input.content,
      systemPrompt: input.systemPrompt || null,
      category: input.category || null,
      notes: input.notes || null,
      isFavorite: input.isFavorite || false,
      tags: input.tags?.length
        ? { create: input.tags.map((tag) => ({ tag })) }
        : undefined,
      versions: {
        create: {
          content: input.content,
          systemPrompt: input.systemPrompt || null,
          versionNumber: 1,
          changeNote: "Initial version",
        },
      },
    },
    include: {
      tags: true,
      versions: true
    },
  });

  return prompt;
}

/**
 * Updates a prompt and auto-versions when content or systemPrompt changes
 */
export async function updatePrompt(
  promptId: string,
  input: UpdatePromptInput
): Promise<PromptWithRelations> {
  // Get existing prompt with tags and latest version
  const existing = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: {
      tags: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1
      }
    },
  });

  if (!existing) {
    throw new Error("Prompt not found");
  }

  // Check if content or systemPrompt changed
  const contentChanged =
    (input.content && existing.content !== input.content) ||
    (input.systemPrompt !== undefined && existing.systemPrompt !== (input.systemPrompt || null));

  const latestVersion = existing.versions[0]?.versionNumber || 0;

  // Update tags: delete existing and recreate if provided
  if (input.tags !== undefined) {
    await prisma.promptTag.deleteMany({ where: { promptId } });
  }

  const prompt = await prisma.prompt.update({
    where: { id: promptId },
    data: {
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      systemPrompt: input.systemPrompt !== undefined
        ? (input.systemPrompt || null)
        : existing.systemPrompt,
      category: input.category !== undefined
        ? (input.category || null)
        : existing.category,
      notes: input.notes !== undefined
        ? (input.notes || null)
        : existing.notes,
      isFavorite: input.isFavorite ?? existing.isFavorite,
      tags: input.tags?.length
        ? { create: input.tags.map((tag) => ({ tag })) }
        : undefined,
      versions: contentChanged
        ? {
            create: {
              content: input.content ?? existing.content,
              systemPrompt: input.systemPrompt !== undefined
                ? (input.systemPrompt || null)
                : existing.systemPrompt,
              versionNumber: latestVersion + 1,
              changeNote: input.changeNote || null,
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

  return prompt;
}

/**
 * Gets a single prompt with all relations (tags, responses, versions)
 */
export async function getPrompt(promptId: string): Promise<PromptWithRelations> {
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: {
      tags: true,
      responses: { orderBy: { createdAt: "desc" } },
      versions: { orderBy: { versionNumber: "desc" } },
    },
  });

  if (!prompt) {
    throw new Error("Prompt not found");
  }

  return prompt;
}

/**
 * Lists prompts with pagination, search, and filters
 */
export async function listPrompts(filters: ListPromptsFilters = {}): Promise<ListPromptsResult> {
  const {
    search = "",
    category,
    tag,
    isFavorite,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: {
    OR?: Array<Record<string, unknown>>;
    category?: string;
    isFavorite?: boolean;
    tags?: { some: { tag: string } };
  } = {};

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

  if (isFavorite === true) {
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

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Deletes a prompt (cascades to versions, tags, responses via Prisma schema)
 */
export async function deletePrompt(promptId: string): Promise<void> {
  await prisma.prompt.delete({ where: { id: promptId } });
}

/**
 * Gets all versions for a prompt
 */
export async function getPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const versions = await prisma.promptVersion.findMany({
    where: { promptId },
    orderBy: { versionNumber: "desc" },
  });

  return versions;
}
