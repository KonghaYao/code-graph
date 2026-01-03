import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import { InputPreviewer } from '../components/MessageTool';

// Color scheme for terminal actions
const ACTION_COLORS: { [key: string]: string } = {
    approve: 'green',
    reject: 'red',
    edit: 'yellow',
    modify: 'cyan',
    interrupt: 'magenta',
    retry: 'blue',
};

const getActionColor = (action: string): string => {
    return ACTION_COLORS[action.toLowerCase()] || 'white';
};

export const terminal = createUITool({
    name: 'terminal',
    description: '',
    parameters: {},
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const interrupt = tool.getHumanInTheLoopData();
        const [selectState, setSelectState] = useState('approve');
        const [isEditing, setEditing] = useState(false);
        const [editValue, setEditValue] = useState('');

        const actionButtons = () => {
            if (!interrupt?.reviewConfig) return null;
            const buttons = interrupt.reviewConfig.allowedDecisions.map((i) => {
                return {
                    label: i,
                    value: i,
                };
            });

            return (
                <Box flexDirection="column">
                    <Text color="cyan" bold>
                        ⚡ Terminal Action Required
                    </Text>
                    <Box>
                        <SelectInput
                            items={buttons}
                            onSelect={(item) => {
                                if (item.value === 'approve') {
                                    tool.sendResumeData({
                                        type: item.value,
                                    });
                                    return;
                                }
                                setSelectState(item.value);
                                setEditing(true);
                                if (item.value === 'edit') {
                                    setEditValue(JSON.stringify(tool.getInputRepaired(), null, 2));
                                } else {
                                    setEditValue('');
                                }
                            }}
                        />
                    </Box>
                </Box>
            );
        };

        const handleEditSubmit = () => {
            if (editValue.trim()) {
                if (selectState === 'edit') {
                    tool.sendResumeData({
                        type: selectState as any,
                        edited_action: {
                            name: tool.message.name!,
                            args: JSON.parse(editValue),
                        },
                    });
                    setEditing(false);
                    setEditValue('');
                } else {
                    tool.sendResumeData({
                        type: selectState as any,
                        message: 'User Reject to run this tool, reason: ' + editValue,
                    });
                    setEditing(false);
                    setEditValue('');
                }
            }
        };

        const renderEditUI = () => {
            const actionColor = getActionColor(selectState);
            const isEditMode = selectState === 'edit';

            return (
                <Box flexDirection="column" padding={1} borderStyle="round" borderColor={actionColor}>
                    <Box>
                        <Text color={actionColor} bold>
                            ⚙️ {selectState.toUpperCase()} MODE
                        </Text>
                        <Text color="gray"> - Press Enter to submit, Ctrl+C to cancel</Text>
                    </Box>

                    {isEditMode ? (
                        <Box flexDirection="column" marginTop={1}>
                            <Text color="yellow" dimColor>
                                Editing action arguments (JSON format):
                            </Text>
                            <Box borderStyle="single" borderColor="yellow" paddingX={1}>
                                <TextInput
                                    value={editValue}
                                    onChange={setEditValue}
                                    onSubmit={handleEditSubmit}
                                    placeholder="Enter JSON..."
                                />
                            </Box>
                        </Box>
                    ) : (
                        <Box flexDirection="column" marginTop={1}>
                            <Text color="cyan" dimColor>
                                Enter additional message for this action:
                            </Text>
                            <Box borderStyle="single" borderColor="cyan" paddingX={1}>
                                <TextInput
                                    value={editValue}
                                    onChange={setEditValue}
                                    onSubmit={handleEditSubmit}
                                    placeholder="Enter message..."
                                />
                            </Box>
                        </Box>
                    )}

                    <Box marginTop={1}>
                        <Text color="gray">
                            <Text color={actionColor} bold>
                                ↵
                            </Text>{' '}
                            Submit |
                            <Text color="red" bold>
                                {' '}
                                Ctrl+C
                            </Text>{' '}
                            Cancel
                        </Text>
                    </Box>
                </Box>
            );
        };

        const renderOutput = () => {
            if (!tool.output) return null;

            return (
                <Box flexDirection="column">
                    <Box borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1}>
                        <Text>{tool.output}</Text>
                    </Box>
                </Box>
            );
        };

        return (
            <Box flexDirection="column">
                <InputPreviewer content={tool.getInputRepaired()}></InputPreviewer>
                {/* Main Content */}
                {isEditing ? renderEditUI() : actionButtons()}
                {/* Output */}
                {renderOutput()}
            </Box>
        );
    },
});
