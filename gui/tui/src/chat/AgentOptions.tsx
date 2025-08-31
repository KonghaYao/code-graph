import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { useChat } from './context/ChatContext';
import { useSettings } from './context/SettingsContext';

interface AgentOptionsProps {
    onClose: () => void;
}

const AgentOptions: React.FC<AgentOptionsProps> = ({ onClose }) => {
    const { client, currentAgent, setCurrentAgent } = useChat();
    const { updateConfig } = useSettings();
    const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(currentAgent);

    useEffect(() => {
        setSelectedAgentId(currentAgent);
    }, [currentAgent]);

    const agentOptions =
        client?.availableAssistants.map((i) => ({
            label: i.name,
            value: i.graph_id,
        })) || [];

    const handleAgentSelect = async (item: { value: string }) => {
        setSelectedAgentId(item.value);
        setCurrentAgent(item.value); // Update current agent in chat context
        await updateConfig({ agentName: item.value }); // Persist agent selection
        onClose();
    };

    return (
        <Box flexDirection="column" width="100%" height="100%" padding={1}>
            <Text>选择一个 Agent:</Text>
            <Box marginTop={1} flexGrow={1}>
                {agentOptions.length > 0 ? (
                    <SelectInput
                        items={agentOptions}
                        onSelect={handleAgentSelect}
                        initialIndex={agentOptions.findIndex((opt) => opt.value === selectedAgentId)}
                    />
                ) : (
                    <Text>没有可用的 Agent。</Text>
                )}
            </Box>
            <Box marginTop={1}>
                <Text color="gray">按 'esc' 返回。</Text>
            </Box>
        </Box>
    );
};

export default AgentOptions;
