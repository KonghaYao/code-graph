import { createChatStore } from '@langgraph-js/sdk';

const F = (url: string, options: RequestInit) => {
    // For TUI, always include credentials if needed or manage via config later.
    // Assuming for now it's always true or explicitly set elsewhere if required.
    options.credentials = 'include';
    return fetch(url, options);
};

// getLocalConfig is removed as showHistory and showGraph are now managed by Chat component state.

export const globalChatStore = (apiUrl: string, agentName: string) =>
    createChatStore(
        agentName,
        {
            apiUrl: apiUrl,
            defaultHeaders: {},
            callerOptions: {
                fetch: F,
            },
        },
        {
            // Initial UI state for Ink is handled by the Chat component directly.
            // No longer using getLocalConfig() here.
            onInit(client) {
                client.tools.bindTools([]);
            },
        },
    );
