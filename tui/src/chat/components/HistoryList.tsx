import React, { useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { useChat } from '@langgraph-js/sdk/react';
import { formatTime } from '@langgraph-js/sdk';
import type { Thread } from '@langgraph-js/sdk';
interface HistoryListProps {
    onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose }) => {
    const { historyList, currentChatId, refreshHistoryList, toHistoryChat, createNewChat } = useChat();

    useEffect(() => {
        refreshHistoryList();
    }, [refreshHistoryList]);

    useInput((input, key) => {
        if (input === 'r') {
            refreshHistoryList();
        }
        if (key.escape || input === 'q') {
            onClose();
        }
    });

    // Helper function to get status emoji and color
    const getStatusInfo = (status: Thread['status']) => {
        switch (status) {
            case 'idle':
                return { emoji: '🟢', color: 'green' as const, text: '空闲' };
            case 'busy':
                return { emoji: '🟡', color: 'yellow' as const, text: '忙碌' };
            case 'interrupted':
                return { emoji: '🟠', color: 'orange' as const, text: '中断' };
            case 'error':
                return { emoji: '🔴', color: 'red' as const, text: '错误' };
            default:
                return { emoji: '⚪', color: 'gray' as const, text: status };
        }
    };

    const items = useMemo(
        () => [
            ...historyList
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((thread) => {
                    const statusInfo = getStatusInfo(thread.status);
                    const isCurrent = thread.thread_id === currentChatId;
                    const prefix = isCurrent ? '➡️' : '  ';
                    const updatedTime = formatTime(new Date(thread.updated_at));

                    // Build a rich label with multiple information
                    const label = `${prefix} [${statusInfo.emoji}] ${thread.thread_id.substring(
                        0,
                        8,
                    )}... | 更新于 ${updatedTime}`;

                    return {
                        label,
                        value: thread.thread_id,
                        key: thread.thread_id,
                        thread: thread,
                    };
                }),
            {
                label: '➕ 创建新对话',
                value: 'new_chat',
            },
        ],
        [historyList, currentChatId],
    );

    const handleSelect = (item: any) => {
        console.clear();
        if (item.value === 'new_chat') {
            createNewChat();
        } else {
            toHistoryChat(item.thread);
        }
        onClose();
    };

    return (
        <Box flexDirection="column" paddingX={1} paddingY={0} flexGrow={1}>
            <Box paddingBottom={0} justifyContent="space-between">
                <Text color="yellow" bold>
                    📜 历史记录 ({historyList.length})
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
            {/* Status legend */}
            <Box paddingLeft={1} marginTop={1}>
                <Text>状态: 🟢空闲 🟡忙碌 🟠中断 🔴错误</Text>
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
