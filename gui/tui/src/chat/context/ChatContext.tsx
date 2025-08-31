import React, { createContext, useContext, ReactNode, useEffect, useMemo, memo } from 'react';
import { globalChatStore } from '../store';
import { useUnionStore } from '@langgraph-js/sdk';
import { useStore } from '@nanostores/react';
import { useSettings } from './SettingsContext';

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
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { config } = useSettings();

    const storeInstance = useMemo(() => {
        const chatStore = globalChatStore(config!.apiUrl, config!.agentName);
        chatStore.mutations.initClient().catch((err) => {
            console.error(err);
        });
        return chatStore;
    }, [config?.apiUrl, config?.agentName]);
    const store = useUnionStore(storeInstance, useStore);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
