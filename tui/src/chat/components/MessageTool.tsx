import React, { JSX } from 'react';
import { Box, Text } from 'ink';
import Markdown from './Markdown';
// import SyntaxHighlight from 'ink-syntax-highlight';
import { LangGraphClient, RenderMessage, ToolMessage } from '@langgraph-js/sdk';
import { UsageMetadata } from './UsageMetadata';
import { useChat } from '@langgraph-js/sdk/react';
import { ToolRenderData } from '@langgraph-js/sdk';

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

const formatJsonForTerminal = (
    data: any,
    indent: number = 0,
    maxDepth: number = 2,
    maxLength: number = 5,
    maxValueLength: number = 100,
): string => {
    const indentChar = '  '; // Using two spaces for indentation
    const currentIndent = indentChar.repeat(indent);
    const nextIndent = indentChar.repeat(indent + 1);

    if (data === null) {
        return 'null';
    }

    if (typeof data !== 'object') {
        const stringified = JSON.stringify(data); // Safely stringify primitive values
        // 控制字符串值的长度
        if (typeof data === 'string' && stringified.length > maxValueLength + 2) {
            // +2 for quotes
            const truncated = stringified.substring(1, maxValueLength + 1); // Remove opening quote
            return `${truncated}..." (truncated, ${stringified.length - 2} chars)`;
        }
        return stringified;
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
            items.push(
                `${nextIndent}- ${formatJsonForTerminal(data[i], indent + 1, maxDepth, maxLength, maxValueLength)}`,
            );
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
        const value = formatJsonForTerminal(data[key], indent + 1, maxDepth, maxLength, maxValueLength);
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
    return [...firstTwo, `... and more ${lines.length - 5} lines`, ...lastTwo].join('\n');
};

const InputPreviewer = ({ content }: { content: any }) => {
    const formattedJson = formatJsonForTerminal(content, 0, 2, 5); // 限制深度为2，长度为5
    return <Text>{formattedJson}</Text>;
};

const MessageTool: React.FC<MessageToolProps> = ({ message, getMessageContent, isCollapsed, messageNumber }) => {
    const { getToolUIRender, client } = useChat();
    const tool = new ToolRenderData(message, client!);
    const render = getToolUIRender(message.name!);
    const borderColor = getToolColor(message.name!);

    if (render) {
        return render(message as RenderMessage) as JSX.Element;
    }

    return (
        <Box flexDirection="column" paddingX={1} paddingY={0} marginBottom={1}>
            <Box>
                <Text color={borderColor} bold>
                    {messageNumber}. 🔧 {message.name}
                </Text>
                <UsageMetadata
                    response_metadata={message.response_metadata as any}
                    usage_metadata={message.usage_metadata || {}}
                    spend_time={message.spend_time}
                    id={message.id}
                    tool_call_id={message.tool_call_id}
                />
            </Box>

            {!isCollapsed && (
                <Box flexDirection="column" paddingTop={0} paddingLeft={0}>
                    {/* 入参 */}
                    <InputPreviewer content={tool.getInputRepaired()} />

                    <Box paddingTop={1} paddingBottom={0}>
                        <Text dimColor>{truncateContentForDisplay(getMessageContent(message.content))}</Text>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default MessageTool;
