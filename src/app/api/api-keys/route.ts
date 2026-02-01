import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Mask the keys for display
  const masked = keys.map((k) => ({
    id: k.id,
    provider: k.provider,
    label: k.label,
    maskedKey: "••••" + k.encryptedKey.slice(-4),
    createdAt: k.createdAt,
  }));

  return NextResponse.json(masked);
}

export async function POST(request: NextRequest) {
  const { provider, label, key } = await request.json();

  if (!provider || !label || !key) {
    return NextResponse.json(
      { error: "provider, label, and key are required" },
      { status: 400 }
    );
  }

  const encryptedKey = encrypt(key);

  const apiKey = await prisma.apiKey.create({
    data: { provider, label, encryptedKey },
  });

  return NextResponse.json(
    {
      id: apiKey.id,
      provider: apiKey.provider,
      label: apiKey.label,
      maskedKey: "••••" + key.slice(-4),
    },
    { status: 201 }
  );
}
