# Repository Guidelines

## Project Structure & Module Organization

This is a **monorepo** with two main components: an AI agent backend and a TUI frontend.

### Root Directory Layout

```
code-graph/
├── agents/code/           # Core agent logic (LangGraph backend)
├── tui/                   # Terminal UI frontend (React + Ink)
├── .deepagents/skills/    # Project-specific skills
├── .langgraph_api/        # Runtime data (SQLite DB, memory)
└── Configuration files: package.json, tsconfig.json, pnpm-workspace.yaml
```

### Backend Module (`agents/code/`)

-   **server.ts**: LangGraph server entrypoint (port 8123)
-   **graph.ts**: Main agent graph definition with middleware chain
-   **state.ts**: Shared state schema (extends AgentState)
-   **ask_agents.ts**: SubAgent communication protocol
-   **prompts/**: System prompts (coding.ts, create_agent_md.ts)
-   **middlewares/**: Plugin system (skills, subagents, memory, MCP)
-   **subagents/**: Specialized agents (finder for file search)
-   **tools/**: Tool implementations:
    -   `filesystem_tools/`: read, write, replace, grep, glob
    -   `bash_tools/`: terminal command execution
    -   `memory/`: persistent memory storage
    -   `task_tools/`: todo management
-   **skills/**: Skill loader with YAML frontmatter parsing

### Frontend Module (`tui/`)

-   **src/app.tsx**: Main TUI application entry
-   **src/chat/**: Chat interface logic
    -   `store/`: State management (LowDB)
    -   `commands/`: Command system (/init, /help, /model, /config, /mcp)
    -   `tools/`: UI utilities
-   **dist/**: Built bundle for distribution

### Cross-Module Dependencies

-   **Backend → Frontend**: LangGraph SDK for agent communication
-   **Frontend → Backend**: HTTP requests to LangGraph server
-   **Shared**: Configuration via `~/.code-graph.json`

## Build, Test, and Development Commands

### Development Scripts (Root)

```bash
# Backend development
bun run dev:server          # Start LangGraph server on port 8123

# Frontend development
bun run dev                 # Start TUI app
bun run preview:bun         # Preview built TUI with Bun
bun run preview             # Preview with Node + env file

# Build
cd tui && pnpm build        # Build TUI with Vite
```

### Package Management

```bash
# Root workspace (agents)
pnpm install                # Install all dependencies
pnpm --filter agents add <pkg>  # Add to agents module

# TUI workspace
cd tui && pnpm install      # Install TUI dependencies
```

### Configuration Files

-   **tsconfig.json**: TypeScript strict mode, includes agents/ and tui/
-   **pnpm-workspace.yaml**: Monorepo workspace configuration
-   **package.json**: Root dependencies (@langchain/_, @langgraph/_)
-   **tui/package.json**: Frontend dependencies (ink, react, vite)

## Coding Style & Naming Conventions

### TypeScript Standards

-   **Strict mode**: Enabled in tsconfig.json
-   **Imports**: Relative paths, avoid cycles
-   **Functions**: Pure functions preferred, async/await pattern
-   **Error handling**: Explicit types, no silent failures
-   **Types**: Use Zod schemas for runtime validation

### Naming Patterns

-   **Variables**: Descriptive names (avoid abbreviations)
-   **Booleans**: `is*`, `has*`, `should*` prefixes
-   **Events**: `handle*`, `on*` prefixes
-   **Classes**: PascalCase
-   **Files**: kebab-case for .ts/.tsx files

### Code Organization

-   **Single responsibility**: Each function/module does one thing
-   **Dependency injection**: Avoid global state
-   **Configuration externalization**: Use environment variables or config files
-   **Composition over inheritance**: Use function composition and hooks

### Python-style Conventions (for TypeScript)

-   **Relative imports**: Use `./module` not `../module` when possible
-   **Type annotations**: Explicit return types for exported functions
-   **Module structure**: Clear separation of concerns

## Testing Guidelines

### Test Strategy

-   **Unit tests**: Individual tool functions
-   **Integration tests**: Complete workflow testing
-   **Manual testing**: TUI interaction testing

### Test Commands

```bash
# No explicit test scripts defined, use manual verification:
# 1. Start backend: bun run agents/code/server.ts
# 2. Start frontend: bun run tui/src/app.tsx
# 3. Test tools: Use /init, /model, /config commands
# 4. Verify memory: Check .langgraph_api/memory.md
```

### Verification Checklist

-   [ ] New tools registered in graph.ts
-   [ ] Middleware execution order correct
-   [ ] Skills parsed correctly
-   [ ] SubAgents receive/return data properly
-   [ ] Memory system triggers after 10 messages
-   [ ] MCP config injects tools correctly

## Commit & Pull Request Guidelines

### Commit Messages

Follow Angular convention: `type(scope): subject`

Examples:

-   `feat(memory): add vector-based semantic search`
-   `fix(tools): handle null responses in grep_tool`
-   `refactor(middlewares): improve error handling`
-   `docs: update AGENTS.md with new workflow`

### Pull Request Process

1. **Scope**: One feature/fix per PR
2. **Testing**: Verify all tools work end-to-end
3. **Documentation**: Update AGENTS.md if workflows change
4. **Security**: Review for unauthorized access patterns

### Code Review Focus

-   Tool performance (timeout handling, output limits)
-   Security (path validation, command execution)
-   Error handling (explicit types, no silent failures)
-   State management (proper cleanup, no leaks)

## Development Workflow

### Adding New Tools

1. Create tool in appropriate `tools/` subdirectory
2. Export from `tools/index.ts`
3. Import in `graph.ts` and add to `allTools` array
4. Update tool description with usage examples
5. Test with manual TUI interaction

### Adding Middleware

1. Create middleware in `middlewares/`
2. Implement `wrapModelCall` method
3. Add to `middleware` array in `graph.ts` (order matters!)
4. Update system prompt if needed
5. Test execution order

### Adding SubAgents

1. Create agent factory in `subagents/`
2. Register in `SubAgentsMiddleware` via `addSubAgents`
3. Update `ask_subagents` tool description
4. Test delegation workflow

### Adding Skills

1. Create skill directory in `.deepagents/skills/`
2. Write `SKILL.md` with YAML frontmatter
3. Skills auto-load via `SkillsMiddleware`
4. Test progressive disclosure pattern

## Runtime & Configuration

### Configuration Files

-   **Location**: `~/.code-graph.json` (user home directory)
-   **Format**:
    ```json
    {
        "main_model": "qwen-plus",
        "openai_api_key": "sk-...",
        "openai_base_url": "https://api.openai.com/v1",
        "mcp_config": {
            /* MCP servers */
        },
        "stream_refresh_interval": 100
    }
    ```

### Environment Variables

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
SQLITE_DATABASE_URL=./.langgraph_api/langgraph.db
```

### Runtime Data

-   **Memory**: `.langgraph_api/memory.md` (human-readable)
-   **Database**: `.langgraph_api/langgraph.db` (SQLite)
-   **Logs**: Check terminal output for middleware execution

## Security & Authorization

### Required User Approval

-   Adding dependencies to package.json
-   Running lint/test/type-check commands
-   Creating/modifying documentation files
-   Creating/modifying test code
-   Starting services or executing code

### Forbidden Actions

-   Writing malicious code
-   Unauthorized system commands
-   Modifying files not explicitly requested
-   Silent error handling

### Path Safety

-   All file paths must be absolute
-   Use `read_file` before `write_file` or `replace_in_file`
-   Validate paths with glob patterns before operations

## Troubleshooting

### Common Issues

1. **Tool fails**: Check path is absolute, file exists
2. **Memory errors**: Verify `.langgraph_api/` directory permissions
3. **SubAgent timeout**: Increase recursionLimit in graph.ts
4. **MCP connection**: Validate `mcp_config` JSON format
5. **TUI not updating**: Restart after config changes

### Debug Commands

```bash
# Check memory file
cat .langgraph_api/memory.md

# Check config
cat ~/.code-graph.json

# Test tools directly
bun run agents/code/server.ts  # Start backend
curl http://localhost:8123     # Test server
```

### Performance Tips

-   Use `grep_tool` over `glob_tool` for content search
-   Limit read operations to 1-2 files at a time
-   Use `head_limit` parameter for large outputs
-   Avoid repeated file reads (cache in state)

## References

-   **Project**: https://github.com/KonghaYao/coding-graph/issues
-   **LangGraph**: https://langchain-ai.github.io/langgraph/
-   **Skills**: https://github.com/langchain-ai/deepagents
-   **MCP**: https://modelcontextprotocol.io/
