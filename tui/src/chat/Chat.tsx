import React, { useMemo, useState, useEffect } from 'react';
import { Box, Text, useInput, useFocusManager } from 'ink';
import Spinner from 'ink-spinner';
import { EnhancedTextInput } from './components/input/EnhancedTextInput';
import { MessagesBox } from './components/MessageBox';
import HistoryList from './components/HistoryList';
import { ChatProvider, useChat } from '@langgraph-js/sdk/react';
import { Message } from '@langgraph-js/sdk';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { useCommandHandler } from './components/CommandHandler';
import { LangGraphFetch } from '../../../agents/code/export';
import WelcomeHeader from './components/WelcomeHeader';
import TokenProgressBar from './components/TokenProgressBar';
import DefaultTools from './tools/index';
import Shimmer from './components/Shimmer';

const ChatMessages = () => {
    const { renderMessages, loading, inChatError, isFELocking } = useChat();
    const visibleMessages = renderMessages;

    return (
        <Box flexDirection="column" flexGrow={1} paddingX={0} paddingY={0}>
            {visibleMessages.length === 0 && <WelcomeHeader />}
            <MessagesBox renderMessages={visibleMessages} startIndex={0} />
            {loading && !isFELocking() && (
                <Box marginTop={1} paddingLeft={1}>
                    <Text>
                        <Spinner type="dots" /> <Shimmer text="正在思考中... Ctrl + C 中断"></Shimmer>
                    </Text>
                </Box>
            )}
            {inChatError && (
                <Box marginTop={0} paddingLeft={1}>
                    <Text color="red">❌ {JSON.stringify(inChatError)}</Text>
                </Box>
            )}
        </Box>
    );
};

interface ChatInputProps {
    mode: 'agent';
    setMode: (mode: 'agent') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ mode }) => {
    const { userInput, setUserInput, sendMessage, loading, renderMessages } = useChat();
    const { extraParams } = useSettings();

    // 使用命令处理组件
    const commandHandler = useCommandHandler({
        extraParams,
    });
    const lastMessageToken = useMemo(() => {
        const index = renderMessages.findLastIndex((i) => i.usage_metadata?.input_tokens);
        if (index === -1) return 0;
        return renderMessages[index].usage_metadata?.input_tokens;
    }, [renderMessages]);
    const sendTextMessage = async () => {
        if (!userInput) return;

        // 尝试执行命令
        const commandHandled = await commandHandler.executeCommand();
        if (commandHandled) {
            return; // 命令已处理，不继续执行普通消息发送
        }

        // 普通消息处理
        const content: Message[] = [
            {
                type: 'human',
                content: userInput,
            },
        ];

        sendMessage(content, {
            extraParams,
        });
        setUserInput('');
    };

    return (
        <Box flexDirection="column" paddingX={0} paddingY={0}>
            {/* 命令错误显示 */}
            <commandHandler.CommandErrorUI />

            {/* 命令成功消息显示 */}
            <commandHandler.CommandSuccessUI />

            {/* 命令提示 */}
            <commandHandler.CommandHintUI />

            <Box alignItems="center">
                <Box marginRight={1}>
                    <Text color={commandHandler.isCommandInput ? 'yellow' : 'green'} bold>
                        {commandHandler.isCommandInput ? '⚡ ' : '💬 '}
                    </Text>
                </Box>
                <EnhancedTextInput
                    id={'global-input'}
                    disabled={loading} // 后面可以改为 interrupt 状态时，才禁用，添加上缓冲区的概念
                    value={userInput as string}
                    onChange={setUserInput}
                    onSubmit={sendTextMessage}
                    onHotKey={(value) => {
                        if (value === 'ç') {
                            // stopGeneration();
                            return false;
                        }
                        return true;
                    }}
                    placeholder={commandHandler.isCommandInput ? '输入命令... (试试 /help)' : '输入消息...'}
                    autoFocus
                />
            </Box>
            <Box paddingX={1} justifyContent="flex-end">
                <TokenProgressBar currentTokens={lastMessageToken || 0} />
            </Box>
        </Box>
    );
};

const Chat: React.FC = () => {
    const { extraParams } = useSettings();
    const { toggleHistoryVisible, setUserInput, createNewChat, setTools, loading, stopGeneration, currentChatId } =
        useChat();
    useEffect(() => {
        console.clear();
        setTools(DefaultTools);
    }, []);

    useEffect(() => {
        !loading && focusManager.focus('global-input');
    }, [loading]);

    const focusManager = useFocusManager();
    const [activeView, setActiveView] = useState<'chat' | 'history'>('chat');
    const [mode, setMode] = useState<'command' | 'agent'>('agent');
    // Global Ctrl+C exit handler
    useInput((input, key) => {
        if (key.ctrl && input === 'c') {
            if (loading) {
                stopGeneration();
            } else {
                process.exit();
            }
        }
    });

    // Command mode specific input handler (i, a, h)
    useInput(
        (input, key) => {
            if (activeView !== 'chat') {
                return;
            }
            if (input === 'a') setMode('agent');
            else if (input === 'h') {
                toggleHistoryVisible();
                setActiveView('history');
            } else if (input === 'n') {
                // 'n' for new chat
                console.clear();
                createNewChat(); // 调用 client 上的 newChat 方法
                setUserInput(''); // 清空输入框
                setMode('agent'); // 进入 agent 模式
                focusManager.focus('global-input');
            }
        },
        { isActive: mode === 'command' }, // Only active when in command mode
    );

    // Input/Agent mode specific input handler (esc, Shift+Tab)
    useInput(
        (input, key) => {
            if (activeView !== 'chat') {
                return;
            }

            if (key.escape) {
                setMode('command');
            }
        },
        { isActive: mode === 'agent' }, // Active when in input or agent mode
    );

    // Props for ChatInput
    const chatInputMode = 'agent'; // Always agent mode
    const setChatInputMode = (newMode: 'agent') => setMode(newMode); // Keep setMode to agent

    return (
        <Box flexDirection="column" width="100%">
            <Box flexGrow={1} flexDirection="row">
                {activeView === 'chat' && (
                    <Box flexDirection="column" flexGrow={1}>
                        <ChatMessages key={currentChatId} />
                        <ChatInput mode={chatInputMode} setMode={setChatInputMode} />
                    </Box>
                )}
                {activeView === 'history' && (
                    <HistoryList
                        onClose={() => {
                            setActiveView('chat');
                            setMode('agent');
                            focusManager.focus('global-input');
                        }}
                    />
                )}
            </Box>
            <Box paddingX={1} paddingY={0} justifyContent="space-between">
                <Box>
                    <Text color="magenta" bold>
                        ⚡ LangGraph Chat
                    </Text>
                    {mode === 'command' && (
                        <Text color="yellow" bold>
                            {' '}
                            [CMD]
                        </Text>
                    )}
                    {mode === 'agent' && (
                        <Text color="cyan" bold>
                            {' '}
                            {extraParams.main_model}
                        </Text>
                    )}
                </Box>
                <Box>
                    {mode === 'command' ? (
                        <Text>
                            <Text color="cyan" bold>
                                a
                            </Text>
                            <Text color="gray">:Agent </Text>
                            <Text color="cyan" bold>
                                h
                            </Text>
                            <Text color="gray">:历史 </Text>

                            <Text color="cyan" bold>
                                n
                            </Text>
                            <Text color="gray">:新建 </Text>
                            <Text color="red" bold>
                                ^C
                            </Text>
                            <Text color="gray">:退出</Text>
                        </Text>
                    ) : (
                        <Text>
                            <Text>{currentChatId?.slice(0, 6) + ' '}</Text>
                            <Text color="cyan" bold>
                                ESC
                            </Text>
                            <Text color="gray">:命令</Text>
                        </Text>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

const ChatWrapper: React.FC = () => {
    const { config } = useSettings();

    if (!config) {
        return <Text>Loading settings...</Text>;
    }

    return (
        <ChatProvider
            apiUrl="http://127.0.0.1:8123"
            defaultAgent="code"
            defaultHeaders={{}}
            withCredentials={false}
            showHistory={false}
            showGraph={false}
            onInitError={(error, currentAgent) => {
                console.error(error, currentAgent);
            }}
            fetch={LangGraphFetch as any}
            autoRestoreLastSession
        >
            <Chat />
        </ChatProvider>
    );
};

const AppProviders: React.FC = () => (
    <SettingsProvider>
        <ChatWrapper />
    </SettingsProvider>
);

export default AppProviders;
