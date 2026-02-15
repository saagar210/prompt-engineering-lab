# Prompt Lab

A full-stack prompt engineering workbench for developing, testing, and comparing LLM prompts across multiple providers. Built with Next.js 16, Prisma, and Material UI.

## What It Does

**Write and iterate on prompts** with a Monaco-powered editor that supports `{{variable}}` template syntax, system prompts, version history with word-level diffs, and one-click version restore.

**Run prompts against any model** — Ollama (local), OpenAI, or Anthropic — with real-time SSE streaming that shows tokens as they arrive. Switch providers with a tab click; variables are auto-detected and filled via dialog before execution.

**Compare responses side-by-side** from different models or prompt versions. Select any two responses for a word-level diff view, or pick A/B winners to track which model performs best.

**Test prompts systematically** with named test cases that define variable values and expected outputs. Run individual tests or batch-run all cases across any model. Pass/fail results are tracked per run.

**Track cost and performance** through an analytics dashboard showing total prompts, responses, versions, and estimated API spend. Charts break down responses by model, average ratings, cost per model, and prompt creation over time.

**Organize with a searchable library** — filter by category, tag, or favorites. Debounced search, pagination, and import/export for portability.

**Extract text from screenshots** using client-side Tesseract.js OCR, then inject the extracted text directly into your prompt.

## Key Strengths

- **Multi-provider with zero lock-in** — Same prompt runs on Ollama, OpenAI, and Anthropic. API keys are AES-256-GCM encrypted at rest, never stored in plaintext.
- **Real-time streaming** — All three providers stream tokens via SSE with a live preview and blinking cursor. No waiting for the full response.
- **Template variables** — `{{name}}` syntax auto-detected in prompts and system prompts. Fill values manually or via test cases for repeatable evaluations.
- **Version control built in** — Every save creates a versioned snapshot with change notes. Compare any two versions with a visual diff and restore with one click.
- **Response diffing** — Word-level diff view in the compare panel makes it easy to spot how model outputs diverge.
- **Cost visibility** — Cost estimates calculated per request using provider pricing tables. Aggregated in the analytics dashboard by model.
- **Keyboard-driven workflow** — Cmd+S save, Cmd+N new prompt, Cmd+K search, Cmd+/ shortcut help. All wired to global listeners.
- **SQLite by default** — Zero-config local database. No Docker or external services required to get started.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Material UI 7, Emotion, Recharts |
| Editor | Monaco Editor |
| Database | SQLite via Prisma 7 (LibSQL adapter) |
| LLM Providers | OpenAI SDK, Anthropic SDK, Ollama REST |
| OCR | Tesseract.js (client-side) |
| Diff | react-diff-viewer-continued |
| Language | TypeScript (strict mode) |

## Getting Started

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the prompt library.

`npm run dev` and `npm run build` automatically run `prisma generate` first, so the generated client stays in sync after fresh installs.

### Environment Variables

Create a `.env` file in the project root:

```env
# Required — 32-byte hex key for encrypting stored API keys
ENCRYPTION_SECRET=your-64-char-hex-string

# Optional — Ollama base URL (defaults to http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434

# Optional — Database URL (defaults to SQLite file)
DATABASE_URL=file:./dev.db
```

Generate an encryption secret:

```bash
openssl rand -hex 32
```

### Adding API Keys

Navigate to **Settings** and add your OpenAI or Anthropic API keys. Keys are encrypted before storage and decrypted only at request time.

For local models, install and start [Ollama](https://ollama.com) — the app auto-detects available models.

## Project Structure

```
src/
  app/
    api/          # REST API routes (prompts, responses, providers, analytics, etc.)
    prompts/      # Prompt editor and library pages
    analytics/    # Analytics dashboard page
    compare/      # Response comparison page
    settings/     # Settings and API key management page
  components/
    PromptEditor/ # Monaco editor, prompt form, save/delete/clone
    ModelRunner/  # Multi-provider tabs, variable filling, streaming
    Library/      # Searchable prompt grid with filters
    ResponsePanel/# Response cards with rating, markdown toggle
    CompareView/  # Side-by-side comparison with diff toggle
    TestCases/    # Test case CRUD, batch runner
    Analytics/    # Stat cards, charts (Recharts)
    Settings/     # API key manager with encryption
    VersionDiff/  # Version history with visual diff
  lib/
    providers/    # OpenAI and Anthropic SDK wrappers (sync + streaming)
    prisma.ts     # Prisma client singleton
    encryption.ts # AES-256-GCM encrypt/decrypt
    templateUtils.ts # {{variable}} extraction and substitution
```

## Security & Production Features

### Security Hardening
- ✅ **Rate Limiting**: 10 req/min for LLM generation, 100 req/min for mutations
- ✅ **CSRF Protection**: Token-based protection for all mutations
- ✅ **Input Validation**: Zod schema validation on all API endpoints
- ✅ **API Key Encryption**: AES-256-GCM encryption for stored API keys
- ✅ **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP, etc.
- ✅ **Error Boundaries**: Graceful error handling with user-friendly messages

### Testing & Quality
- ✅ **Unit Tests**: Jest with React Testing Library (16 tests passing)
- ✅ **Integration Tests**: API route testing with mocked Prisma
- ✅ **TypeScript Strict Mode**: Zero compilation errors
- ✅ **ESLint**: Clean baseline with documented exceptions
- ✅ **CI/CD**: GitHub Actions workflow for automated verification

### Deployment
- ✅ **Docker Support**: Multi-stage build with health checks
- ✅ **Production-Ready**: Non-root user, secure defaults
- ✅ **Environment Management**: Comprehensive .env.example
- ✅ **Database Migrations**: Automated with Prisma

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run TypeScript type checking
npm run typecheck

# Run linter
npm run lint
```

## Docker Deployment

```bash
# Set encryption secret
export ENCRYPTION_SECRET=$(openssl rand -hex 32)

# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t prompt-lab .
docker run -p 3000:3000 \
  -e ENCRYPTION_SECRET=$ENCRYPTION_SECRET \
  -v $(pwd)/data:/app/data \
  prompt-lab
```
