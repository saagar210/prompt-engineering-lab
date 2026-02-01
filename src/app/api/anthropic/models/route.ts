import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
    ],
  });
}
