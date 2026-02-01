-- AlterTable
ALTER TABLE "responses" ADD COLUMN "cost_estimate" REAL;

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "expected_output" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_cases_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_case_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "passed" BOOLEAN,
    "execution_time" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_runs_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ab_comparisons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "response_a_id" TEXT NOT NULL,
    "response_b_id" TEXT NOT NULL,
    "winner_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
