import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { EnhancedTextInput } from './EnhancedTextInput';
import { useChatInputBuffer } from '../../context/ChatInputBufferContext';
import { commandRegistry } from '../../commands';

export interface ChatInputBufferProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    loading: boolean;
    placeholder?: string;
    commandHandler: {
        isCommandInput: boolean;
        CommandHintUI: React.FC;
    };
}

export const ChatInputBuffer: React.FC<ChatInputBufferProps> = ({
    value,
    onChange,
    onSubmit,
    loading,
    placeholder = '输入消息...',
    commandHandler,
}) => {
    const { bufferedMessage, setBufferedMessage, clearBuffer } = useChatInputBuffer();
    const [internalValue, setInternalValue] = useState(value);

    // 同步外部 value 变化
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    // 计算是否为命令输入（基于 internalValue）
    const isCommandInput = useMemo(() => internalValue.startsWith('/'), [internalValue]);

    // 获取命令建议
    const commandSuggestions = useMemo(() => {
        if (!isCommandInput) return [];
        return commandRegistry.getSuggestions(internalValue);
    }, [isCommandInput, internalValue]);

    // 处理输入变化，同步到外部和命令检测
    const handleChange = (newValue: string) => {
        setInternalValue(newValue);
        onChange(newValue); // 同步到外部 userInput，让 CommandHandler 能检测到
    };

    const handleSubmit = async () => {
        if (!internalValue.trim()) return;

        // 命令优先处理
        if (isCommandInput) {
            onSubmit(internalValue);
            setInternalValue('');
            return;
        }

        if (loading) {
            // AI 响应中：加入缓冲区
            setBufferedMessage(internalValue);
            setInternalValue(''); // 清空输入框
        } else {
            // AI 空闲：直接发送
            onSubmit(internalValue);
            setInternalValue('');
        }
    };

    // 处理 Esc 键清空缓冲区
    const handleEsc = () => {
        if (bufferedMessage) {
            clearBuffer(); // 清空缓冲区
        } else {
            setInternalValue(''); // 清空输入框
        }
    };

    return (
        <Box flexDirection="column">
            {/* 缓冲区提示条 */}
            {bufferedMessage && (
                <Box paddingX={1}>
                    <Text color="yellow">
                        📝 缓冲区: {bufferedMessage.slice(0, 50)}
                        {bufferedMessage.length > 50 ? '...' : ''}
                    </Text>
                </Box>
            )}

            {/* 外部命令提示（用于错误和成功消息） */}
            <commandHandler.CommandHintUI />

            {/* 输入框 */}
            <Box alignItems="center">
                <Box marginX={1}>
                    <Text color={isCommandInput ? 'yellow' : 'green'} bold>
                        {isCommandInput ? '⚡ ' : '💬 '}
                    </Text>
                </Box>

                <EnhancedTextInput
                    id="global-input"
                    value={internalValue}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onHotKey={(input, key) => {
                        if (key.escape) {
                            handleEsc();
                            return false; // 阻止默认行为
                        }
                        return true;
                    }}
                    placeholder={
                        loading
                            ? bufferedMessage
                                ? '按 Esc 清空缓冲区'
                                : 'AI 响应中，Enter 将消息加入缓冲区'
                            : isCommandInput
                            ? '输入命令... (试试 /help)'
                            : placeholder
                    }
                />
            </Box>
        </Box>
    );
};
