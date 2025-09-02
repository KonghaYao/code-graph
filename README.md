# Code Graph

一个视图无关的 LangGraph Coding Agent, Like Claude Code or Gemini Cli.

## 项目结构

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

## 自定义

-   添加工具到 `agents/react-agent/tools/` 并在 `tools/index.ts` 中导出
-   修改或添加图到 `agents/` 并在 `langgraph.json` 中注册
-   针对每个代理编辑 `configuration.ts` 和 `prompts.ts`

-   **图注册**: 通过 `langgraph.json` 注册不同代理的图。

```json
{
    "graphs": {
        "agent": "./agents/react-agent/graph.ts:graph",
        "swarm": "./agents/swarm/graph.ts:graph"
    }
}
```

## 系统设计

本项目由多个代理组成，主要包括 `react-agent` 和 `swarm`。使用 `langchain` 库构建代理，结合 OpenAI 的模型，通过配置和工具
进行定制化。

### 代理

-   **React Agent**: 主要聚焦编程交互与反馈。
-   **Swarm Agent**: 处理多个智能体的状态管理及协调。

### 工具

使用了以下工具进行操作:

-   `edit_tool`, `write_tool`, `read_tool`, `glob_tool`, `grep_tool` 等。

各代理通过模块化的方式设计，以便于扩展和维护。

-   `pnpm dev`
-   `pnpm build`

## 环境变量 (.env)

```sh
# openai model base settings
OPENAI_API_KEY=
OPENAI_BASE_URL=

# Demo of Using PG
# DATABASE_URL=postgresql://postgres:postgres@localhost:5434/langgraph_test_10?sslmode=require
# DATABASE_NAME=langgraph_test_10

SQLITE_DATABASE_URL=./.langgraph_api/langgraph.db
```

## 参考

本项目参考了

-   [ShareAI-lab](https://github.com/shareAI-lab)
-   [Claude Code](https://docs.anthropic.com/)
-   [Cursor](https://cursor.com/)

一个视图无关的 LangGraph Coding Agent, Like Claude Code or Gemini Cli.

## System Design

本项目由多个代理组成，主要包括 `react-agent` 和 `swarm`。使用 `langchain` 库构建代理，结合 OpenAI 的模型，通过配置和工具
进行定制化。

### Agents

-   **React Agent**: 主要聚焦编程交互与反馈。
-   **Swarm Agent**: 处理多个智能体的状态管理及协调。

### Tools

使用了以下工具进行操作:

-   `edit_tool`, `write_tool`, `read_tool`, `glob_tool`, `grep_tool` 等。

各代理通过模块化的方式设计，以便于扩展和维护.

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
