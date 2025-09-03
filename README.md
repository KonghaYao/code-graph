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

本项目由多个智能体组成，主要包括 `react-agent` 和 `swarm`，基于 `langchain` 和 `langgraph-js/pro` 框架构建。

### 代理

- `react-agent`：专注于交互式软件工程任务的编程代理，能使用编辑、搜索、读写等丰富工具。
- `swarm`：多智能体管理系统，负责协调代理间状态和任务路由。

代理使用 OpenAI 的 Chat 模型，支持自定义配置和系统提示，灵活扩展工具集。

### 核心功能

- 语言模型驱动的编码辅助工具
- 多种文件系统操作工具（编辑(edit_tool)、多点编辑(multi_edit_tool)、读写(read_tool/write_tool)、查找(glob_tool/grep_tool)）
- Bash 任务管理工具（执行(bash_tool)、查看输出(bash_output_tool)、终止(kill_bash_tool)）
- 任务规划和进度管理支持（通过 TodoWrite 等工具）
- 终端 UI 基于 Ink，提供交互式聊天体验

### 自定义

- 添加工具到 `agents/react-agent/tools/` 并在 `tools/index.ts` 中导出
- 修改或添加图到 `agents/` 并在 `langgraph.json` 中注册
- 针对每个代理编辑 `configuration.ts` 和 `prompts.ts`

### 运行与开发

- 使用 `pnpm dev` 启动开发环境
- 使用 `pnpm build` 构建项目


```sh
# openai model base settings
OPENAI_API_KEY=
OPENAI_BASE_URL=

# Demo of Using PG
# DATABASE_URL=postgresql://postgres:postgres@localhost:5434/langgraph_test_10?sslmode=require
# DATABASE_NAME=langgraph_test_10

SQLITE_DATABASE_URL=./.langgraph_api/langgraph.db
```

## 项目技术描述

本项目由多个智能体组成，主要包括 `react-agent` 和 `swarm`，均基于 `langchain` 与 `langgraph-js/pro` 框架构建。

- `react-agent`：专注于交互式软件工程任务的编程代理，能使用编辑、搜索、读写等丰富工具。
- `swarm`：多智能体管理系统，负责协调代理间状态和任务路由。

代理使用 OpenAI 的 Chat 模型，支持自定义配置和系统提示，灵活扩展工具集。

## 核心功能

- 语言模型驱动的编码辅助工具
- 多种文件系统操作工具：编辑(edit_tool)、多点编辑(multi_edit_tool)、读写(read_tool/write_tool)、查找(glob_tool/grep_tool)
- Bash 任务管理工具：执行(bash_tool)、查看输出(bash_output_tool)、终止(kill_bash_tool)
- 任务规划和进度管理支持（通过 TodoWrite 等工具）
- 终端 UI 基于 Ink，提供交互式聊天体验

## 运行与开发

- 使用 `pnpm dev` 启动开发环境
- 使用 `pnpm build` 构建项目

## 贡献及反馈

欢迎在 https://github.com/KonghaYao/coding-graph/issues 反馈问题与建议。

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
