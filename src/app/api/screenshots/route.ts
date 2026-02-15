import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { withCsrfProtection } from "@/lib/middleware/csrf";
import { handleApiError } from "@/lib/middleware/errorHandler";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const postHandler = async (request: NextRequest) => {
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
    return handleApiError(error);
  }
};

export const POST = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  withCsrfProtection(postHandler)
);

const getHandler = async (request: NextRequest) => {
  try {
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
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
