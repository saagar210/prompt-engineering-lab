import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [
    totalPrompts,
    totalResponses,
    totalVersions,
    promptsByCategory,
    responsesByModel,
    avgRatingByModel,
    promptsOverTime,
    totalCostAgg,
    costByModelAgg,
  ] = await Promise.all([
    prisma.prompt.count(),
    prisma.response.count(),
    prisma.promptVersion.count(),
    prisma.prompt.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.response.groupBy({
      by: ["modelName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.response.groupBy({
      by: ["modelName"],
      _avg: { rating: true },
      where: { rating: { not: null } },
    }),
    prisma.prompt.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.response.aggregate({
      _sum: { costEstimate: true },
    }),
    prisma.response.groupBy({
      by: ["modelName"],
      _sum: { costEstimate: true },
      orderBy: { _sum: { costEstimate: "desc" } },
    }),
  ]);

  // Aggregate prompts by date
  const dateMap = new Map<string, number>();
  for (const p of promptsOverTime) {
    const date = new Date(p.createdAt).toISOString().slice(0, 10);
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  }
  const promptsByDate = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    totals: {
      prompts: totalPrompts,
      responses: totalResponses,
      versions: totalVersions,
    },
    totalCost: totalCostAgg._sum.costEstimate || 0,
    costByModel: costByModelAgg.map((r) => ({
      model: r.modelName,
      cost: Number((r._sum.costEstimate || 0).toFixed(4)),
    })),
    promptsByCategory: promptsByCategory.map((c) => ({
      category: c.category || "Uncategorized",
      count: c._count.id,
    })),
    responsesByModel: responsesByModel.map((r) => ({
      model: r.modelName,
      count: r._count.id,
    })),
    avgRatingByModel: avgRatingByModel.map((r) => ({
      model: r.modelName,
      avgRating: Number((r._avg.rating || 0).toFixed(2)),
    })),
    promptsByDate,
  });
}
