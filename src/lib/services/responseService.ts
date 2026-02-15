import { prisma } from "@/lib/prisma";
import type { Response } from "@/generated/prisma/client";

// Input types
export interface CreateResponseInput {
  promptId: string;
  modelName: string;
  content: string;
  tokenCount?: number;
  executionTime?: number;
  costEstimate?: number;
  rating?: number;
  notes?: string;
  source?: string;
}

export interface UpdateResponseInput {
  rating?: number;
  notes?: string;
}

export interface SearchResponsesFilters {
  promptId?: string;
  modelName?: string;
  ids?: string[];
}

// Return types
export interface ResponseWithPrompt extends Response {
  prompt?: {
    id: string;
    title: string;
  };
}

/**
 * Creates a response record
 */
export async function createResponse(input: CreateResponseInput): Promise<Response> {
  const response = await prisma.response.create({
    data: {
      promptId: input.promptId,
      modelName: input.modelName,
      content: input.content,
      tokenCount: input.tokenCount ?? null,
      executionTime: input.executionTime ?? null,
      costEstimate: input.costEstimate ?? null,
      source: input.source || "manual",
      rating: input.rating ?? null,
      notes: input.notes ?? null,
    },
  });

  return response;
}

/**
 * Updates a response's rating and/or notes
 */
export async function updateResponse(
  responseId: string,
  input: UpdateResponseInput
): Promise<Response> {
  const response = await prisma.response.update({
    where: { id: responseId },
    data: {
      rating: input.rating ?? undefined,
      notes: input.notes ?? undefined,
    },
  });

  return response;
}

/**
 * Deletes a response
 */
export async function deleteResponse(responseId: string): Promise<void> {
  await prisma.response.delete({ where: { id: responseId } });
}

/**
 * Searches responses by promptId, modelName, or specific IDs
 */
export async function searchResponses(
  filters: SearchResponsesFilters = {}
): Promise<ResponseWithPrompt[]> {
  const { promptId, modelName, ids } = filters;

  // Build where clause
  const where: {
    id?: { in: string[] };
    promptId?: string;
    modelName?: { contains: string };
  } = {};

  if (ids && ids.length > 0) {
    where.id = { in: ids };
  } else {
    if (promptId) {
      where.promptId = promptId;
    }
    if (modelName) {
      where.modelName = { contains: modelName };
    }
  }

  const responses = await prisma.response.findMany({
    where,
    include: {
      prompt: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return responses;
}
