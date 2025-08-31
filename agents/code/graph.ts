import { entrypoint } from '@langchain/langgraph';
import { createDefaultAnnotation, createState, SwarmState } from '@langgraph-js/pro';
import { createSwarm } from './swarm.js';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigurationSchema, useConfiguration } from './configuration.js';
import { RunnableConfig } from '@langchain/core/runnables';
import { getSystemPrompt } from './prompts/coding.js';
import { bash_output_tool, bash_tool, kill_bash_tool } from './tools/bash_tools/index.js';
import {
    edit_tool,
    glob_tool,
    grep_tool,
    ls_tool,
    multi_edit_tool,
    // notebook_edit_tool,
    read_tool,
    write_tool,
} from './tools/filesystem_tools/index.js';
import { web_fetch_tool, web_search_tool } from './tools/web_tools/index.js';
import { exit_plan_mode_tool, task_tool, todo_write_tool } from './tools/task_tools/index.js';

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
            // exit_plan_mode_tool,
            glob_tool,
            grep_tool,
            ls_tool,
            multi_edit_tool,
            // notebook_edit_tool,
            read_tool,
            // task_tool,
            // todo_write_tool,
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
