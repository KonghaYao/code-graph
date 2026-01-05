import { Box, Static } from 'ink';
import { useMemo } from 'react';
import MessageHuman from './MessageHuman';
import MessageAI from './MessageAI';
import MessageTool from './MessageTool';
import { RenderMessage } from '@langgraph-js/sdk';

const StaticMessagesBox = ({ renderMessages, startIndex, flashMessageCount = 1 }: { renderMessages: RenderMessage[]; startIndex: number; flashMessageCount?: number }) => {
    // 使用 ref 来稳定历史消息的渲染
    const historyCount = useMemo(() => Math.max(0, renderMessages.length - flashMessageCount), [renderMessages.length, flashMessageCount]);
    const activeMessages = renderMessages.slice(-flashMessageCount);

    const renderMessage = useMemo(() => (message: RenderMessage, index: number) => (
        <Box key={message.unique_id || message.id} flexDirection="column" marginBottom={0}>
            {message.type === 'human' ? (
                <MessageHuman
                    content={message.content}
                    messageNumber={index + 1 + startIndex}
                />
            ) : message.type === 'tool' ? (
                <MessageTool message={message} messageNumber={index + 1 + startIndex} />
            ) : (
                <MessageAI message={message} messageNumber={index + 1 + startIndex} />
            )}
        </Box>
    ), [startIndex]);

    return (
        <Box flexDirection="column" paddingY={0}>
            <Static items={renderMessages.slice(0, -flashMessageCount)}>{(message, index) => renderMessage(message, index)}</Static>
            {activeMessages.map((message, index) => renderMessage(message, historyCount + index))}
        </Box>
    );
};

const freshCount = 10000;

export const MessagesBox = ({
    renderMessages,
    startIndex,
    flashMessageCount = freshCount,
}: {
    renderMessages: RenderMessage[];
    startIndex: number;
    flashMessageCount?: number;
}) => {
    // 使用唯一的 key 来强制在消息真正发生变化时重新创建组件
    const messagesKey = useMemo(
        () => renderMessages.map(m => m.unique_id || m.id).join('-'),
        [renderMessages]
    );

    return <StaticMessagesBox key={messagesKey} renderMessages={renderMessages} startIndex={startIndex} flashMessageCount={flashMessageCount} />;
};
