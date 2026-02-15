# Service Layer

This directory contains the business logic layer for the Prompt Engineering Lab application. All services are reusable, testable, and independent of HTTP concerns.

## Overview

The service layer extracts business logic from API routes, making the code:
- **Reusable**: Services can be called from API routes, scripts, or tests
- **Testable**: Pure business logic without HTTP dependencies
- **Maintainable**: Single source of truth for business operations

## Services

### 1. promptService.ts
Handles all prompt-related operations including versioning.

**Functions:**
- `createPrompt(input)` - Creates prompt with tags and initial v1
- `updatePrompt(promptId, input)` - Updates prompt, auto-versions on content change
- `getPrompt(promptId)` - Gets prompt with all relations
- `listPrompts(filters)` - Lists prompts with pagination, search, filters
- `deletePrompt(promptId)` - Deletes prompt (cascades via Prisma)
- `getPromptVersions(promptId)` - Gets all versions

### 2. responseService.ts
Manages AI model responses and ratings.

**Functions:**
- `createResponse(input)` - Creates response record
- `updateResponse(responseId, input)` - Updates rating/notes
- `deleteResponse(responseId)` - Deletes response
- `searchResponses(filters)` - Searches by promptId, modelName, or IDs

### 3. testCaseService.ts
Handles test cases and test runs.

**Functions:**
- `createTestCase(input)` - Creates test case
- `updateTestCase(testCaseId, input)` - Updates test case
- `deleteTestCase(testCaseId)` - Deletes test case
- `getTestCase(testCaseId)` - Gets test case with runs
- `listTestCases(promptId)` - Lists test cases for a prompt
- `createTestRun(testCaseId, result)` - Creates test run result

### 4. analyticsService.ts
Aggregates analytics and metrics.

**Functions:**
- `getAnalytics()` - Returns all analytics metrics

## Usage Examples

### In API Routes

```typescript
import { createPrompt, updatePrompt } from "@/lib/services";
import { handleApiError } from "@/lib/middleware/errorHandler";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const prompt = await createPrompt(data);
    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### In Server Actions

```typescript
"use server";
import { listPrompts } from "@/lib/services";

export async function getPromptList(filters: ListPromptsFilters) {
  return await listPrompts(filters);
}
```

### In Tests

```typescript
import { createPrompt, getPrompt } from "@/lib/services";

describe("promptService", () => {
  it("should create a prompt with version", async () => {
    const prompt = await createPrompt({
      title: "Test",
      content: "Content",
    });
    expect(prompt.versions).toHaveLength(1);
  });
});
```

## Error Handling

Services throw errors that should be caught by the caller. Use `handleApiError` in API routes:

```typescript
try {
  const result = await someService();
  return NextResponse.json(result);
} catch (error) {
  return handleApiError(error); // Converts to proper HTTP response
}
```

## Type Safety

All services use proper TypeScript types from Prisma client:

```typescript
import type { Prompt, PromptVersion } from "@/generated/prisma/client";
```

Input and output types are exported from each service file for reuse.
