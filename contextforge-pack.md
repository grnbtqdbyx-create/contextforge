# ContextForge Context Pack

Task: review auth regression
Budget: 600 tokens

## Budget Ledger

| Requested budget | 600 tokens |
| Estimated pack | 169 tokens |
| Remaining | 431 tokens |
| Status | within budget |

## src/auth.ts

Why included: task term match: auth (+4); path match: auth (+3); session failure mention: 1 (+6); recent session read: 1 (+4); recent session edit: 1 (+5)

```
export function login(user: string) {
  return user.length > 0;
}

```

## CLAUDE.md

Why included: repo-level agent instruction file (+3)

```
# Claude notes

Use concise explanations. Prefer focused file reads over dumping entire folders.

```

## AGENTS.md

Why included: repo-level agent instruction file (+3)

```
# Agent instructions

Always be careful. Always be careful.

You should follow best practices and make the code good. Do everything perfectly.

When working with this repo, never include secrets in reports.

```
