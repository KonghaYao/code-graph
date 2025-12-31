import { ChatOpenAI } from '@langchain/openai';
import { getSystemPrompt } from './prompts/coding.js';
import { bash_output_tool, bash_tool, kill_bash_tool } from './tools/bash_tools/index.js';
import { edit_tool, glob_tool, grep_tool, read_tool, write_tool } from './tools/filesystem_tools/index.js';
import { todo_write_tool } from './tools/task_tools/todo_tool.js';
import { createAgent } from 'langchain';
import { z } from 'zod';
import { createStateEntrypoint } from '@langgraph-js/pure-graph';
import { CodeState } from './state.js';

const codingAgent = async (state: z.infer<typeof CodeState>) => {
    const model = new ChatOpenAI({
        model: state.main_model,
    });
    const allTools = [
        edit_tool,
        // exit_plan_mode_tool,

        todo_write_tool,
        glob_tool,
        grep_tool,
        // ls_tool, # ls 本身非常不稳定， 容易访问到 git 等无用目录；glob 反而更好
        // multi_edit_tool, # 多重写入容易爆炸，非常不推荐
        // notebook_edit_tool,
        read_tool,
        // task_tool,
        // web_fetch_tool,
        // web_search_tool,
        write_tool,
        bash_output_tool,
        bash_tool,
        kill_bash_tool,
        // show_form,
    ];

    const agent = createAgent({
        model: model,
        systemPrompt: await getSystemPrompt(state),
        tools: [...allTools],
        stateSchema: CodeState,
    });
    const response = await agent.invoke(state);
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
