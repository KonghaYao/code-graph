import { ChatOpenAI } from '@langchain/openai';
import { getSystemPrompt } from './prompts/coding.js';
import { bash_tools } from './tools/bash_tools/index.js';
import { glob_tool, grep_tool, read_tool, replace_tool, write_tool } from './tools/filesystem_tools/index.js';
import { todo_write_tool } from './tools/task_tools/todo_tool.js';
import { createAgent } from 'langchain';
import { z } from 'zod';
import { createStateEntrypoint } from '@langgraph-js/pure-graph';
import { CodeState } from './state.js';
import { ask_user_with_options, ask_user_with_options_config, humanInTheLoopMiddleware } from '@langgraph-js/auk';
import { create_finder } from './subagents/finder.js';
import { SkillsMiddleware } from './middlewares/skills.js';
import { SubAgentsMiddleware } from './middlewares/subagents.js';
import { MemoryMiddleware } from './middlewares/memory.js';
import { MCPMiddleware } from './middlewares/mcp.js';

export const graph = createStateEntrypoint(
    {
        name: 'graph',
        stateSchema: CodeState,
    },
    async (state: z.infer<typeof CodeState>) => {
        const model = new ChatOpenAI({
            model: state.main_model,
            streamUsage: true,
        });

        // Create MCP middleware with servers
        const mcpMiddleware = await MCPMiddleware(state.mcp_config as any);

        const allTools = [
            // exit_plan_mode_tool,

            ask_user_with_options,

            todo_write_tool,
            glob_tool,
            grep_tool,

            read_tool,
            write_tool,
            replace_tool,
            ...bash_tools,
        ];
        const subagents = new SubAgentsMiddleware();
        subagents.addSubAgents('finder', create_finder);

        const agent = createAgent({
            model,
            systemPrompt: await getSystemPrompt(state),
            tools: [...allTools],
            stateSchema: CodeState,
            middleware: [
                subagents,
                MemoryMiddleware(model),
                new SkillsMiddleware(),
                mcpMiddleware,
                humanInTheLoopMiddleware({
                    interruptOn: {
                        terminal: {
                            allowedDecisions: ['approve', 'reject', 'edit'],
                        },
                        ...ask_user_with_options_config.interruptOn,
                    },
                }),
            ],
        });

        const response = await agent.invoke(state as any, { recursionLimit: 200 });

        return {
            task_store: response.task_store,
            messages: response.messages,
        };
    },
);
