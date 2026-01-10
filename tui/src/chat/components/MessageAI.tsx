import React from 'react';
import { Box, Text } from 'ink';
import { RenderMessage } from '@langgraph-js/sdk';
import { getMessageContent } from '@langgraph-js/sdk';
import { useSettings } from '../context/SettingsContext';
import Markdown from './Markdown';
import { getColor } from '../../utils/colors';

interface MessageAIProps {
    message: RenderMessage;
    messageNumber: number;
}

const MessageAI: React.FC<MessageAIProps> = ({ message, messageNumber }) => {
    const { extraParams } = useSettings();
    const modelName = extraParams.main_model || 'AI';
    if (
        Array.isArray(message.content) &&
        message.content.every(
            (i) =>
                /** @ts-ignore anthropic 的神奇妙招 */
                i.type === 'tool_use',
        )
    )
        return <></>;
    return (
        <Box flexDirection="column">
            <Box paddingBottom={0} marginBottom={1}>
                <Text color={getColor('teal')}>
                    {messageNumber} {modelName}
                </Text>
            </Box>
            <Markdown>{getMessageContent(message.content).trim()}</Markdown>
        </Box>
    );
};

export default MessageAI;
