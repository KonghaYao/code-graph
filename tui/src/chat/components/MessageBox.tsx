import { Box, Static } from 'ink';
import MessageHuman from './MessageHuman';
import MessageAI from './MessageAI';
import MessageTool from './MessageTool';
import { RenderMessage } from '@langgraph-js/sdk';

export const MessagesBox = ({
    renderMessages,
    startIndex,
}: {
    renderMessages: RenderMessage[];

    startIndex: number;
}) => {
    // Separate history (static) and active (dynamic) messages
    // Keep the last message dynamic to allow for streaming updates
    const historyMessages = renderMessages.slice(0, -1);
    const activeMessage = renderMessages[renderMessages.length - 1];

    const renderMessage = (message: RenderMessage, index: number) => (
        <Box key={message.unique_id || message.id} flexDirection="column" marginBottom={0}>
            {message.type === 'human' ? (
                <MessageHuman
                    content={message.content}
                    messageNumber={index + 1 + startIndex}
                    key={message.unique_id}
                />
            ) : message.type === 'tool' ? (
                <MessageTool message={message} messageNumber={index + 1 + startIndex} key={message.unique_id} />
            ) : (
                <MessageAI message={message} messageNumber={index + 1 + startIndex} key={message.unique_id} />
            )}
        </Box>
    );

    return (
        <Box flexDirection="column" paddingY={0}>
            <Static items={historyMessages}>{(message, index) => renderMessage(message, index)}</Static>
            {activeMessage && renderMessage(activeMessage, historyMessages.length)}
        </Box>
    );
};
