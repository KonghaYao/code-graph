import React from 'react';
import { Box, Text } from 'ink';
import Markdown from './Markdown';
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
        <Box flexDirection="column" marginBottom={1} paddingX={1}>
            <Box paddingBottom={0}>
                <Text color="cyan" bold>
                    {messageNumber}. {modelName} ({message.name})
                </Text>
                <UsageMetadata
                    response_metadata={message.response_metadata as any}
                    usage_metadata={message.usage_metadata || {}}
                    spend_time={message.spend_time}
                    id={message.id}
                />
            </Box>
            <Box>
                <Text>{getMessageContent(message.content)}</Text>
            </Box>
        </Box>
    );
};

export default MessageAI;
