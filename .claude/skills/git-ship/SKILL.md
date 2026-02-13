# git-ship

Git workflow automation skill for analyzing, branching, committing, pushing, and creating PRs.

## When to Use

Invoke with `/git-ship` when you want to ship code changes to the remote repository. This skill handles the full git workflow from staged changes to merged PR.

## Workflow

### Step 0: Pre-flight Verification

Before any git operations, run the project verification pipeline and fix all issues:

1. Run `pnpm run verify` (lint:fix + build + typecheck) — or `pnpm run ai-check` if available
2. If errors are found, fix them before proceeding
3. Re-run verify until the pipeline passes cleanly
4. **Do not continue to Step 1 until verify passes with zero errors**

### Step 1: Analyze Changes

1. Run `git status` and `git diff` (staged + unstaged) to understand all modifications
2. Categorize changes by feature/purpose (e.g., "performance", "bug fix", "new feature", "refactor")
3. If changes span multiple unrelated features, split them into separate branches (one branch per feature)

### Step 2: Branch Strategy

For each logical group of changes:

1. Create a feature branch from `main`: `git checkout -b <branch-name>`
2. Branch naming convention: `feature/<short-description>`, `fix/<short-description>`, or `refactor/<short-description>`
3. If multiple branches are needed, process them sequentially — complete one full cycle before starting the next

### Step 3: Stage Files

- Stage up to **5 files per commit** for focused, reviewable commits
- Use `git add <file1> <file2> ...` — never `git add -A` or `git add .`
- Group related files together (e.g., a type definition + its consumer)
- If more than 5 files belong to one logical change, split into multiple commits within the same branch

### Step 4: Commit

Write commit messages using this format:

```
<type>: <concise summary>

<TOON-formatted details of what changed>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `perf`, `docs`, `test`

**TOON in commit body** — use TOON format for listing changed files/components:

```
files[3]{path,change}:
  src/services/gemini.ts,Add retry logic with exponential backoff
  src/types/index.ts,Add TokenUsage interface
  src/agents/dataExtractor.ts,Return token counts from API calls
```

Pass the commit message via HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat: Add token usage tracking to extraction pipeline

files[3]{path,change}:
  src/services/gemini.ts,Return token counts from generateContent
  src/types/index.ts,Add TokenUsage and ProcessingStats types
  src/agents/dataExtractor.ts,Propagate token usage from Gemini responses

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 5: Push

```bash
git push -u origin <branch-name>
```

### Step 6: Create PR

Use `gh pr create` with TOON-formatted body:

```bash
gh pr create --title "<type>: <short title>" --body "$(cat <<'EOF'
## Summary
- <bullet 1>
- <bullet 2>

## Changes
files[N]{path,change}:
  path1,description1
  path2,description2

## Test Plan
- [ ] Verify ...
- [ ] Check ...

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 7: Handle Conflicts

If conflicts arise during merge or rebase:
1. Run `git status` to identify conflicted files
2. Read each conflicted file to understand both sides
3. Resolve conflicts by choosing the correct version or merging both
4. Stage resolved files and continue the merge/rebase
5. Never use `--force` or `--hard` without explicit user approval

### Step 8: Merge to Main

After PR is created:
1. Ask the user if they want to merge immediately or review first
2. If merging: `gh pr merge <pr-number> --merge --delete-branch`
3. Switch back to main and pull: `git checkout main && git pull`

## Rules

- Never force push unless explicitly asked
- Never skip pre-commit hooks
- Never commit `.env`, credentials, or secrets
- Always create NEW commits, never amend unless explicitly asked
- If a commit fails (e.g., pre-commit hook), fix the issue and create a new commit
- Each commit in a branch should compile independently
- Keep PR titles under 70 characters
