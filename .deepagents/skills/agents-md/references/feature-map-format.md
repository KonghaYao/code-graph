# Feature map format

Keep it short and scannable. Prefer 5-15 entries per AGENTS.md.

Guideline:
- In a monorepo, keep the feature map in the owning module's AGENTS.md (not the repo root).

```markdown
## Feature map

| Feature | Owner | Key paths | Entrypoints | Tests | Docs |
|--------|-------|-----------|-------------|-------|------|
| Auth | backend+frontend | `backend/...`, `frontend/...` | `...` | `...` | `docs/...` |
| Billing | backend | `backend/...` | `...` | `...` | `docs/...` |
```

## Notes
- "Owner" is a quick routing hint: backend, frontend, docs, infra, or combinations.
- "Entrypoints" can be a main class, controller, route, job, or API handler.
- "Key paths" should be the smallest set that helps navigation.
