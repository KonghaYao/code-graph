import { entrypoint } from '@langchain/langgraph';
import { createDefaultAnnotation, createState, SwarmState } from '@langgraph-js/pro';
import { createSwarm } from './swarm.js';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigurationSchema, useConfiguration } from './configuration.js';
import { RunnableConfig } from '@langchain/core/runnables';
import { getSystemPrompt } from './prompts/coding.js';
import { bash_output_tool, bash_tool, kill_bash_tool } from './tools/bash_tools/index.js';
import { edit_tool } from './tools/edit_tool.js';
import { exit_plan_mode_tool } from './tools/exit_plan_mode_tool.js';
import { glob_tool } from './tools/glob_tool.js';
import { grep_tool } from './tools/grep_tool.js';
import { ls_tool } from './tools/ls_tool.js';
import { multi_edit_tool } from './tools/multi_edit_tool.js';
import { notebook_edit_tool } from './tools/notebook_edit_tool.js';
import { read_tool } from './tools/read_tool.js';
import { task_tool } from './tools/task_tool.js';
import { todo_write_tool } from './tools/todo_tool.js';
import { web_fetch_tool } from './tools/web_fetch_tool.js';
import { web_search_tool } from './tools/web_search_tool.js';
import { write_tool } from './tools/write_tool.js';

const AState = createState(SwarmState).build({});
const model = new ChatOpenAI({
    modelName: 'gpt-4.1-mini',
    temperature: 0,
});

const codingAgent = entrypoint('coding-agent', async (state: typeof AState.State, c: RunnableConfig) => {
    const config = useConfiguration(c);
    console.log(config);
    const agent = createReactAgent({
        llm: model,
        prompt: await getSystemPrompt(config),
        tools: [
            edit_tool,
            exit_plan_mode_tool,
            glob_tool,
            grep_tool,
            ls_tool,
            multi_edit_tool,
            notebook_edit_tool,
            read_tool,
            task_tool,
            todo_write_tool,
            web_fetch_tool,
            web_search_tool,
            write_tool,
            bash_output_tool,
            bash_tool,
            kill_bash_tool,
        ],
    });
    const response = await agent.invoke({
        messages: state.messages,
    });
    return {
        messages: response.messages,
    };
});

export const graph = createSwarm({
    agents: [codingAgent],
    defaultActiveAgent: 'coding-agent',
    stateSchema: AState,
    contextSchema: ConfigurationSchema,
}).compile();
