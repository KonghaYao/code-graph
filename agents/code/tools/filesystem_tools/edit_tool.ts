import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

export const edit_tool = tool(
    async ({ file_path, start_line, end_line, new_string }) => {
        try {
            let content = await fs.readFile(file_path, 'utf-8');
            const lines = content.split('\n');

            // 查找开头行的匹配
            const startMatches: number[] = [];
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(start_line)) {
                    // 检查是否是两行匹配的情况
                    if (i + 1 < lines.length && start_line.includes('\n')) {
                        const [firstLine, secondLine] = start_line.split('\n');
                        if (lines[i].includes(firstLine) && lines[i + 1].includes(secondLine)) {
                            startMatches.push(i);
                        }
                    } else {
                        startMatches.push(i);
                    }
                }
            }

            if (startMatches.length === 0) {
                return `Error: start_line not found in ${file_path}`;
            }

            // 查找结尾行的匹配
            const endMatches: number[] = [];
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(end_line)) {
                    endMatches.push(i);
                }
            }

            if (endMatches.length === 0) {
                return `Error: end_line not found in ${file_path}`;
            }

            // 找到有效的开头-结尾配对
            const validRanges: Array<{ start: number; end: number }> = [];
            for (const start of startMatches) {
                for (const end of endMatches) {
                    if (end >= start) {
                        validRanges.push({ start, end });
                        break; // 取第一个有效的结尾
                    }
                }
            }

            if (validRanges.length === 0) {
                return `Error: No valid range found where end_line comes after start_line in ${file_path}`;
            }

            if (validRanges.length > 1) {
                return `Warning: Multiple valid ranges found in ${file_path}. Please make start_line and end_line more specific to avoid ambiguity.`;
            }

            const range = validRanges[0];

            // 替换指定范围的内容
            const beforeLines = lines.slice(0, range.start);
            const afterLines = lines.slice(range.end + 1);
            const newLines = new_string ? new_string.split('\n') : [];

            const newContent = [...beforeLines, ...newLines, ...afterLines].join('\n');

            await fs.writeFile(file_path, newContent, 'utf-8');
            return `File ${file_path} has been edited successfully. Replaced lines ${range.start + 1}-${
                range.end + 1
            } with new content.`;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return `Error: File not found at ${file_path}`;
            }
            throw error;
        }
    },
    {
        name: 'Edit',
        description: `Performs range-based edits in files using start and end line markers.

Usage:
- You must use your \`Read\` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file.
- Specify start_line and end_line to define the range to replace with new_string
- start_line can be one or two lines - if it contains \\n, it will match two consecutive lines
- The tool will find the first occurrence of start_line, then find the first occurrence of end_line after it
- All content between and including the start_line and end_line will be replaced with new_string
- If multiple valid ranges are found, the tool will warn you to be more specific
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.`,
        schema: z.object({
            file_path: z.string().describe('The absolute path to the file to modify'),
            start_line: z
                .string()
                .describe(
                    'The line content to start the replacement range (can be partial match or two lines separated by \\n)',
                ),
            end_line: z.string().describe('The line content to end the replacement range (can be partial match)'),
            new_string: z.string().describe('The new content to insert in place of the range'),
        }),
    },
);
