# AGENTS.md template (copy/paste)

## Root AGENTS.md (monorepo)

Use this at repo root when you have multiple subprojects/modules.

```markdown
# Agent instructions (scope: this directory and subdirectories)

## Scope and layout
- **This AGENTS.md applies to:** `<path/>` and below.
- **Key directories:**
  - ...

## Modules / subprojects
Use `references/module-map-format.md` for the table format.

## Cross-domain workflows
- Frontend -> backend API: base URL/env vars, auth/session, contract (OpenAPI/GraphQL), client generation.
- Local dev: how to run modules together + common gotchas (ports/proxies/CORS).

## Verification (preferred commands)
- Default: run quiet first; re-run narrowed failures with verbose logs only when debugging.
- Backend (Gradle): from `<backend-path>/` (Java `<version>`, DB via compose) run `./gradlew clean build`, `./gradlew test`, `./gradlew integrationTest`, single `./gradlew test --tests <package.ClassName>`; quiet add `--console=plain --quiet`; debug add `--info --console=plain`; quality `./gradlew check`; format `./gradlew spotlessApply`.
- Frontend (bun): from `<frontend-path>/` (repeat per frontend module) run `bun run dev`, `bun run build && bun run start`, `bun run lint`, `bun run type-check`, `bun run test`; quiet `-- --silent`; target `-- <pattern>` / `-t "<name>"`.

## Docs usage
- Do not open/read `docs/` unless the user asks or the task requires it.

## Global conventions
- Keep instructions concise and precise; link to docs for details.
- ...

## Do not
- Put tech-specific commands here (keep them in module AGENTS.md).
- ...

## Links to module instructions
- `<module-path>/AGENTS.md`
- ...
```

## Module AGENTS.md (component-specific)

Use this inside each module/component root (backend/frontend/docs/etc.). This is where tech-specific instructions belong.

```markdown
# Agent instructions (scope: this directory and subdirectories)

## Scope and layout
- **This AGENTS.md applies to:** `<path/>` and below.
- **Owner:** `<team>`
- **Key directories:**
  - ...

## Commands (use what this repo uses)
- **Install:** ...
- **Dev:** ...
- **Test:** ...
- **Build:** ...

## Feature map (optional)
Use `references/feature-map-format.md` for the table format.

## Conventions
- Keep instructions concise and precise; link to docs for details.
- ...

## Common pitfalls
- ...

## Do not
- ...
```
