import React, { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
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

    // Always call globalChatStore, even if with default values, to ensure consistent hook calls

    const storeInstance = useMemo(() => globalChatStore(config!.apiUrl, config!.agentName), [config]);
    const store = useUnionStore(storeInstance, useStore);
    useEffect(() => {
        // Prevent initClient if store or config not ready, or if settings are still loading
        if (!store || !config) return;

        store
            .initClient()
            .then((res) => {
                console.log('初始化完成');
            })
            .catch((err) => {
                console.error(err);
            });
    }, [storeInstance]);

    return <ChatContext.Provider value={{ ...store }}>{children}</ChatContext.Provider>;
};
