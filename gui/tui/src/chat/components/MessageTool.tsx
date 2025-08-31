import React, { JSX } from 'react';
import { Box, Text } from 'ink';
import Markdown from './Markdown';
import SyntaxHighlight from 'ink-syntax-highlight';
import { LangGraphClient, RenderMessage, ToolMessage } from '@langgraph-js/sdk';
import { UsageMetadata } from './UsageMetadata';
import { useChat } from '../context/ChatContext';

const TOOL_COLORS: { [key: string]: string } = {
    'border-red-400': 'red',
    'border-blue-400': 'blue',
    'border-green-500': 'green',
    'border-yellow-400': 'yellow',
    'border-purple-400': 'magenta',
    'border-pink-400': 'cyan', // Closest available
    'border-indigo-400': 'blue', // Closest available
};
const TOOL_COLOR_NAMES = Object.keys(TOOL_COLORS);

interface MessageToolProps {
    message: ToolMessage & RenderMessage;
    client: LangGraphClient;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const getToolColor = (tool_name: string): string => {
    let hash = 0;
    for (let i = 0; i < tool_name.length; i++) {
        hash = tool_name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % TOOL_COLOR_NAMES.length);
    const colorName = TOOL_COLOR_NAMES[index];
    return TOOL_COLORS[colorName];
};

const MessageTool: React.FC<MessageToolProps> = ({
    message,
    client,
    getMessageContent,
    formatTokens,
    isCollapsed,
    onToggleCollapse,
}) => {
    const { getToolUIRender } = useChat();
    const render = getToolUIRender(message.name!);
    const borderColor = getToolColor(message.name!);
    // In Ink, collapsibility is handled by not rendering content.
    // The parent component's state (`isCollapsed`) determines this.

    if (render) {
        return render(message) as JSX.Element;
    }

    return (
        <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
            <Box>
                <Text bold>{message.name}</Text>
            </Box>

            {false && (
                <Box flexDirection="column" paddingTop={1}>
                    <Text bold color="gray">
                        Tool Input:
                    </Text>
                    <Previewer content={message.tool_input || ''} />
                    <Text bold color="gray">
                        Tool Output:
                    </Text>
                    <Previewer content={getMessageContent(message.content)} />
                    <UsageMetadata
                        response_metadata={message.response_metadata as any}
                        usage_metadata={message.usage_metadata || {}}
                        spend_time={message.spend_time}
                        id={message.id}
                        tool_call_id={message.tool_call_id}
                    />
                </Box>
            )}
        </Box>
    );
};

const Previewer = ({ content }: { content: string }) => {
    const validJSON = () => {
        try {
            JSON.parse(content);
            return true;
        } catch (e) {
            return false;
        }
    };
    const isJSON =
        (content.startsWith('{') && content.endsWith('}')) ||
        (content.startsWith('[') && content.endsWith(']') && validJSON());

    if (isJSON) {
        return <SyntaxHighlight language="json" code={JSON.stringify(JSON.parse(content), null, 2)} />;
    }

    // A simple check for markdown. This could be improved.
    const isMarkdown = content.includes('#') || content.includes('```') || content.includes('*');

    if (isMarkdown) {
        return <Markdown>{content}</Markdown>;
    }

    return <Text>{content}</Text>;
};

export default MessageTool;
