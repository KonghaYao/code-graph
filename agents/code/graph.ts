import { ChatOpenAI } from '@langchain/openai';
import { getSystemPrompt } from './prompts/coding.js';
import { bash_tools } from './tools/bash_tools/index.js';
import { glob_tool, grep_tool, read_tool, replace_tool, write_tool } from './tools/filesystem_tools/index.js';
import { todo_write_tool } from './tools/task_tools/todo_tool.js';
import { createAgent } from 'langchain';
import { z } from 'zod';
import { createStateEntrypoint } from '@langgraph-js/pure-graph';
import { CodeState } from './state.js';
import { humanInTheLoopMiddleware } from '@langgraph-js/auk';
import { add_memory_tool } from './tools/memory/memory_tool.js';
const codingAgent = async (state: z.infer<typeof CodeState>) => {
    const model = new ChatOpenAI({
        model: state.main_model,
        streamUsage: true,
    });
    const allTools = [
        // exit_plan_mode_tool,

        todo_write_tool,
        glob_tool,
        grep_tool,

        read_tool,
        write_tool,
        replace_tool,
        ...bash_tools,
        add_memory_tool,
    ];

    const agent = createAgent({
        model: model,
        systemPrompt: await getSystemPrompt(state),
        tools: [...allTools],
        stateSchema: CodeState,
        middleware: [
            humanInTheLoopMiddleware({
                interruptOn: {
                    terminal: {
                        allowedDecisions: ['approve', 'reject', 'edit'],
                    },
                },
            }),
        ],
    });

    const response = await agent.invoke(state, { recursionLimit: 200 });
    if (response.messages.length - state.messages.length >= 10) {
        console.log('messages length is too long, adding memory', response.messages.length);
    }
    return {
        task_store: response.task_store,
        messages: response.messages,
    };
};

export const graph = createStateEntrypoint(
    {
        name: 'graph',
        stateSchema: CodeState,
    },
    codingAgent,
);
