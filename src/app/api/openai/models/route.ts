import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "o1",
      "o3-mini",
    ],
  });
}
