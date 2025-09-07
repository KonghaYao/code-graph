import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { MessagesBox } from './components/MessageBox';
import HistoryList from './components/HistoryList';
import { ChatProvider, useChat } from './context/ChatContext';
import { Message } from '@langgraph-js/sdk';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import SettingsPanel from './components/SettingsPanel';
import { useWindowSize } from '../hooks/useWindowSize';
import AgentOptions from './AgentOptions';
import { useCommandHandler } from './components/CommandHandler';

const MESSAGE_APPROX_HEIGHT = 3; // Approximate lines per message (更紧凑)

const ChatMessages: React.FC<{ scrollOffset: number; terminalHeight: number }> = ({ scrollOffset, terminalHeight }) => {
    const { renderMessages, loading, inChatError, client, collapsedTools, toggleToolCollapse, isFELocking } = useChat();

    const availableHeight = terminalHeight - 5; // Account for header and input box
    const maxVisibleMessages = Math.floor(availableHeight / MESSAGE_APPROX_HEIGHT);

    const startIndex = Math.max(0, renderMessages.length - maxVisibleMessages - scrollOffset);
    const endIndex = startIndex + maxVisibleMessages;

    const visibleMessages = renderMessages.slice(startIndex, endIndex);

    return (
        <Box flexDirection="column" flexGrow={1} paddingX={0} paddingY={0}>
            <MessagesBox
                renderMessages={visibleMessages}
                startIndex={startIndex}
                collapsedTools={collapsedTools}
                toggleToolCollapse={toggleToolCollapse}
                client={client!}
            />
            {loading && !isFELocking() && (
                <Box marginTop={0} paddingLeft={1}>
                    <Text>
                        <Spinner type="dots" /> <Text color="cyan">正在思考中...</Text>
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

const ChatInput: React.FC<ChatInputProps> = ({ mode, setMode }) => {
    const { userInput, setUserInput, sendMessage, currentAgent, client, currentChatId } = useChat();
    const { extraParams } = useSettings();

    // 使用命令处理组件
    const commandHandler = useCommandHandler({
        extraParams,
    });

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
        <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1} paddingY={0}>
            {/* 命令错误显示 */}
            <commandHandler.CommandErrorUI />

            {/* 命令成功消息显示 */}
            <commandHandler.CommandSuccessUI />

            {/* 命令提示 */}
            <commandHandler.CommandHintUI />

            <Box alignItems="center">
                <Box marginRight={1}>
                    <Text color={commandHandler.isCommandInput ? 'yellow' : 'green'} bold>
                        {commandHandler.isCommandInput ? '⚡' : '💬'}
                    </Text>
                </Box>
                <TextInput
                    value={userInput as string}
                    onChange={setUserInput}
                    onSubmit={sendTextMessage}
                    placeholder={commandHandler.isCommandInput ? '输入命令... (试试 /help)' : '输入消息...'}
                    focus={mode === 'agent'}
                />
            </Box>
            <Box justifyContent="space-between" marginTop={0}>
                <Box alignItems="center">
                    <Text color="magenta" bold>
                        🤖{' '}
                    </Text>
                    <Text color="white">
                        {client?.availableAssistants.find((a) => a.graph_id === currentAgent)?.name || '未选择'}
                    </Text>
                </Box>
                <Text color="gray" dimColor>
                    💬 {currentChatId?.slice(-8) || 'N/A'}
                </Text>
            </Box>
        </Box>
    );
};

const Chat: React.FC = () => {
    const { extraParams } = useSettings();
    const { toggleHistoryVisible, renderMessages, setUserInput, createNewChat } = useChat();
    const [activeView, setActiveView] = useState<
        'chat' | 'history' | 'settings' | 'graph' | 'artifacts' | 'agentOptions'
    >('chat');
    const [mode, setMode] = useState<'command' | 'agent'>('agent');
    const [scrollOffset, setScrollOffset] = useState(0);
    const { height: terminalHeight } = useWindowSize();

    const availableHeight = terminalHeight - 4; // Account for header and input box (更紧凑)
    const maxVisibleMessages = Math.floor(availableHeight / MESSAGE_APPROX_HEIGHT);
    const totalMessages = renderMessages.length;
    const maxScrollOffset = Math.max(0, totalMessages - maxVisibleMessages);
    // Global Ctrl+C exit handler
    useInput((input, key) => {
        if (key.ctrl && input === 'c') {
            process.exit();
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
            } else if (input === 's') setActiveView('settings');
            else if (input === 'g') setActiveView('agentOptions'); // 'g' for agent options
            else if (input === 'n') {
                // 'n' for new chat
                createNewChat(); // 调用 client 上的 newChat 方法
                setUserInput(''); // 清空输入框
                setScrollOffset(0); // 滚动到最底部
                setMode('agent'); // 进入 agent 模式
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

    // Scroll input handler
    useInput(
        (input, key) => {
            if (activeView !== 'chat' || mode === 'command') {
                return;
            }

            if (key.upArrow) {
                setScrollOffset((prev) => Math.min(maxScrollOffset, prev + 1));
            } else if (key.downArrow) {
                setScrollOffset((prev) => Math.max(0, prev - 1));
            }
        },
        { isActive: activeView === 'chat' && mode !== 'command' },
    );

    // Handle auto-scroll to bottom when new messages arrive
    useEffect(() => {
        setScrollOffset(0);
    }, [totalMessages, maxScrollOffset]);

    // Props for ChatInput
    const chatInputMode = 'agent'; // Always agent mode
    const setChatInputMode = (newMode: 'agent') => setMode(newMode); // Keep setMode to agent

    return (
        <Box flexDirection="column" width="100%" height="100%">
            <Box flexGrow={1} flexDirection="row">
                {activeView === 'chat' && (
                    <Box flexDirection="column" flexGrow={1}>
                        <ChatMessages scrollOffset={scrollOffset} terminalHeight={terminalHeight} />
                        <ChatInput mode={chatInputMode} setMode={setChatInputMode} />
                    </Box>
                )}
                {activeView === 'history' && (
                    <HistoryList
                        onClose={() => {
                            setActiveView('chat');
                            setMode('agent');
                        }}
                    />
                )}
                {activeView === 'settings' && (
                    <SettingsPanel
                        onClose={() => {
                            setActiveView('chat');
                            setMode('agent');
                        }}
                    />
                )}
                {activeView === 'agentOptions' && (
                    <AgentOptions
                        onClose={() => {
                            setActiveView('chat');
                            setMode('agent');
                        }}
                    />
                )}
            </Box>
            <Box borderStyle="double" borderColor="magenta" paddingX={1} paddingY={0} justifyContent="space-between">
                <Text>
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
                            [{extraParams.activeAgent}] {extraParams.main_model}
                        </Text>
                    )}
                </Text>
                <Text>
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
                                s
                            </Text>
                            <Text color="gray">:设置 </Text>
                            <Text color="cyan" bold>
                                g
                            </Text>
                            <Text color="gray">:选择 </Text>
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
                            <Text color="yellow">↑↓</Text>
                            <Text color="gray">:滚动 </Text>
                            <Text color="cyan" bold>
                                ESC
                            </Text>
                            <Text color="gray">:命令</Text>
                        </Text>
                    )}
                </Text>
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
        <ChatProvider apiUrl={config.apiUrl} agentName={config.agentName}>
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
