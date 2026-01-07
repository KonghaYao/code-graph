# Suggested `docs/` structure (Spring + Next + Postgres)

Use `docs/README.md` as the entrypoint with a short table of contents and links to each area.

```text
docs/
  README.md

  adr/
    README.md
    0001-<short-title>.md

  backend/
    README.md
    local-dev.md
    configuration.md
    troubleshooting.md

    api/
      README.md
      openapi.md            (or link to `openapi.yaml` in repo root)

    database/
      README.md
      migrations.md         (Flyway/Liquibase conventions, how to run)
      schema.md             (high-level tables/relationships)

    operations/
      README.md
      deployment.md
      observability.md      (logs/metrics/tracing, dashboards, alerts)

  frontend/
    README.md
    local-dev.md
    configuration.md        (env vars, feature flags)
    troubleshooting.md
    architecture.md         (routing/data fetching patterns)

  runbooks/
    README.md
    incidents.md            (how to respond, where to look)
    common-issues.md

  reference/
    versions.md             (supported Java/Node/Postgres versions)
    environments.md         (dev/stage/prod differences)
    glossary.md

  templates/
    adr-template.md
    runbook-template.md
```

