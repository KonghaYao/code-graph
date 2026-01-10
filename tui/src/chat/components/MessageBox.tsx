import { Box, Static } from 'ink';
import { useMemo, useState, useEffect, useRef } from 'react';
import MessageHuman from './MessageHuman';
import MessageAI from './MessageAI';
import MessageTool from './MessageTool';
import { RenderMessage } from '@langgraph-js/sdk';
import { useChat } from '@langgraph-js/sdk/react';
import { getConfig } from '../store/index';
import { getColor } from '../../utils/colors';

export const MessagesBox = ({
    renderMessages,
    startIndex,
    flashMessageCount = 3,
}: {
    renderMessages: RenderMessage[];
    startIndex: number;
    flashMessageCount?: number;
}) => {
    const { loading } = useChat();
    const [syncedMessages, setSyncedMessages] = useState<RenderMessage[]>(renderMessages);
    const messagesRef = useRef<RenderMessage[]>(renderMessages);

    // 保持 ref 始终是最新的 renderMessages
    useEffect(() => {
        messagesRef.current = renderMessages;
    }, [renderMessages]);

    // 当不 loading 时，直接更新 renderMessages
    useEffect(() => {
        if (!loading) setSyncedMessages(messagesRef.current);
    }, [loading, renderMessages]);

    // 每秒从 ref 中同步最新的 renderMessages
    useEffect(() => {
        const timer = setInterval(() => {
            setSyncedMessages(messagesRef.current);
        }, getConfig().stream_refresh_interval || 100);

        return () => clearInterval(timer);
    }, []);

    // 使用 ref 来稳定历史消息的渲染
    const historyCount = useMemo(
        () => Math.max(0, syncedMessages.length - flashMessageCount),
        [syncedMessages.length, flashMessageCount],
    );

    const renderMessage = (message: RenderMessage, index: number) => (
        <Box
            key={message.unique_id || message.id || crypto.randomUUID()}
            flexDirection="column"
            borderStyle="single"
            borderLeft
            paddingLeft={1}
            borderBottom={false}
            borderTop={false}
            borderRight={false}
            borderLeftColor={
                message.type === 'ai' ? getColor('teal') : message.type === 'human' ? getColor('amber') : 'yellow'
            }
            paddingBottom={1}
        >
            {message.type === 'human' ? (
                <MessageHuman content={message.content} messageNumber={index + 1 + startIndex} />
            ) : message.type === 'tool' ? (
                <MessageTool message={message} messageNumber={index + 1 + startIndex} />
            ) : (
                <MessageAI message={message} messageNumber={index + 1 + startIndex} />
            )}
        </Box>
    );

    return (
        <Box flexDirection="column" paddingY={1}>
            <Box flexDirection="column">
                <Static items={syncedMessages.slice(0, -flashMessageCount)}>
                    {(message, index) => renderMessage(message, index)}
                </Static>
            </Box>
            <Box flexDirection="column">
                {syncedMessages
                    .slice(-flashMessageCount)
                    .map((message, index) => renderMessage(message, historyCount + index))}
            </Box>
        </Box>
    );
};
