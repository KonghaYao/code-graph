/**
 * 命令处理组件 - 负责命令的检测、建议和执行
 */

import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { commandRegistry } from '../commands';
import { CommandContext } from '../commands/types';
import { useChat } from '../context/ChatContext';
import { Message } from '@langgraph-js/sdk';

interface CommandHandlerProps {
    /** 额外参数 */
    extraParams?: any;
    /** 命令执行完成回调 */
    onCommandExecuted?: () => void;
}

interface CommandHandlerReturn {
    /** 是否为命令输入 */
    isCommandInput: boolean;
    /** 命令建议列表 */
    commandSuggestions: any[];
    /** 是否显示命令提示 */
    showCommandHint: boolean;
    /** 命令错误信息 */
    commandError: string | null;
    /** 执行命令函数 */
    executeCommand: () => Promise<boolean>;
    /** 命令提示UI组件 */
    CommandHintUI: React.FC;
    /** 命令错误UI组件 */
    CommandErrorUI: React.FC;
}

export const useCommandHandler = (props: CommandHandlerProps): CommandHandlerReturn => {
    const { extraParams, onCommandExecuted } = props;

    // 从 useChat 获取所有需要的状态和函数
    const { userInput, setUserInput, sendMessage, currentAgent, client, createNewChat } = useChat();

    const [commandError, setCommandError] = useState<string | null>(null);

    // 检查是否为命令输入并获取建议
    const isCommandInput = userInput.startsWith('/');
    const commandSuggestions = isCommandInput ? commandRegistry.getSuggestions(userInput) : [];
    const showCommandHint = isCommandInput;

    const executeCommand = useCallback(async (): Promise<boolean> => {
        if (!commandRegistry.isCommand(userInput)) {
            return false; // 不是命令，返回 false 让调用者继续处理
        }

        try {
            const commandContext: CommandContext = {
                userInput,
                setUserInput,
                sendMessage,
                currentAgent,
                client,
                extraParams,
                createNewChat,
            };

            const result = await commandRegistry.executeCommand(userInput, commandContext);

            if (!result.success) {
                setCommandError(result.message || '命令执行失败');
                setTimeout(() => setCommandError(null), 3000); // 3秒后清除错误
            } else {
                if (result.message) {
                    // 显示命令执行结果（可选）
                    console.log('命令执行成功:', result.message);
                }
            }

            if (result.shouldClearInput) {
                setUserInput('');
            }

            // 如果命令要求发送消息，则发送
            if (result.shouldSendMessage && result.messageContent) {
                const content: Message[] = [
                    {
                        type: 'human',
                        content: result.messageContent,
                    },
                ];
                sendMessage(content, { extraParams });
            }

            onCommandExecuted?.();
            return true; // 命令已处理
        } catch (error) {
            setCommandError(`命令执行错误: ${error instanceof Error ? error.message : String(error)}`);
            setTimeout(() => setCommandError(null), 3000);
            return true; // 即使出错也认为命令已处理
        }
    }, [userInput, setUserInput, sendMessage, currentAgent, client, extraParams, createNewChat, onCommandExecuted]);

    // 命令提示UI组件
    const CommandHintUI: React.FC = () => {
        if (!showCommandHint || commandSuggestions.length === 0) {
            return null;
        }

        return (
            <Box marginBottom={1} flexDirection="column">
                <Text color="yellow" bold>
                    命令建议:
                </Text>
                {commandSuggestions.slice(0, 5).map((suggestion, index: number) => (
                    <Text key={index} color="cyan">
                        {suggestion.displayText} - {suggestion.description}
                    </Text>
                ))}
                {commandSuggestions.length > 5 && (
                    <Text color="gray">...还有 {commandSuggestions.length - 5} 个命令</Text>
                )}
            </Box>
        );
    };

    // 命令错误UI组件
    const CommandErrorUI: React.FC = () => {
        if (!commandError) {
            return null;
        }

        return (
            <Box marginBottom={1}>
                <Text color="red">❌ {commandError}</Text>
            </Box>
        );
    };

    return {
        isCommandInput,
        commandSuggestions,
        showCommandHint,
        commandError,
        executeCommand,
        CommandHintUI,
        CommandErrorUI,
    };
};
