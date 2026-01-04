import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';
import { generateOptimizedDiff, isLargeText } from './diffUtils';
import { editToolSchema } from '../../../../agents/code/tools/filesystem_tools';

interface ReplaceInFileInput {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
}

export const replace_in_file = createUITool({
    name: 'replace_in_file',
    description: 'Performs exact string replacements in files with diff visualization',
    parameters: editToolSchema.shape,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired() as ReplaceInFileInput;
        const output = tool.output;

        // 检查是否有 diff 需要显示
        const hasDiff = input.old_string && input.new_string && input.old_string !== input.new_string;

        // 检查文本大小并生成优化的 diff
        const isLarge = isLargeText(input.old_string) || isLargeText(input.new_string);
        const diffLines = hasDiff ? generateOptimizedDiff(input.new_string, input.old_string) : [];

        // 计算统计信息（基于完整 diff）
        let removedCount = 0;
        let addedCount = 0;
        let totalLines = 0;
        if (hasDiff) {
            // 重新生成完整 diff 用于统计（不带截断）
            const fullDiff = generateOptimizedDiff(input.new_string, input.old_string, { maxLines: undefined });
            for (const line of fullDiff) {
                totalLines++;
                if (line.type === 'removed') removedCount++;
                if (line.type === 'added') addedCount++;
            }
        }

        // 渲染 diff 视图
        const renderDiff = () => {
            if (!hasDiff) {
                return (
                    <Box flexDirection="column" padding={1}>
                        <Text color="gray">No changes detected (old_string equals new_string)</Text>
                    </Box>
                );
            }

            // 检查是否需要显示省略信息
            const hasOmitted = diffLines.some((line) => line.content.includes('...'));

            return (
                <Box flexDirection="column" borderStyle="round" borderColor="cyan">
                    <Box>
                        <Text color="red" bold>
                            -{removedCount}
                        </Text>
                        <Text color="gray"> lines removed, </Text>
                        <Text color="green" bold>
                            +{addedCount}
                        </Text>
                        <Text color="gray"> lines added</Text>
                        {hasOmitted && (
                            <>
                                <Text color="gray">
                                    {' '}
                                    (showing {diffLines.length} of {totalLines} lines)
                                </Text>
                            </>
                        )}
                        {isLarge && (
                            <>
                                <Text color="yellow"> ⚡ Large diff optimized</Text>
                            </>
                        )}
                    </Box>
                    <Box flexDirection="column" marginTop={1}>
                        {diffLines.map((line, idx) => {
                            const key = `${idx}-${line.content.substring(0, 10)}`;

                            // 格式化行号显示
                            const lineNumInfo = line.lineNumbers;
                            let linePrefix = '';

                            if (line.type === 'removed' && lineNumInfo?.old) {
                                linePrefix = `-${lineNumInfo.old}:`;
                            } else if (line.type === 'added' && lineNumInfo?.new) {
                                linePrefix = `+${lineNumInfo.new}:`;
                            } else if (line.type === 'unchanged' && lineNumInfo?.old && lineNumInfo?.new) {
                                linePrefix = ` ${lineNumInfo.old}:`;
                            } else if (line.content.includes('...')) {
                                linePrefix = '...';
                            }

                            if (line.type === 'removed') {
                                return (
                                    <Text key={key} color="red">
                                        {linePrefix} {line.content}
                                    </Text>
                                );
                            } else if (line.type === 'added') {
                                return (
                                    <Text key={key} color="green">
                                        {linePrefix} {line.content}
                                    </Text>
                                );
                            } else {
                                return (
                                    <Text key={key} color="gray">
                                        {linePrefix} {line.content}
                                    </Text>
                                );
                            }
                        })}
                    </Box>
                </Box>
            );
        };

        // 渲染输入参数预览
        const renderInput = () => {
            return (
                <Box flexDirection="column" padding={1}>
                    <Text color="blue" bold>
                        File:
                    </Text>
                    <Text color="white"> {input.file_path}</Text>

                    {input.replace_all && (
                        <Box marginTop={1}>
                            <Text color="yellow">⚠️ Replace ALL occurrences</Text>
                        </Box>
                    )}
                </Box>
            );
        };

        // 渲染输出结果
        const renderOutput = () => {
            if (!output) return null;
            const isError = output.startsWith('Error:');
            return isError ? (
                <Box flexDirection="column" borderStyle="round" borderColor="red">
                    <Text color="red">{output}</Text>
                </Box>
            ) : null;
        };

        return (
            <Box flexDirection="column">
                {renderInput()}
                {hasDiff && renderDiff()}
                {renderOutput()}

                {/* Action hint when waiting for user input */}
                {!output && (
                    <Box marginTop={1} padding={1} borderStyle="single" borderColor="yellow">
                        <Text color="yellow">Press </Text>
                        <Text bold>Enter</Text>
                        <Text color="yellow"> to confirm, or </Text>
                        <Text bold>Ctrl+C</Text>
                        <Text color="yellow"> to cancel</Text>
                    </Box>
                )}
            </Box>
        );
    },
});
