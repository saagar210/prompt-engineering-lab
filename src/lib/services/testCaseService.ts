import { prisma } from "@/lib/prisma";
import type { TestCase, TestRun } from "@/generated/prisma/client";

// Input types
export interface CreateTestCaseInput {
  promptId: string;
  name: string;
  variables: Record<string, string>;
  expectedOutput?: string;
}

export interface UpdateTestCaseInput {
  name?: string;
  variables?: Record<string, string>;
  expectedOutput?: string;
}

export interface CreateTestRunInput {
  testCaseId: string;
  modelName: string;
  passed: boolean;
  actualOutput?: string;
  error?: string;
  executionTime?: number;
}

// Return types
export interface TestCaseWithRuns extends TestCase {
  runs?: TestRun[];
}

export interface TestCaseWithLatestRun extends Omit<TestCase, 'variables'> {
  variables: Record<string, string>;
  runs?: Array<{
    id: string;
    passed: boolean | null;
    modelName: string;
    createdAt: Date;
  }>;
}

/**
 * Creates a test case
 */
export async function createTestCase(input: CreateTestCaseInput): Promise<TestCase> {
  const testCase = await prisma.testCase.create({
    data: {
      promptId: input.promptId,
      name: input.name,
      variables: JSON.stringify(input.variables),
      expectedOutput: input.expectedOutput || null,
    },
  });

  return testCase;
}

/**
 * Updates a test case
 */
export async function updateTestCase(
  testCaseId: string,
  input: UpdateTestCaseInput
): Promise<TestCase> {
  const updateData: {
    name?: string;
    variables?: string;
    expectedOutput?: string | null;
  } = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.variables !== undefined) {
    updateData.variables = JSON.stringify(input.variables);
  }

  if (input.expectedOutput !== undefined) {
    updateData.expectedOutput = input.expectedOutput || null;
  }

  const testCase = await prisma.testCase.update({
    where: { id: testCaseId },
    data: updateData,
  });

  return testCase;
}

/**
 * Deletes a test case (cascades to test runs via Prisma schema)
 */
export async function deleteTestCase(testCaseId: string): Promise<void> {
  await prisma.testCase.delete({ where: { id: testCaseId } });
}

/**
 * Gets a test case with all its runs
 */
export async function getTestCase(testCaseId: string): Promise<TestCaseWithRuns> {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: { runs: { orderBy: { createdAt: "desc" } } },
  });

  if (!testCase) {
    throw new Error("Test case not found");
  }

  return testCase;
}

/**
 * Lists all test cases for a prompt with their latest run
 */
export async function listTestCases(promptId: string): Promise<TestCaseWithLatestRun[]> {
  const testCases = await prisma.testCase.findMany({
    where: { promptId },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          passed: true,
          modelName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse variables JSON string to object
  return testCases.map(tc => ({
    ...tc,
    variables: JSON.parse(tc.variables || "{}"),
  }));
}

/**
 * Creates a test run result
 */
export async function createTestRun(input: CreateTestRunInput): Promise<TestRun> {
  const testRun = await prisma.testRun.create({
    data: {
      testCaseId: input.testCaseId,
      modelName: input.modelName,
      output: input.actualOutput || input.error || "",
      passed: input.passed,
      executionTime: input.executionTime ?? null,
    },
  });

  return testRun;
}
