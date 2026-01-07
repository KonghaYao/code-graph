# Module map format (monorepo)

Use this at the repo root to route work to the right subproject/module fast.

Keep it short and scannable. Prefer 5-20 entries.

```markdown
## Modules / subprojects

| Module | Type | Path | What it owns | How to run | Tests | Docs | AGENTS |
|--------|------|------|--------------|------------|-------|------|--------|
| backend | spring | `backend/` | APIs, DB, jobs | `...` | `...` | `docs/backend/...` | `backend/AGENTS.md` |
| frontend | nextjs | `frontend/` | UI, web client | `...` | `...` | `docs/frontend/...` | `frontend/AGENTS.md` |
```

Notes:
- "Type" is a quick hint (spring, nextjs, library, infra, docs).
- Keep "How to run" high-level here; put full commands/details in the module's AGENTS.md.

