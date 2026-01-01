import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { useSettings } from '../context/SettingsContext';
import { useChat } from '@langgraph-js/sdk/react';

interface SettingsPanelProps {
    onClose: () => void;
}

type FocusableInput = 'apiUrl' | 'agentName' | 'mainModel' | null;

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const { config, updateConfig } = useSettings();
    const { client } = useChat();
    const [tempApiUrl, setTempApiUrl] = useState(config?.apiUrl || '');
    const [tempAgentName, setTempAgentName] = useState(config?.agentName || '');
    const [tempMainModel, setTempMainModel] = useState(config?.main_model || '');
    const [focusedInput, setFocusedInput] = useState<FocusableInput>('apiUrl');

    useEffect(() => {
        if (config) {
            setTempApiUrl(config.apiUrl);
            setTempAgentName(config.agentName);
            setTempMainModel(config.main_model);
        }
    }, [config]);

    useInput((input, key) => {
        if (key.escape || input === 'q') {
            onClose();
        }
        if (key.tab) {
            const inputs: FocusableInput[] = ['apiUrl', 'agentName', 'mainModel'];
            const currentIndex = inputs.indexOf(focusedInput);
            const nextIndex = (currentIndex + 1) % inputs.length;
            setFocusedInput(inputs[nextIndex]);
        }
        if (input === 's') {
            handleSave();
        }
    });

    const handleSave = async () => {
        await updateConfig({ apiUrl: tempApiUrl, agentName: tempAgentName, main_model: tempMainModel });
        onClose();
    };

    const agentOptions =
        client?.availableAssistants.map((i) => ({
            label: i.name,
            value: i.graph_id,
        })) || [];

    const handleAgentSelect = (item: { value: string }) => {
        setTempAgentName(item.value);
        setFocusedInput('mainModel'); // Move focus to the next input after selecting agent
    };

    return (
        <Box flexDirection="column" paddingX={1} paddingY={0} flexGrow={1}>
            <Box paddingBottom={0} justifyContent="space-between">
                <Text color="magenta" bold>
                    ⚙️ 设置
                </Text>
                <Text color="gray">
                    <Text color="cyan" bold>
                        s
                    </Text>
                    :保存{' '}
                    <Text color="cyan" bold>
                        q
                    </Text>
                    :取消
                </Text>
            </Box>

            <Box flexDirection="column" marginTop={1} marginBottom={0}>
                <Text color="white" bold>
                    🌐 API URL:
                </Text>
                <TextInput
                    value={tempApiUrl}
                    onChange={setTempApiUrl}
                    onSubmit={handleSave}
                    focus={focusedInput === 'apiUrl'}
                />
            </Box>

            <Box flexDirection="column" marginTop={1} marginBottom={0}>
                <Text color="white" bold>
                    🤖 Agent 名称:
                </Text>
                <SelectInput
                    items={agentOptions}
                    onSelect={handleAgentSelect}
                    initialIndex={agentOptions.findIndex((opt) => opt.value === tempAgentName)}
                    isFocused={focusedInput === 'agentName'}
                />
            </Box>
            <Box flexDirection="column" marginTop={1} marginBottom={0}>
                <Text color="white" bold>
                    🧠 主模型:
                </Text>
                <TextInput
                    value={tempMainModel}
                    onChange={setTempMainModel}
                    onSubmit={handleSave}
                    focus={focusedInput === 'mainModel'}
                />
            </Box>

            <Box marginTop={1}>
                <Text color="cyan">
                    按{' '}
                    <Text color="cyan" bold>
                        s
                    </Text>{' '}
                    保存或{' '}
                    <Text color="cyan" bold>
                        q
                    </Text>{' '}
                    取消
                </Text>
            </Box>
        </Box>
    );
};

export default SettingsPanel;
