import { prisma } from "@/lib/prisma";

// Return types
export interface Analytics {
  totals: {
    prompts: number;
    responses: number;
    versions: number;
  };
  totalCost: number;
  costByModel: Record<string, number>;
  promptsByCategory: Record<string, number>;
  responsesByModel: Record<string, number>;
  avgRatingByModel: Record<string, number>;
  promptsByDate: Array<{ date: string; count: number }>;
}

/**
 * Aggregates all analytics metrics
 */
export async function getAnalytics(): Promise<Analytics> {
  const [
    totalPrompts,
    totalResponses,
    totalVersions,
    promptsByCategoryRaw,
    responsesByModelRaw,
    avgRatingByModelRaw,
    promptsOverTime,
    totalCostAgg,
    costByModelAgg,
  ] = await Promise.all([
    // Count totals
    prisma.prompt.count(),
    prisma.response.count(),
    prisma.promptVersion.count(),

    // Group by category
    prisma.prompt.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    // Group by model name
    prisma.response.groupBy({
      by: ["modelName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    // Average rating by model
    prisma.response.groupBy({
      by: ["modelName"],
      _avg: { rating: true },
      where: { rating: { not: null } },
    }),

    // Prompts over time
    prisma.prompt.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Total cost
    prisma.response.aggregate({
      _sum: { costEstimate: true },
    }),

    // Cost by model
    prisma.response.groupBy({
      by: ["modelName"],
      _sum: { costEstimate: true },
      orderBy: { _sum: { costEstimate: "desc" } },
    }),
  ]);

  // Transform data into required format

  // Cost by model as Record<string, number>
  const costByModel: Record<string, number> = {};
  costByModelAgg.forEach((item) => {
    costByModel[item.modelName] = Number((item._sum.costEstimate || 0).toFixed(4));
  });

  // Prompts by category as Record<string, number>
  const promptsByCategory: Record<string, number> = {};
  promptsByCategoryRaw.forEach((item) => {
    const categoryName = item.category || "Uncategorized";
    promptsByCategory[categoryName] = item._count.id;
  });

  // Responses by model as Record<string, number>
  const responsesByModel: Record<string, number> = {};
  responsesByModelRaw.forEach((item) => {
    responsesByModel[item.modelName] = item._count.id;
  });

  // Average rating by model as Record<string, number>
  const avgRatingByModel: Record<string, number> = {};
  avgRatingByModelRaw.forEach((item) => {
    avgRatingByModel[item.modelName] = Number((item._avg.rating || 0).toFixed(2));
  });

  // Aggregate prompts by date
  const dateMap = new Map<string, number>();
  for (const p of promptsOverTime) {
    const date = new Date(p.createdAt).toISOString().slice(0, 10);
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  }
  const promptsByDate = Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    totals: {
      prompts: totalPrompts,
      responses: totalResponses,
      versions: totalVersions,
    },
    totalCost: totalCostAgg._sum.costEstimate || 0,
    costByModel,
    promptsByCategory,
    responsesByModel,
    avgRatingByModel,
    promptsByDate,
  };
}
