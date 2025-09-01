import React, { createContext, useContext, ReactNode, useEffect, useMemo, memo } from 'react';
import { globalChatStore } from '../store/chatStore'; // 假设我们将 globalChatStore 移动到 chatStore.ts
import { useUnionStore } from '@langgraph-js/sdk';
import { useStore } from '@nanostores/react';

// Infer the actual type that useUnionStore returns for our specific globalChatStore
type ChatContextType = ReturnType<typeof useUnionStore<ReturnType<typeof globalChatStore>>>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
    apiUrl: string;
    agentName: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, apiUrl, agentName }) => {
    const storeInstance = useMemo(() => {
        const chatStore = globalChatStore(apiUrl, agentName);
        chatStore.mutations.initClient().catch((err) => {
            console.error(err);
        });
        chatStore.mutations.setTools([]);
        return chatStore;
    }, [apiUrl, agentName]);
    const store = useUnionStore(storeInstance, useStore);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
