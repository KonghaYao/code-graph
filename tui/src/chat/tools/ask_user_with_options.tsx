import { ask_user_with_options_config } from '@langgraph-js/auk';
import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text, useFocusManager } from 'ink';
import { useEffect, useState } from 'react';
import { EnhancedTextInput } from '../components/input/EnhancedTextInput';
import { MultiSelectPro } from '../components/input/MulitSelect';

export const ask_user_with_options = createUITool({
    name: 'ask_user_with_options',
    description: 'Ask the user for a selection from a list of options',
    parameters: ask_user_with_options_config.schema.shape,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired();
        const options =
            input.options?.map((option: any) => ({
                label: option!.label!,
                value: option!.label!,
            })) || [];

        if (tool.output) {
            return <Text color="yellow">{tool.output}</Text>;
        }
        const isActive = tool.state === 'interrupted';
        const fm = useFocusManager();
        useEffect(() => {
            isActive && fm.focusNext();
        }, [isActive]);
        const [text, setText] = useState('');
        const [selected, setSelected] = useState<string[]>([]);

        const handleSubmit = () => {
            let value = '';
            if (selected) {
                value += `User selected: ` + selected.join(', ');
            }
            if (value.trim()) {
                value += '\nUser Custom Input: ' + text;
            }
            tool.sendResumeData({
                type: 'respond',
                message: value,
            });
        };

        return (
            <Box flexDirection="column">
                <MultiSelectPro
                    disabled={!isActive}
                    options={options}
                    singleSelect={input.type === 'single_select'}
                    onChange={setSelected}
                    onSubmit={handleSubmit}
                    autoFocus={true}
                />

                {input.allow_custom_input && (
                    <Box marginTop={1} flexDirection="column">
                        <EnhancedTextInput
                            disabled={!isActive}
                            value={text}
                            onChange={setText}
                            onSubmit={handleSubmit}
                            placeholder="Type custom option here..."
                            autoFocus={false}
                        />
                    </Box>
                )}
            </Box>
        );
    },
});
