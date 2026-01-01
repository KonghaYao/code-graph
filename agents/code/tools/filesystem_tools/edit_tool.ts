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
                if (start_line.includes('\n')) {
                    const startLines = start_line.split('\n');
                    if (i + startLines.length <= lines.length) {
                        let isMatch = true;
                        for (let j = 0; j < startLines.length; j++) {
                            if (!lines[i + j].includes(startLines[j])) {
                                isMatch = false;
                                break;
                            }
                        }
                        if (isMatch) {
                            startMatches.push(i);
                        }
                    }
                } else {
                    if (lines[i].includes(start_line)) {
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
                return `Warning: Multiple valid ranges found in ${file_path} (Lines: ${validRanges
                    .map((r) => `${r.start + 1}-${r.end + 1}`)
                    .join(', ')}). Please make start_line and end_line more specific to avoid ambiguity.`;
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
        name: 'edit_file',
        description: `Performs range-based edits in files using start and end line markers.

Usage:
- You must use your \`read_file\` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file.
- start_line and end_line are REQUIRED - both must be provided to define the range to replace
- Specify start_line and end_line to define the range to replace with new_string
- start_line can be one or two lines - if it contains \\n, it will match two consecutive lines
- The tool will find the first occurrence of start_line, then find the first occurrence of end_line after it
- All content between and including the start_line and end_line will be replaced with new_string
- Note: The end_line itself is also deleted. The tool finds the line containing end_line and removes everything from start_line through end_line (inclusive)
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.

Examples:
1. Replace a single line:
   - start_line: "const foo = 'bar';"
   - end_line: "const foo = 'bar';"
   - new_string: "const foo = 'baz';"

2. Replace multiple lines:
   - start_line: "function example() {"
   - end_line: "}"
   - new_string: "function example() {\\n  return 'updated';\\n}"

3. Replace with exact whitespace matching:
   - start_line: "    const value = 1;"  // Must match 4 spaces
   - end_line: "    const value = 1;"
   - new_string: "    const value = 2;"

4. Replace a multi-line block:
   - start_line: "import {\\n  tool"
   - end_line: "from '@langchain/core/tools';"
   - new_string: "import { tool } from '@langchain/core/tools';"

Common Pitfalls:
- Exact matching: If your edit fails with "end_line not found", the content may have extra spaces, tabs, or different line endings
- Multiple occurrences: If start_line appears multiple times, you may get unexpected matches
- Template strings: Be careful with backticks and newlines in template literals
- Recommendation: After reading the file, copy the EXACT text including whitespace for start_line and end_line

Key Lessons from Edit Tool Failures:
- Failure reason: String matching is not precise, including differences in line breaks, spaces, and indentation
- Multi-line matching complexity: When start_line contains \n, it must match consecutive lines exactly; any difference will fail
- Success strategy: Use single-line exact matching, copy the exact content from the original file (including indentation)`,
        schema: z.object({
            file_path: z.string().describe('The absolute path to the file to modify'),
            start_line: z
                .string()
                .describe(
                    'REQUIRED: The line content to start the replacement range (uses includes() for matching, but must match exactly including whitespace)',
                ),
            end_line: z
                .string()
                .describe(
                    'REQUIRED: The line content to end the replacement range (uses includes() for matching, but must match exactly including whitespace). Note: This line is also deleted - the replacement includes from start_line through end_line inclusive)',
                ),
            new_string: z.string().describe('The new content to insert in place of the range'),
        }),
    },
);
