import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';
import { cleanPath } from '../../utils/cleanPath';
import { readFileSchema } from '../../../../agents/code/tools/filesystem_tools';

export const read_file = createUITool({
    name: 'read_file',
    description: 'Reads a file from the local filesystem',
    parameters: readFileSchema.shape,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired();
        const output = tool.output as string;

        if (!output) return <></>;

        const lines = output.split('\n');
        const totalLines = lines.length;

        return (
            <Box flexDirection="column" paddingX={1}>
                <Box>
                    <Text color="blue">
                        {cleanPath(input.file_path)}

                        <Text color="gray" dimColor>
                            ({totalLines} lines)
                        </Text>
                    </Text>
                </Box>
            </Box>
        );
    },
});
