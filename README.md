# Code Graph

一个视图无关的 LangGraph Coding Agent, Like Claude Code or Gemini Cli.

## Structure

```txt
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

## Graph Registration

```json
{
    "graphs": {
        "agent": "./agents/react-agent/graph.ts:graph",
        "swarm": "./agents/swarm/graph.ts:graph"
    }
}
```

## Commands

-   `pnpm dev`
-   `pnpm build`

## Customize

-   Add tools under `agents/react-agent/tools/` and export in `tools/index.ts`
-   Add or modify graphs under `agents/` and register in `langgraph.json`
-   Edit `configuration.ts` and `prompts.ts` per agent

## Environment (.env)

```sh
# openai model base settings
OPENAI_API_KEY=
OPENAI_BASE_URL=

# Demo of Using PG
# DATABASE_URL=postgresql://postgres:postgres@localhost:5434/langgraph_test_10?sslmode=require
# DATABASE_NAME=langgraph_test_10

SQLITE_DATABASE_URL=./.langgraph_api/langgraph.db
```

## Credits

本项目参考了

-   [ShareAI-lab](https://github.com/shareAI-lab)
-   [Claude Code](https://docs.anthropic.com/)
-   [Cursor](https://cursor.com/)。
