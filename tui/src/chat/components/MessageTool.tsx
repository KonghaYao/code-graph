import React, { JSX } from 'react';
import { Box, Text } from 'ink';
import { RenderMessage, ToolMessage } from '@langgraph-js/sdk';
import { UsageMetadata } from './UsageMetadata';
import { useChat } from '@langgraph-js/sdk/react';
import { ToolRenderData } from '@langgraph-js/sdk';

const TOOL_COLOR_NAMES = [
    'blue',
    'green',
    'yellow',
    'magenta',
    'cyan', // Closest available
    'blue', // Closest available
];

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
    return TOOL_COLOR_NAMES[index];
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

/** 使用自制的 YAML 高亮，缩减包大小 */
const InputPreviewer = ({ content }: { content: any }) => {
    // Ink 内置颜色的递归渲染 (GitHub Dark 风格)
    const renderHighlightedContent = (
        data: any,
        indent: number = 0,
        depth: number = 0,
    ): JSX.Element | JSX.Element[] => {
        const indentChar = '  ';
        const currentIndent = indentChar.repeat(indent);

        if (depth >= 3) {
            return <Text dimColor>{'{...} (truncated)'}</Text>;
        }

        if (data === null) {
            return <Text color="gray">null</Text>;
        }

        if (typeof data !== 'object') {
            const stringified = JSON.stringify(data);
            if (typeof data === 'string' && stringified.length > 102) {
                const truncated = stringified.substring(1, 101);
                return (
                    <Text>
                        <Text color="cyan">"{truncated}..."</Text>{' '}
                        <Text dimColor>(truncated, {stringified.length - 2} chars)</Text>
                    </Text>
                );
            }

            // Ink 内置颜色类型着色
            if (typeof data === 'string') {
                return <Text color="cyan">{stringified}</Text>; // 青色用于字符串
            } else if (typeof data === 'number') {
                return <Text color="yellow">{data}</Text>; // 黄色用于数字
            } else if (typeof data === 'boolean') {
                return <Text color="magenta">{data.toString()}</Text>; // 洋红色用于布尔值
            } else {
                return <Text>{stringified}</Text>;
            }
        }

        if (Array.isArray(data)) {
            if (data.length === 0) {
                return <Text color="gray">[]</Text>;
            }

            const maxLength = 5;
            return (
                <>
                    {'\n'}
                    {data.slice(0, maxLength).map((item, index) => (
                        <Text key={index}>
                            <Text>{currentIndent}</Text>
                            <Text color="green">- </Text> {/* 绿色用于数组标记 */}
                            {renderHighlightedContent(item, indent + 1, depth + 1)}
                            {index < Math.min(data.length, maxLength) - 1 ? '\n' : ''}
                        </Text>
                    ))}
                    {data.length > maxLength && (
                        <Text>
                            {'\n'}
                            <Text>{currentIndent}</Text>
                            <Text dimColor>... ({data.length - maxLength} more)</Text>
                        </Text>
                    )}
                </>
            );
        }
        // Object rendering
        const keys = Object.keys(data);
        if (keys.length === 0) {
            return <Text color="gray">{}</Text>;
        }

        const maxLength = 5;
        return (
            <>
                {keys.slice(0, maxLength).map((key, index) => (
                    <Text key={key}>
                        <Text>{currentIndent}</Text>
                        <Text color="blue">{key}</Text> {/* 蓝色用于键 */}
                        <Text color="gray">: </Text> {/* 灰色用于冒号 */}
                        {renderHighlightedContent(data[key], indent + 1, depth + 1)}
                        {index < Math.min(keys.length, maxLength) - 1 ? '\n' : ''}
                    </Text>
                ))}
                {keys.length > maxLength && (
                    <Text>
                        {'\n'}
                        <Text>{currentIndent}</Text>
                        <Text dimColor>... ({keys.length - maxLength} more)</Text>
                    </Text>
                )}
            </>
        );
    };

    return <Text>{renderHighlightedContent(content)}</Text>;
};

const MessageTool: React.FC<MessageToolProps> = ({ message, getMessageContent, isCollapsed, messageNumber }) => {
    const { getToolUIRender, client } = useChat();
    const tool = new ToolRenderData<
        {
            title?: string;
            label?: string;
            description?: string;
        },
        any
    >(message, client!);
    const inputRepaired = tool.getInputRepaired();
    const label = inputRepaired?.title
        ? `: ${inputRepaired.title}`
        : inputRepaired?.description
        ? `: ${inputRepaired.description}`
        : '';
    const render = getToolUIRender(message.name!);
    let borderColor = getToolColor(message.name!);
    borderColor = message.status === 'error' ? 'red' : borderColor;
    return (
        <Box flexDirection="column" paddingX={1} paddingY={0} marginBottom={1}>
            <Box>
                <Text color={borderColor} bold>
                    {messageNumber}. 🔧 {message.name}
                    {label}
                </Text>
                <UsageMetadata
                    response_metadata={message.response_metadata as any}
                    usage_metadata={message.usage_metadata || {}}
                    spend_time={message.spend_time}
                    id={message.id}
                    tool_call_id={message.tool_call_id}
                />
            </Box>
            {message.sub_messages ? (
                <Text color={borderColor}>hidden {message.sub_messages.length} subagents message </Text>
            ) : null}

            <Box flexDirection="column" paddingTop={0} paddingLeft={0}>
                {/* 入参 */}
                <InputPreviewer content={tool.getInputRepaired()} />
                {render ? (
                    (render(message as RenderMessage) as JSX.Element)
                ) : (
                    <Box paddingTop={1} paddingBottom={0}>
                        <Text dimColor>{truncateContentForDisplay(getMessageContent(message.content))}</Text>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MessageTool;
