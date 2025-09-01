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
// export const globalChatStore = (apiUrl: string, agentName: string) => test;
// const test = createChatStore(
//     'code',
//     {
//         apiUrl: 'http://0.0.0.0:8123',
//         defaultHeaders: {
//             // authorization: `Bearer 1`,
//         },
//     },
//     {},
// );
