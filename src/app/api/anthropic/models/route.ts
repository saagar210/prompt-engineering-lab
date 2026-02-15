import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/rateLimit";
import { handleApiError } from "@/lib/middleware/errorHandler";

const getHandler = async (request: NextRequest) => {
  try {
    return NextResponse.json({
      models: [
        "claude-sonnet-4-20250514",
        "claude-3-5-haiku-20241022",
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229",
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
};

export const GET = withRateLimit(
  { windowMs: 60000, maxRequests: 100 },
  getHandler
);
