import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const screenshot = await prisma.screenshot.findUnique({ where: { id } });
  if (!screenshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete file from disk
  try {
    const filepath = path.join(process.cwd(), "public", screenshot.imagePath);
    await unlink(filepath);
  } catch {
    // File may already be missing
  }

  await prisma.screenshot.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
