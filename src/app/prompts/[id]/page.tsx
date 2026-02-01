import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromptEditorPage from "@/components/PromptEditor/PromptEditorPage";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      tags: true,
      responses: { orderBy: { createdAt: "desc" } },
      versions: { orderBy: { versionNumber: "desc" } },
    },
  });

  if (!prompt) notFound();

  // JSON round-trip to serialize Date objects for client component
  const serialized = JSON.parse(JSON.stringify(prompt));

  return <PromptEditorPage initialData={serialized} />;
}
