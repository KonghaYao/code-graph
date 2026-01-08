import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';
import { cleanPath } from '../../utils/cleanPath';

interface ReadFileInput {
    file_path: string;
    offset?: number;
    limit?: number;
}

export const read_file = createUITool({
    name: 'read_file',
    description: 'Reads a file from the local filesystem',
    parameters: {} as any, // Schema will be injected by the system
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired() as any as ReadFileInput;
        const output = tool.output as string;

        if (!output) return null;

        const lines = output.split('\n');
        const totalLines = lines.length;

        return (
            <Box flexDirection="column" paddingX={1}>
                <Box>
                    <Text color="blue">"{cleanPath(input.file_path)}"</Text>
                    <Text color="gray" dimColor>
                        {' '}
                        ({totalLines} lines)
                    </Text>
                </Box>
            </Box>
        );
    },
});
