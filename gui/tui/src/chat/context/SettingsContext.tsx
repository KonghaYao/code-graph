import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { writeConfig, AppConfig, readConfig } from '../../utils/config';

interface SettingsContextType {
    config: AppConfig | null;
    updateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const globalConfig = { apiUrl: 'http://0.0.0.0:8123', agentName: 'code' };

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(globalConfig);

    useEffect(() => {
        const loadConfig = async () => {
            const loadedConfig = await readConfig();
            setConfig(loadedConfig);
        };
        loadConfig();
    }, []);

    const updateConfig = async (newConfig: Partial<AppConfig>) => {
        if (!config) return; // Should not happen if loaded correctly
        const updatedConfig = { ...config, ...newConfig };
        setConfig(updatedConfig);
        await writeConfig(updatedConfig);
    };

    return <SettingsContext.Provider value={{ config, updateConfig }}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
