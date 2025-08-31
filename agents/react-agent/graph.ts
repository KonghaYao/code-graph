/**
 * It's a simple graph that shows how to use graph to build an agent,
 * in production, you should use createReactAgent instead
 */
import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { StateGraph } from '@langchain/langgraph';
import { createReactAgentAnnotation, ToolNode } from '@langchain/langgraph/prebuilt';
import { ConfigurationSchema, useConfiguration } from './configuration.js';
import { ChatOpenAI } from '@langchain/openai';
import { tools } from './tools/index.js';
import { createDefaultAnnotation, createState } from '@langgraph-js/pro';

const AState = createState(createReactAgentAnnotation()).build({
    customState: createDefaultAnnotation(() => ''),
});

// tools imported from tools.ts

async function callModel(state: typeof AState.State, config: RunnableConfig): Promise<typeof AState.Update> {
    const configuration = useConfiguration(config);
    const model = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0,
    });
    const modelWithTools = model.bindTools(tools);

    const response = await modelWithTools.invoke([
        {
            role: 'system',
            content: 'You are a helpful assistant',
        },
        ...state.messages,
    ]);

    return { messages: [response] };
}

function routeModelOutput(state: typeof AState.State): string {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    if (((lastMessage as AIMessage)?.tool_calls?.length || 0) > 0) {
        return 'tools';
    } else {
        return '__end__';
    }
}

const workflow = new StateGraph(AState, ConfigurationSchema)
    .addNode('callModel', callModel)
    .addNode('tools', new ToolNode(tools))
    .addEdge('__start__', 'callModel')
    .addConditionalEdges('callModel', routeModelOutput)
    .addEdge('tools', 'callModel');

export const graph = workflow.compile({
    interruptBefore: [],
    interruptAfter: [],
});
