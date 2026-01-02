import { ChatOpenAI } from '@langchain/openai';
import { getSystemPrompt } from '../prompts/coding.js';
import { bash_tools } from '../tools/bash_tools/index.js';
import { glob_tool, grep_tool, read_tool } from '../tools/filesystem_tools/index.js';
import { todo_write_tool } from '../tools/task_tools/todo_tool.js';
import { createAgent, ReactAgent } from 'langchain';
import { CodeState } from '../state.js';
import { humanInTheLoopMiddleware } from '@langgraph-js/auk';
import { add_memory_tool } from '../tools/memory/memory_tool.js';
import { SubAgentCreator } from '../middlewares/subagents.js';

export const create_finder: SubAgentCreator = async (taskId, args, state) => {
    const model = new ChatOpenAI({
        model: state.main_model,
        streamUsage: true,
        metadata: {
            parent_id: taskId,
        },
    });
    const allTools = [
        todo_write_tool,
        glob_tool,
        grep_tool,

        read_tool,
        // write_tool,
        // replace_tool,
        ...bash_tools,
        add_memory_tool,
    ];

    const agent = createAgent({
        name: `subagent_${taskId}`,
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

    return agent as unknown as ReactAgent;
};
