import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';

interface GlobFilesInput {
    pattern: string;
    path?: string;
}

export const glob_files = createUITool({
    name: 'glob_files',
    description: 'Find files by name patterns',
    parameters: {} as any,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired() as GlobFilesInput;
        const output = tool.output as string;

        if (!output) return null;

        const files = output.split('\n').filter(Boolean);
        const count = files.length;

        return (
            <Box flexDirection="column" paddingX={1}>
                <Text>
                    <Text color="blue">{input.pattern}</Text>
                    <Text color="gray" dimColor>
                        ({count} files)
                    </Text>
                </Text>
            </Box>
        );
    },
});
