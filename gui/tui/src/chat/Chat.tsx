import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { MessagesBox } from './components/MessageBox';
import HistoryList from './components/HistoryList';
import { ChatProvider, useChat } from './context/ChatContext';
import { ExtraParamsProvider, useExtraParams } from './context/ExtraParamsContext';
import { Message } from '@langgraph-js/sdk';
import { SettingsProvider } from './context/SettingsContext';
import SettingsPanel from './components/SettingsPanel';
import { useWindowSize } from '../hooks/useWindowSize';

const MESSAGE_APPROX_HEIGHT = 5; // Approximate lines per message

const ChatMessages: React.FC<{ scrollOffset: number; terminalHeight: number }> = ({ scrollOffset, terminalHeight }) => {
    const { renderMessages, loading, inChatError, client, collapsedTools, toggleToolCollapse, isFELocking } = useChat();

    const availableHeight = terminalHeight - 5; // Account for header and input box
    const maxVisibleMessages = Math.floor(availableHeight / MESSAGE_APPROX_HEIGHT);

    const startIndex = Math.max(0, renderMessages.length - maxVisibleMessages - scrollOffset);
    const endIndex = startIndex + maxVisibleMessages;

    const visibleMessages = renderMessages.slice(startIndex, endIndex);

    return (
        <Box flexDirection="column" flexGrow={1} padding={1}>
            <MessagesBox
                renderMessages={visibleMessages}
                collapsedTools={collapsedTools}
                toggleToolCollapse={toggleToolCollapse}
                client={client!}
            />
            {loading && !isFELocking() && (
                <Box>
                    <Text>
                        <Spinner type="dots" />
                        正在思考中...
                    </Text>
                </Box>
            )}
            {inChatError && <Text color="red">{JSON.stringify(inChatError)}</Text>}
        </Box>
    );
};

interface ChatInputProps {
    mode: 'agent';
    setMode: (mode: 'agent') => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ mode, setMode }) => {
    const { userInput, setUserInput, sendMessage, setCurrentAgent, client, currentChatId } = useChat();
    const { extraParams } = useExtraParams();
    // 终端环境中不支持图片上传
    // const [imageUrls, setImageUrls] = useState<string[]>([]);

    const handleAgentSelect = (item: { value: string }) => {
        setCurrentAgent(item.value);
        setMode('agent'); // Focus input after selection
    };

    // const handleFileUploaded = (url: string) => {
    //     setImageUrls((prev) => [...prev, url]);
    // };

    const sendTextMessage = () => {
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

    const agentOptions =
        client?.availableAssistants.map((i) => ({
            label: i.name,
            value: i.graph_id,
        })) || [];

    return (
        <Box flexDirection="column" borderStyle="round" padding={1}>
            <Box>
                <Box marginRight={1}>
                    <Text>Agent:</Text>
                </Box>
                {agentOptions.length > 0 && (
                    <SelectInput items={agentOptions} onSelect={handleAgentSelect} isFocused={mode === 'agent'} />
                )}
            </Box>
            <Box>
                <Box marginRight={1}>
                    <Text>Input:</Text>
                </Box>
                <TextInput
                    value={userInput as string}
                    onChange={setUserInput}
                    onSubmit={sendTextMessage}
                    placeholder="输入消息..."
                    focus={mode === 'agent'}
                />
            </Box>
            <Box marginTop={1} justifyContent="space-between">
                <Text color="gray">会话 ID: {currentChatId}</Text>
            </Box>
        </Box>
    );
};

const Chat: React.FC = () => {
    const { toggleHistoryVisible, renderMessages } = useChat();
    const [activeView, setActiveView] = useState<'chat' | 'history' | 'settings' | 'graph' | 'artifacts'>('chat');
    const [mode, setMode] = useState<'command' | 'agent'>('agent');
    const [scrollOffset, setScrollOffset] = useState(0);
    const { height: terminalHeight } = useWindowSize();

    const availableHeight = terminalHeight - 5; // Account for header and input box
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
            if (input === 'i' || input === 'a') setMode('agent');
            else if (input === 'h') {
                toggleHistoryVisible();
                setActiveView('history');
            } else if (input === 's') setActiveView('settings');
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
        setScrollOffset(maxScrollOffset);
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
            </Box>
            <Box borderStyle="round" paddingX={1} justifyContent="space-between">
                <Text>
                    💬 LangGraph Chat {mode === 'command' && <Text color="yellow">(命令模式)</Text>}
                    {mode === 'agent' && <Text color="cyan">(Agent 模式)</Text>}
                </Text>
                <Text>
                    {mode === 'command' ? (
                        <Text>
                            <Text color="cyan">'i/a'</Text>
                            <Text>: Agent | </Text>
                            <Text color="cyan">'h'</Text>
                            <Text>: 历史 | </Text>
                            <Text color="cyan">'s'</Text>
                            <Text>: 设置 | </Text>
                            <Text color="cyan">'ctrl+c'</Text>
                            <Text>: 退出</Text>
                        </Text>
                    ) : (
                        <Text>
                            <Text color="gray">↑/↓: 选择 | </Text>
                            <Text color="cyan">'esc'</Text>
                            <Text color="gray">: 命令模式</Text>
                        </Text>
                    )}
                </Text>
            </Box>
        </Box>
    );
};

const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <ExtraParamsProvider>
                <Chat />
            </ExtraParamsProvider>
        </ChatProvider>
    );
};

const AppProviders: React.FC = () => (
    <SettingsProvider>
        <ChatWrapper />
        {/* <Text>Hello</Text> */}
    </SettingsProvider>
);

export default AppProviders;
