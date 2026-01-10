import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';
import { cleanPath } from '../../utils/cleanPath';
import { z } from 'zod';

const writeToolSchema = z.object({
    description: z.string().optional(),
    file_path: z.string(),
    content: z.string(),
});

export const write_file = createUITool({
    name: 'write_file',
    description: 'Writes a file to the local filesystem',
    parameters: writeToolSchema.shape,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired();
        const output = tool.output;

        const lineCount = input.content?.split('\n').length;

        return (
            <Box flexDirection="column" paddingX={1}>
                <Box flexDirection="column">
                    <Text color="white">{cleanPath(input.file_path)}</Text>
                    <Text color="gray"> ({lineCount} lines)</Text>
                </Box>

                {output && output.startsWith('Error:') && (
                    <Box marginTop={0}>
                        <Text color="red">{output}</Text>
                    </Box>
                )}

                {!output && (
                    <Box marginTop={0}>
                        <Text color="gray">Press Enter to confirm, Ctrl+C to cancel</Text>
                    </Box>
                )}
            </Box>
        );
    },
});
