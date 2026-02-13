# chat-authorize

Present current permission grants and collect session-level authorization.

## Trigger

Automatically invoked at the start of every new conversation (see CLAUDE.md Auto-Start). Can also be invoked manually via `/chat-authorize`.

## Workflow

1. **Read permissions** — Read `.claude/settings.local.json` to get the current `permissions.allow` list.
2. **Summarize** — Group the allowed permissions into categories and present them in a compact table:
   - **Package manager** — pnpm install, build, dev, lint, typecheck, etc.
   - **Git** — add, commit, push, pull, checkout, branch, stash, etc.
   - **GitHub CLI** — pr create, pr merge, pr view, repo view, etc.
   - **Other tools** — curl, firebase, gcloud, IDE diagnostics, etc.
3. **Ask for session grants** — Ask the user which additional action categories (if any) they want to authorize for this session:
   - File deletions / moves
   - New dependency installs (`pnpm add`)
   - Destructive git ops (reset, rebase, force-push)
   - Anything else they specify
4. **Confirm** — Acknowledge the grants and proceed with the conversation.

## Rules

- Never modify `settings.local.json` — this skill is read-only.
- Keep the permissions summary concise (use TOON tabular format).
- If the user declines all additional grants, acknowledge and move on.
- This skill should take no more than one exchange before the user can start working.
