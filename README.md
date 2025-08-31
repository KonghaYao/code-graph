## Agent Template

A minimal LangGraph JS template with two graphs:

-   react-agent: single-agent with tools
-   swarm: multi-agent with handoff

### Requirements

-   Node.js 20
-   pnpm or npm
-   .env for provider API keys

### Quick Start

1. Install: `pnpm install` (or `npm install`)
2. Create `.env` at project root and add your API keys
3. Run: `pnpm dev`
4. Build: `pnpm build`

### Structure

```
templates/agent-template/
  ├─ agents/
  │  ├─ react-agent/
  │  │  ├─ configuration.ts
  │  │  ├─ graph.ts
  │  │  ├─ prompts.ts
  │  │  └─ tools/
  │  │     ├─ calculator.ts
  │  │     ├─ echo.ts
  │  │     ├─ fetch_json.ts
  │  │     ├─ now.ts
  │  │     └─ sleep.ts
  │  └─ swarm/
  │     ├─ configuration.ts
  │     └─ graph.ts
  ├─ langgraph.json
  ├─ package.json
  └─ .env
```

### Graph Registration

```json
{
    "graphs": {
        "agent": "./agents/react-agent/graph.ts:graph",
        "swarm": "./agents/swarm/graph.ts:graph"
    }
}
```

### Commands

-   `pnpm dev`
-   `pnpm build`

### Customize

-   Add tools under `agents/react-agent/tools/` and export in `tools/index.ts`
-   Add or modify graphs under `agents/` and register in `langgraph.json`
-   Edit `configuration.ts` and `prompts.ts` per agent

### Environment (.env)

```sh
# openai model base settings
OPENAI_API_KEY=
OPENAI_BASE_URL=

# Demo of Using PG
# DATABASE_URL=postgresql://postgres:postgres@localhost:5434/langgraph_test_10?sslmode=require
# DATABASE_NAME=langgraph_test_10

SQLITE_DATABASE_URL=./.langgraph_api/langgraph.db
```
