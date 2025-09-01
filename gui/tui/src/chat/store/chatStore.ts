import { createChatStore } from '@langgraph-js/sdk';

export const globalChatStore = (apiUrl: string, agentName: string) => {
    return createChatStore(
        agentName,
        {
            apiUrl: apiUrl,
            defaultHeaders: {
                // authorization: `Bearer 1`,
            },
        },
        {},
    );
};
