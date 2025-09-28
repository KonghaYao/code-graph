import { Box, Text } from 'ink';
import MessageHuman from './MessageHuman';
import MessageAI from './MessageAI';
import MessageTool from './MessageTool';
import { formatTokens, getMessageContent, LangGraphClient, RenderMessage } from '@langgraph-js/sdk';

export const MessagesBox = ({
    renderMessages,
    collapsedTools,
    toggleToolCollapse,
    client,
    startIndex,
}: {
    renderMessages: RenderMessage[];
    collapsedTools: string[];
    toggleToolCollapse: (id: string) => void;
    client: LangGraphClient;
    startIndex: number;
}) => {
    return (
        <Box flexDirection="column" paddingY={0}>
            <Text>{JSON.stringify(renderMessages)}</Text>

            {renderMessages.map((message, index) => (
                <Box key={message.unique_id} flexDirection="column" marginBottom={0}>
                    {message.type === 'human' ? (
                        <MessageHuman content={message.content} messageNumber={index + 1 + startIndex} />
                    ) : message.type === 'tool' ? (
                        <MessageTool
                            message={message}
                            client={client!}
                            getMessageContent={getMessageContent}
                            formatTokens={formatTokens}
                            isCollapsed={collapsedTools.includes(message.id!)}
                            onToggleCollapse={() => toggleToolCollapse(message.id!)}
                            messageNumber={index + 1 + startIndex}
                        />
                    ) : (
                        <MessageAI message={message} messageNumber={index + 1 + startIndex} />
                    )}
                </Box>
            ))}
        </Box>
    );
};
