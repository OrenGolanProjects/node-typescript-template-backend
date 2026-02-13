# git-ship

Ship the current work: verify, commit, push, and open a PR.

## Trigger

User invokes `/git-ship` or asks to "ship", "ship it", or "land changes".

## Workflow

1. **Verify** — Run `pnpm run verify` (lint:fix + build + typecheck). Stop and fix any errors before continuing.
2. **Commit** — Stage changed files and create a conventional commit:
   - Analyze the diff to determine the commit type (`feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `test`).
   - Write a concise commit message (imperative mood, ≤72 char subject).
   - Append `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.
   - Present the proposed message to the user for approval before committing.
3. **Push** — Push the current branch to `origin` with `-u` flag.
4. **Create PR** — Use `gh pr create`:
   - Title: reuse the commit subject (or summarize if multiple commits).
   - Body: `## Summary` with 1-3 bullet points + `## Test plan` checklist + generated-by footer.
   - Target the `main` branch unless the user specifies otherwise.
   - Return the PR URL when done.

## Rules

- If `pnpm run verify` fails, fix all errors and re-run before proceeding.
- Never force-push. Never use `--no-verify`.
- If there are no staged or unstaged changes, inform the user and stop.
- If the branch is `main`, create a new feature branch first and ask the user for a branch name.
