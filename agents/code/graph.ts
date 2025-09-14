import { entrypoint } from '@langchain/langgraph';
import { createDefaultAnnotation, createState, SwarmState } from '@langgraph-js/pro';
import { createSwarm } from './swarm.js';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableConfig } from '@langchain/core/runnables';
import { EnvConfig, getAgentPrompt, getSystemPrompt } from './prompts/coding.js';
import { bash_output_tool, bash_tool, kill_bash_tool } from './tools/bash_tools/index.js';
import { edit_tool, glob_tool, grep_tool, read_tool, write_tool } from './tools/filesystem_tools/index.js';
import { todo_write_tool } from './tools/task_tools/todo_tool.js';
import { createAgentMdSystemPrompt } from './prompts/create_agent_md.js';
import { createSubAgentTool, MainAgentState } from './tools/sub_agents/index.js';
// import { web_fetch_tool, web_search_tool } from './tools/web_tools/index.js';
// import { exit_plan_mode_tool, task_tool, todo_write_tool } from './tools/task_tools/index.js';

const CodeState = createState(SwarmState, MainAgentState, EnvConfig).build({
    main_model: createDefaultAnnotation(() => 'gpt-4.1-mini'),
});

const codingAgent = entrypoint('coding-agent', async (state: typeof CodeState.State) => {
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
    ];

    const agent = createReactAgent({
        llm: model,
        prompt: await getSystemPrompt(state),
        tools: [
            ...allTools,
            createSubAgentTool({
                name: 'code_review_task',
                description: 'use this tool to code review',
                llm: model,
                systemPrompt: await getAgentPrompt({
                    cwd: state.cwd,
                    agent_name: 'code_review_task',
                }),
                tools: allTools,
            }),
        ],
        stateSchema: CodeState,
    });
    const response = await agent.invoke(state);
    return {
        task_store: response.task_store,
        messages: response.messages,
    };
});

export const docWriteAgent = entrypoint('doc-write-agent', async (state: typeof CodeState.State, c: RunnableConfig) => {
    const model = new ChatOpenAI({
        model: state.main_model,
    });
    const agent = createReactAgent({
        llm: model,
        prompt: createAgentMdSystemPrompt,
        tools: [edit_tool, todo_write_tool, glob_tool, grep_tool, read_tool, write_tool],
    });
    const response = await agent.invoke({
        messages: state.messages,
    });
    return {
        messages: response.messages,
    };
});

export const graph = createSwarm({
    agents: [codingAgent, docWriteAgent],
    defaultActiveAgent: 'coding-agent',
    stateSchema: CodeState,
}).compile();
