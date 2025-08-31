import { Box } from 'ink';
import MessageHuman from './MessageHuman';
import MessageAI from './MessageAI';
import MessageTool from './MessageTool';
import { formatTokens, getMessageContent, LangGraphClient, RenderMessage } from '@langgraph-js/sdk';

export const MessagesBox = ({
    renderMessages,
    collapsedTools,
    toggleToolCollapse,
    client,
}: {
    renderMessages: RenderMessage[];
    collapsedTools: string[];
    toggleToolCollapse: (id: string) => void;
    client: LangGraphClient;
}) => {
    return (
        <Box flexDirection="column">
            {renderMessages.map((message) => (
                <Box key={message.unique_id} flexDirection="column">
                    {message.type === 'human' ? (
                        <MessageHuman content={message.content} />
                    ) : message.type === 'tool' ? (
                        <MessageTool
                            message={message}
                            client={client!}
                            getMessageContent={getMessageContent}
                            formatTokens={formatTokens}
                            isCollapsed={collapsedTools.includes(message.id!)}
                            onToggleCollapse={() => toggleToolCollapse(message.id!)}
                        />
                    ) : (
                        <MessageAI message={message} />
                    )}
                </Box>
            ))}
        </Box>
    );
};
