import React, { useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { useChat } from '../context/ChatContext';
import { getHistoryContent } from '@langgraph-js/sdk';
import { formatTime } from '@langgraph-js/sdk';
interface HistoryListProps {
    onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose }) => {
    const { toggleGraphVisible, historyList, currentChatId, refreshHistoryList, toHistoryChat } = useChat();

    useEffect(() => {
        refreshHistoryList();
    }, [refreshHistoryList]);

    useInput((input, key) => {
        if (input === 'r') {
            refreshHistoryList();
        }
        if (key.escape || input === 'q') {
            onClose();
            toggleGraphVisible();
        }
    });

    const items = useMemo(
        () => [
            {
                label: '➕ 创建新对话',
                value: 'new_chat',
            },
            ...historyList
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((thread) => ({
                    label:
                        `${thread.thread_id === currentChatId ? '➡️' : ' '} ${
                            getHistoryContent(thread) || '...'
                        }`.substring(0, 50) + ` (${formatTime(new Date(thread.created_at))})`,
                    value: thread.thread_id,
                    key: thread.thread_id,
                    thread: thread,
                })),
        ],
        [historyList],
    );

    const handleSelect = (item: any) => {
        if (item.value === 'new_chat') {
            // createNewChat();
        } else {
            toHistoryChat(item.thread);
        }
        onClose();
    };

    // Note: Deleting is a destructive action. In a TUI, it might be better to
    // handle this with a confirmation step, maybe triggered by a different key.
    // For now, delete functionality is omitted from this SelectInput-based UI.

    return (
        <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1} paddingY={0} flexGrow={1}>
            <Box paddingBottom={0} justifyContent="space-between">
                <Text color="yellow" bold>
                    📜 历史记录
                </Text>
                <Text color="gray">
                    <Text color="cyan" bold>
                        r
                    </Text>
                    :刷新{' '}
                    <Text color="cyan" bold>
                        q
                    </Text>
                    :关闭
                </Text>
            </Box>
            {historyList.length === 0 ? (
                <Box paddingLeft={1} marginTop={1}>
                    <Text color="gray">❌ 暂无历史记录</Text>
                </Box>
            ) : (
                <Box marginTop={1}>
                    <SelectInput items={items} onSelect={handleSelect} />
                </Box>
            )}
        </Box>
    );
};

export default HistoryList;
