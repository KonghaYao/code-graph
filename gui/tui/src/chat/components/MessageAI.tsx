import React from 'react';
import { Box, Text } from 'ink';
import Markdown from './Markdown';
import { RenderMessage } from '@langgraph-js/sdk';
import { UsageMetadata } from './UsageMetadata';
import { getMessageContent } from '@langgraph-js/sdk';

interface MessageAIProps {
    message: RenderMessage;
}

const MessageAI: React.FC<MessageAIProps> = ({ message }) => {
    return (
        <Box borderStyle="round" paddingX={1} flexDirection="column">
            <Box paddingBottom={1}>
                <Text bold>{message.name}</Text>
            </Box>
            <Box>
                <Markdown>{getMessageContent(message.content)}</Markdown>
            </Box>
            <UsageMetadata
                response_metadata={message.response_metadata as any}
                usage_metadata={message.usage_metadata || {}}
                spend_time={message.spend_time}
                id={message.id}
            />
        </Box>
    );
};

export default MessageAI;
