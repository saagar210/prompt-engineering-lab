import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const promptId = formData.get("promptId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name) || ".png";
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const imagePath = `/uploads/${filename}`;

    const screenshot = await prisma.screenshot.create({
      data: {
        promptId: promptId || null,
        imagePath,
        extractedText: null,
      },
    });

    return NextResponse.json(screenshot, { status: 201 });
  } catch (error) {
    console.error("Screenshot upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get("promptId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (promptId) where.promptId = promptId;

  const screenshots = await prisma.screenshot.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(screenshots);
}
