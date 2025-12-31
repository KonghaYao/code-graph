import React, { JSX } from 'react';
import { Box, Text } from 'ink';
import Markdown from './Markdown';
import SyntaxHighlight from 'ink-syntax-highlight';
import { LangGraphClient, RenderMessage, ToolMessage } from '@langgraph-js/sdk';
import { UsageMetadata } from './UsageMetadata';
import { useChat } from '@langgraph-js/sdk/react';

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
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    messageNumber: number;
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

const formatJsonForTerminal = (data: any, indent: number = 0, maxDepth: number = 2, maxLength: number = 5): string => {
    const indentChar = '  '; // Using two spaces for indentation
    const currentIndent = indentChar.repeat(indent);
    const nextIndent = indentChar.repeat(indent + 1);

    if (data === null) {
        return 'null';
    }

    if (typeof data !== 'object') {
        return JSON.stringify(data); // Safely stringify primitive values
    }

    if (indent >= maxDepth) {
        return '{...} (truncated)'; // Indicate truncation for deeply nested objects/arrays
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return '[]';
        }

        const items: string[] = [];
        for (let i = 0; i < Math.min(data.length, maxLength); i++) {
            items.push(`${nextIndent}- ${formatJsonForTerminal(data[i], indent + 1, maxDepth, maxLength)}`);
        }
        if (data.length > maxLength) {
            items.push(`${nextIndent}... (${data.length - maxLength} more)`);
        }

        return `\n${items.join('\n')}`;
    }

    // Object
    const keys = Object.keys(data);
    if (keys.length === 0) {
        return '{}';
    }

    const properties: string[] = [];
    for (let i = 0; i < Math.min(keys.length, maxLength); i++) {
        const key = keys[i];
        const value = formatJsonForTerminal(data[key], indent + 1, maxDepth, maxLength);
        properties.push(`${currentIndent}${JSON.stringify(key).replace(/^"|"$/g, '')}: ${value}`);
    }
    if (keys.length > maxLength) {
        properties.push(`${currentIndent}... (${keys.length - maxLength} more)`);
    }

    return `\n${properties.join('\n')}`;
};

const truncateContentForDisplay = (content: string, maxLines: number = 4): string => {
    const lines = content.split('\n');
    if (lines.length <= maxLines) {
        return content;
    }

    const firstTwo = lines.slice(0, 2);
    const lastTwo = lines.slice(lines.length - 3);
    return [...firstTwo, '...', ...lastTwo].join('\n');
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
        try {
            const parsedContent = JSON.parse(content);
            const formattedJson = formatJsonForTerminal(parsedContent, 0, 2, 5); // 限制深度为2，长度为5
            return <SyntaxHighlight language="yaml" code={formattedJson} />;
        } catch (e) {
            // Fallback if parsing or custom formatting fails
            return <Text>{content}</Text>;
        }
    }

    return <Markdown>{content}</Markdown>;
};

const MessageTool: React.FC<MessageToolProps> = ({ message, getMessageContent, isCollapsed, messageNumber }) => {
    const { getToolUIRender } = useChat();
    const render = getToolUIRender(message.name!);
    const borderColor = getToolColor(message.name!);

    if (render) {
        return render(message as RenderMessage) as JSX.Element;
    }

    return (
        <Box
            flexDirection="column"
            borderStyle="double"
            borderColor={borderColor}
            paddingX={1}
            paddingY={0}
            marginBottom={0}
        >
            <Box>
                <Text color={borderColor} bold>
                    {messageNumber}. 🔧 {message.name}
                </Text>
            </Box>

            {!isCollapsed && (
                <Box flexDirection="column" paddingTop={0}>
                    <Previewer content={truncateContentForDisplay(message.tool_input || '')} />

                    <Box paddingTop={1} paddingBottom={1}>
                        <Previewer content={truncateContentForDisplay(getMessageContent(message.content))} />
                    </Box>
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

export default MessageTool;
