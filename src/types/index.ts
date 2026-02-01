export interface PromptInput {
  title: string;
  content: string;
  systemPrompt?: string | null;
  category?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
  tags?: string[];
}

export interface PromptUpdateInput extends PromptInput {
  changeNote?: string;
}

export interface ResponseInput {
  promptId: string;
  modelName: string;
  content: string;
  tokenCount?: number | null;
  executionTime?: number | null;
  source?: string;
  rating?: number | null;
  notes?: string | null;
}

export interface ResponseUpdateInput {
  rating?: number | null;
  notes?: string | null;
}

export interface PromptListParams {
  search?: string;
  category?: string;
  tag?: string;
  isFavorite?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TestCaseInput {
  promptId: string;
  name: string;
  variables: Record<string, string>;
  expectedOutput?: string | null;
}

export interface TestRunResult {
  id: string;
  testCaseId: string;
  modelName: string;
  output: string;
  passed: boolean | null;
  executionTime: number | null;
  createdAt: string;
}
