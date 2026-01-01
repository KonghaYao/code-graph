import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { getConfig, updateConfig as updateDbConfig, initDb, AppConfig } from '../store/index';

interface SettingsContextType {
    config: AppConfig | null;
    updateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
    extraParams: {
        main_model: string;
        activeAgent: string;
    };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const extraParams = useMemo(() => {
        return {
            main_model: config?.main_model || 'claude-sonnet-4-5',
            activeAgent: config?.activeAgent || 'coding-agent',
            cwd: process.cwd(),
        };
    }, [config]);
    useEffect(() => {
        const loadConfig = async () => {
            await initDb();
            const loadedConfig = getConfig();
            setConfig(loadedConfig);
            setLoading(false);
        };
        loadConfig();
    }, []);

    const updateConfig = async (newConfig: Partial<AppConfig>) => {
        const updatedConfig = { ...config, ...newConfig } as AppConfig;
        setConfig(updatedConfig);
        // @ts-ignore activeAgent 字段不需要持久化
        delete newConfig['activeAgent'];
        await updateDbConfig(newConfig);
    };

    if (loading) {
        return null; // 或者显示加载指示器
    }

    return (
        <SettingsContext.Provider value={{ config, updateConfig, extraParams }}>{children}</SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
