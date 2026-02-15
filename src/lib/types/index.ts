import { z } from 'zod';

// ============ VALIDATION SCHEMAS ============

export const PromptCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  systemPrompt: z.string().max(10000).optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

export const PromptUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  systemPrompt: z.string().max(10000).optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  changeNote: z.string().max(200).optional(),
});

export const GenerateRequestSchema = z.object({
  promptId: z.string().min(1),
  model: z.string().min(1),
  content: z.string().min(1),
  systemPrompt: z.string().optional(),
  stream: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(10000).optional(),
});

export const TestCaseCreateSchema = z.object({
  promptId: z.string().min(1),
  name: z.string().min(1).max(200),
  variables: z.string(),  // JSON string validated separately
  expectedOutput: z.string().max(10000).optional(),
});

export const TestCaseUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  variables: z.string().optional(),
  expectedOutput: z.string().max(10000).optional(),
});

export const TestRunSchema = z.object({
  modelName: z.string().min(1),
  provider: z.enum(['ollama', 'openai', 'anthropic']).default('ollama'),
});

export const BatchRunSchema = z.object({
  promptId: z.string().min(1),
  provider: z.enum(['ollama', 'openai', 'anthropic']),
  modelName: z.string().min(1),
});

export const ResponseCreateSchema = z.object({
  promptId: z.string().min(1),
  modelName: z.string().min(1),
  content: z.string(),
  tokenCount: z.number().optional(),
  executionTime: z.number().optional(),
  costEstimate: z.number().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const ResponseUpdateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export const ApiKeyCreateSchema = z.object({
  provider: z.string().min(1),
  label: z.string().optional(),
  key: z.string().min(1),
});

export const ApiKeyUpdateSchema = z.object({
  provider: z.string().min(1).optional(),
  label: z.string().optional(),
  key: z.string().min(1).optional(),
});

export const ABComparisonSchema = z.object({
  responseIdA: z.string().min(1),
  responseIdB: z.string().min(1),
  winner: z.enum(['A', 'B', 'tie']),
  notes: z.string().optional(),
});

// ============ TYPE INTERFACES ============

export interface Prompt {
  id: string;
  title: string;
  content: string;
  systemPrompt: string | null;
  category: string | null;
  notes: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  versions?: PromptVersion[];
  tags?: PromptTag[];
  responses?: Response[];
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  content: string;
  systemPrompt: string | null;
  changeNote: string | null;
  createdAt: Date;
}

export interface PromptTag {
  id: string;
  promptId: string;
  tag: string;
}

export interface Response {
  id: string;
  promptId: string;
  modelName: string;
  content: string;
  tokenCount: number | null;
  executionTime: number | null;
  costEstimate: number | null;
  rating: number | null;
  notes: string | null;
  source: string | null;
  createdAt: Date;
}

export interface TestCase {
  id: string;
  promptId: string;
  name: string;
  variables: Record<string, string>;
  expectedOutput: string | null;
  runs?: TestRun[];
}

export interface TestRun {
  id: string;
  testCaseId: string;
  modelName: string;
  passed: boolean;
  actualOutput: string | null;
  error: string | null;
  createdAt: Date;
}

export interface GenerateRequest {
  promptId: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  variables?: Record<string, string>;
}

export interface GenerateResponse {
  responseId: string;
  promptId: string;
  modelName: string;
  content: string;
  tokenCount: number;
  executionTime: number;
  costEstimate: number;
  createdAt: Date;
}

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

// Inferred types from Zod schemas
export type PromptCreateInput = z.infer<typeof PromptCreateSchema>;
export type PromptUpdateInput = z.infer<typeof PromptUpdateSchema>;
export type GenerateRequestInput = z.infer<typeof GenerateRequestSchema>;
export type TestCaseCreateInput = z.infer<typeof TestCaseCreateSchema>;
export type TestCaseUpdateInput = z.infer<typeof TestCaseUpdateSchema>;
export type TestRunInput = z.infer<typeof TestRunSchema>;
export type BatchRunInput = z.infer<typeof BatchRunSchema>;
export type ResponseCreateInput = z.infer<typeof ResponseCreateSchema>;
export type ResponseUpdateInput = z.infer<typeof ResponseUpdateSchema>;
export type ApiKeyCreateInput = z.infer<typeof ApiKeyCreateSchema>;
export type ApiKeyUpdateInput = z.infer<typeof ApiKeyUpdateSchema>;
export type ABComparisonInput = z.infer<typeof ABComparisonSchema>;
