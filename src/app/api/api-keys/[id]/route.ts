import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { provider, label, key } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (provider) data.provider = provider;
  if (label) data.label = label;
  if (key) data.encryptedKey = encrypt(key);

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    id: apiKey.id,
    provider: apiKey.provider,
    label: apiKey.label,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
