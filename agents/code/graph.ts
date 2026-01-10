import { ChatOpenAI } from '@langchain/openai';
import { getSystemPrompt } from './prompts/coding.js';
import { bash_tools } from './tools/bash_tools/index.js';
import { glob_tool, grep_tool, read_tool, replace_tool, write_tool } from './tools/filesystem_tools/index.js';
import { todo_write_tool } from './tools/task_tools/todo_tool.js';
import {
    anthropicPromptCachingMiddleware,
    createAgent,
    initChatModel,
    Runtime,
    HumanMessage,
    SystemMessage,
} from 'langchain';
import { z } from 'zod';
import { createStateEntrypoint } from '@langgraph-js/pure-graph';
import { CodeState } from './state.js';
import { ask_user_with_options, ask_user_with_options_config, humanInTheLoopMiddleware } from '@langgraph-js/auk';
import { create_finder } from './subagents/finder.js';
import { SkillsMiddleware } from './middlewares/skills.js';
import { SubAgentsMiddleware } from './middlewares/subagents.js';
import { summary_prompt } from './middlewares/memory.js';
import { MCPMiddleware } from './middlewares/mcp.js';
import { AgentsMdMiddleware } from './middlewares/agentsMD.js';
import { getBufferString, RemoveMessage } from '@langchain/core/messages';
import { START, StateGraph } from '@langchain/langgraph';

const switchBranch = {
    summarization: async (state: z.infer<typeof CodeState>, runtime: Runtime) => {
        state.messages;

        const model = await initChatModel(state.main_model, {
            modelProvider: process.env.MODEL_PROVIDER || 'openai',
            streamUsage: true,
        });
        const message = await model.invoke([
            new SystemMessage(summary_prompt),
            new HumanMessage(getBufferString(state.messages)),
            new HumanMessage('请输出结果'),
        ]);
        return {
            messages: [
                ...state.messages.map((i) => {
                    return new RemoveMessage({ id: i.id! });
                }),
                message,
            ],
        };
    },
} as const;

export const graph = new StateGraph(CodeState)
    .addNode('graph', async (state: z.infer<typeof CodeState>, runtime: Runtime) => {
        if (state.switch_command && state.switch_command in switchBranch) {
            return switchBranch[state.switch_command as 'summarization'](state, runtime);
        }
        const model = await initChatModel(state.main_model, {
            modelProvider: process.env.MODEL_PROVIDER || 'openai',
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
                // summarizationMiddleware({
                //     model,
                //     trigger: { tokens: 120_000 },
                //     keep: { messages: 100 },
                // }),
                subagents,
                // MemoryMiddleware(model),
                new AgentsMdMiddleware(),
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
                /** @ts-ignore */
                process.env.MODEL_PROVIDER === 'anthropic' && anthropicPromptCachingMiddleware(),
            ],
        });

        const response = await agent.invoke(state as any, { recursionLimit: 200 });

        return {
            task_store: response.task_store,
            messages: response.messages,
        };
    })
    .addEdge(START, 'graph')
    .compile();
