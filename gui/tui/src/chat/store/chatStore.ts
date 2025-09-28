import { createChatStore } from '@langgraph-js/sdk';
import { createMemoryClient, registerGraph } from '../../../../../pure-graph/index.js';

import { graph as CodeGraph } from '../../../../../agents/code/graph.js';
registerGraph('code', CodeGraph);

export const globalChatStore = (apiUrl: string, agentName: string) => {
    return createChatStore(
        agentName,
        {
            apiUrl: apiUrl,
            defaultHeaders: {
                // authorization: `Bearer 1`,
            },
            client: createMemoryClient(),
        },
        {},
    );
};
