import { createChatStore } from '@langgraph-js/sdk';

export const globalChatStore = (apiUrl: string, agentName: string) => test;
const test = createChatStore(
    'code',
    {
        apiUrl: 'http://localhost:8123',
        defaultHeaders: {
            authorization: `Bearer 1`,
        },
    },
    {},
);
