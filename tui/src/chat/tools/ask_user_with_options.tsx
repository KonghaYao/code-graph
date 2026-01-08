import { ask_user_with_options_config } from '@langgraph-js/auk';
import { createUITool, ToolManager } from '@langgraph-js/sdk';
import SelectInput from 'ink-select-input';
import { MultiSelect } from '@inkjs/ui';
import { Box, Text } from 'ink';
import { EnhancedTextInput } from '../components/EnhancedTextInput';
import { useState } from 'react';
export const ask_user_with_options = createUITool({
    name: 'ask_user_with_options',
    description: 'Ask the user for a selection from a list of options',
    parameters: ask_user_with_options_config.schema.shape,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired();
        const options =
            tool.getInputRepaired().options?.map((option, index) => ({
                label: option!.label!,
                value: option!.label!,
            })) || [];
        if (tool.output) {
            return <Text color="yellow">{tool.output}</Text>;
        }
        const [text, setText] = useState('');
        const Hint = (
            <Box paddingX={1}>
                <Text color="gray">Use Blank to Select, Enter to Submit </Text>
            </Box>
        );
        const inputBox = (
            <Box paddingX={1}>
                <EnhancedTextInput value={text} onSubmit={setText}></EnhancedTextInput>
            </Box>
        );

        if (input.type === 'single_select') {
            return (
                <Box flexDirection="column" paddingX={1}>
                    {Hint}
                    <SelectInput
                        items={options}
                        onSelect={(item) => {
                            tool.sendResumeData({
                                type: 'respond',
                                message: `User Selected: ${item.label}`,
                            });
                        }}
                    ></SelectInput>
                    {inputBox}
                </Box>
            );
        } else {
            return (
                <Box flexDirection="column" paddingX={1}>
                    {Hint}
                    <MultiSelect
                        options={options}
                        onSubmit={(items) => {
                            return tool.sendResumeData({
                                type: 'respond',
                                message: `User Selected: ${items.join(', ')}`,
                            });
                        }}
                    ></MultiSelect>
                    {inputBox}
                </Box>
            );
        }
    },
});
