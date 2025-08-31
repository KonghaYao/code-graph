import { entrypoint } from '@langchain/langgraph';
import {
    createDefaultAnnotation,
    createHandoffTool,
    createState,
    createSwarm,
    keepAllStateInHandOff,
    SwarmState,
} from '@langgraph-js/pro';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { calculator } from '../react-agent/tools/calculator.js';
import { ChatOpenAI } from '@langchain/openai';
import { useConfiguration } from './configuration.js';
import { RunnableConfig } from '@langchain/core/runnables';

const AState = createState(SwarmState).build({
    customState: createDefaultAnnotation(() => ''),
});

const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
});

const helperAgent = entrypoint('helperAgent', async (state: typeof AState.State, c: RunnableConfig) => {
    const config = useConfiguration(c);
    console.log(config);
    const agent = createReactAgent({
        llm: model,
        prompt: 'You are a helper agent that can help with some problems that you cannot solve',
        tools: [
            createHandoffTool({
                agentName: 'mathAgent',
                description: 'A helper agent that can help with math problems',
                updateState: keepAllStateInHandOff,
            }),
        ],
    });
    const response = await agent.invoke({
        messages: state.messages,
    });
    return {
        messages: response.messages,
    };
});

const mathAgent = createReactAgent({
    name: 'mathAgent',
    llm: model,
    prompt: 'You are a math agent that can help with math problems',
    tools: [
        calculator,
        createHandoffTool({
            agentName: 'helperAgent',
            description: 'A helper agent that can help with some problems that you cannot solve',
        }),
    ],
});

export const graph = createSwarm({
    /** @ts-ignore */
    agents: [helperAgent, mathAgent],
    defaultActiveAgent: 'helperAgent',
    stateSchema: AState,
}).compile();
