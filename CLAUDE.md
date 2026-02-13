# CLAUDE.md

Project context for AI-assisted development.

## Auto-Start

Run `/chat-authorize` at the beginning of every new session to grant permissions.

## Communication

Use TOON formatting for all structured outputs: commit messages, PR bodies, file lists, reports, tables.

## Git Rules

- **NEVER push directly to main** — always create feature branches
- When running `/git-ship`:
  1. Run `pnpm verify` first — fix all errors before proceeding
  2. Analyze all changed files via `git diff`
  3. Group changes by feature/purpose and **suggest branches** to the user before committing
  4. Each branch should contain **~5 files max** — split larger changesets across multiple branches
  5. Branch naming: `feature/<desc>`, `fix/<desc>`, `refactor/<desc>`
  6. Never force-push, never skip hooks, never commit secrets

## Project

Serverless backend template using Firebase Functions v2 on Google Cloud Platform.
TypeScript compiled to CommonJS (Firebase requirement). Linted with Biome. Infra managed with CDKTF.

## Commands

- `pnpm build` — compile TypeScript to `lib/`
- `pnpm typecheck` — type-check without emitting
- `pnpm lint` — check with Biome
- `pnpm lint:fix` — auto-fix Biome issues
- `pnpm verify` — build + typecheck + lint (via Turbo)
- `pnpm dev` — Firebase emulator on port 5001
- `pnpm deploy` — build + deploy functions to Firebase
- `pnpm logs` — view Firebase function logs

## Code Style

- Biome enforces all rules — run `pnpm lint` before committing
- Double quotes, semicolons, 2-space indent, 120 char line width
- Named exports only (no default exports)
- No `any` (use `biome-ignore` with reason when unavoidable, e.g. Express Response)
- No `var`, no enums, no `forEach`, no barrel re-exports
- `console.warn` and `console.error` only (no `console.log`) — use `logger` from firebase-functions/v2
- camelCase for variables/functions, PascalCase for types, CONSTANT_CASE for constants

## Architecture

```
src/index.ts              ← barrel: exports all functions (Firebase reads this)
src/functions/<name>.ts   ← one file per function (onRequest or onSchedule)
terraform/                ← CDKTF infrastructure (separate package)
```

### Adding a new function

1. Create `src/functions/myFunc.ts`
2. Export from `src/index.ts`: `export { myFunc } from "./functions/myFunc";`
3. Function name = exported variable name (Firebase convention)

### Function patterns

**HTTP (onRequest):**
```typescript
import { logger } from "firebase-functions/v2";
import { onRequest, type Request } from "firebase-functions/v2/https";

const handler = (request: Request, response: any): void => {
  response.set(SECURITY_HEADERS);
  response.status(200).json({ success: true });
};

export const myFunc: ReturnType<typeof onRequest> = onRequest(
  { cors: true, memory: "256MiB", timeoutSeconds: 60 },
  handler
);
```

**Scheduled (onSchedule):**
```typescript
import { onSchedule } from "firebase-functions/v2/scheduler";

export const myJob = onSchedule(
  { schedule: "0 0 * * *", timeZone: "UTC", memory: "256MiB" },
  async () => { /* ... */ }
);
```

### Security headers

All HTTP responses must include SECURITY_HEADERS (X-Content-Type-Options, X-Frame-Options, HSTS, CSP).

## Infrastructure (terraform/)

CDKTF TypeScript — separate `package.json` in `terraform/`.
Config in `terraform/config.ts` — update `projectId` before deploying.

- `pnpm terraform:synth` — generate Terraform JSON
- `pnpm terraform:diff` — preview changes
- `pnpm terraform:deploy` — apply infrastructure

Resources: VPC + VPC Connector, Cloud SQL (Postgres, private IP), ESPv2 Gateway (Cloud Endpoints with Firebase JWT auth), Secret Manager, IAM bindings.

## Firebase

- Project ID configured in `.firebaserc`
- Runtime: Node.js 20
- Emulator: port 5001
- Functions source: root (compiled to `lib/`)

## Skills

- `/git-ship` — verify + commit + push + PR
- `/chat-authorize` — session permission grants
- `/toon-formatter` — token-efficient structured data formatting
