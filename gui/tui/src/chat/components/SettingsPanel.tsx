import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { useSettings } from '../context/SettingsContext';
import { useChat } from '../context/ChatContext';

interface SettingsPanelProps {
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const { config, updateConfig } = useSettings();
    const { client } = useChat();
    const [tempApiUrl, setTempApiUrl] = useState(config?.apiUrl || '');
    const [tempAgentName, setTempAgentName] = useState(config?.agentName || '');

    useEffect(() => {
        if (config) {
            setTempApiUrl(config.apiUrl);
            setTempAgentName(config.agentName);
        }
    }, [config]);

    useInput((input, key) => {
        if (key.escape || input === 'q') {
            onClose();
        }
        if (input === 's') {
            handleSave();
        }
    });

    const handleSave = async () => {
        await updateConfig({ apiUrl: tempApiUrl, agentName: tempAgentName });
        onClose();
    };

    const agentOptions =
        client?.availableAssistants.map((i) => ({
            label: i.name,
            value: i.graph_id,
        })) || [];

    const handleAgentSelect = (item: { value: string }) => {
        setTempAgentName(item.value);
    };

    return (
        <Box flexDirection="column" borderStyle="round" padding={1} flexGrow={1}>
            <Box paddingBottom={1} justifyContent="space-between">
                <Text bold>⚙️ 设置</Text>
                <Text color="gray">'s': 保存 | 'q': 取消</Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text>API URL:</Text>
                <TextInput value={tempApiUrl} onChange={setTempApiUrl} onSubmit={handleSave} />
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text>Agent 名称:</Text>
                <SelectInput
                    items={agentOptions}
                    onSelect={handleAgentSelect}
                    initialIndex={agentOptions.findIndex((opt) => opt.value === tempAgentName)}
                />
            </Box>

            <Box>
                <Text color="cyan">按 's' 保存或 'q' 取消</Text>
            </Box>
        </Box>
    );
};

export default SettingsPanel;
