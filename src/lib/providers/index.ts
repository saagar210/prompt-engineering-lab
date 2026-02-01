export { generateOpenAI, generateOpenAIStream } from "./openai";
export { generateAnthropic, generateAnthropicStream } from "./anthropic";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function getDecryptedKey(provider: string): Promise<string | null> {
  const apiKey = await prisma.apiKey.findFirst({
    where: { provider },
    orderBy: { createdAt: "desc" },
  });
  if (!apiKey) return null;
  return decrypt(apiKey.encryptedKey);
}
