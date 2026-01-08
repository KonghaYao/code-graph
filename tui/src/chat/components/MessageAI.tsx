import React from 'react';
import { Box, Text } from 'ink';
import { RenderMessage } from '@langgraph-js/sdk';
import { UsageMetadata } from './UsageMetadata';
import { getMessageContent } from '@langgraph-js/sdk';
import { useSettings } from '../context/SettingsContext';

interface MessageAIProps {
    message: RenderMessage;
    messageNumber: number;
}

const MessageAI: React.FC<MessageAIProps> = ({ message, messageNumber }) => {
    const { extraParams } = useSettings();
    const modelName = extraParams.main_model || 'AI';

    return (
        <Box flexDirection="column" marginBottom={0}>
            <Box paddingBottom={0}>
                <Text color="cyan">
                    {messageNumber} {modelName}
                </Text>
            </Box>
            <Box>
                <Text color="gray">└─ </Text>
                <Text>{getMessageContent(message.content)}</Text>
            </Box>
        </Box>
    );
};

export default MessageAI;
