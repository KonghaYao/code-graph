import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { rgPath } from '@vscode/ripgrep';
import shell from 'shelljs';

// Helper to escape strings for shell command to prevent injection and misinterpretation
const shellEscape = (str: string) => `'${str.replace(/'/g, "'\\''")}'`;

export const grep_tool = tool(
    async ({
        pattern,
        path,
        glob,
        output_mode,
        '-B': B,
        '-A': A,
        '-C': C,
        '-n': n,
        '-i': i,
        type,
        head_limit,
        multiline,
    }) => {
        // 性能优化：验证和限制危险的查询模式
        if (pattern.length < 2) {
            return `Error: Pattern too short (${pattern.length} characters). Use patterns with at least 2 characters to avoid performance issues.`;
        }

        // 检测可能导致性能问题的模式
        const dangerousPatterns = [
            /^\.+\*?$/, // 只有点和星号的模式如 ".*", "...", ".*..*"
            /^\.\*$/, // 纯 ".*" 模式
            /^.*\*.*\*.*$/, // 多个星号的复杂模式
            /^\[\^.*\]\*$/, // 复杂的字符类否定
        ];

        if (dangerousPatterns.some((dp) => dp.test(pattern))) {
            return `Error: Pattern "${pattern}" may cause performance issues. Please use a more specific pattern.`;
        }

        // 对于没有文件类型或路径限制的广泛搜索，强制添加默认限制
        if (!type && !glob && !path && !head_limit) {
            head_limit = 500; // 默认限制为500行结果，提高响应速度
        }

        const commandParts: string[] = [rgPath];

        // 添加性能优化参数（必须在模式之前）
        commandParts.push('--max-count', '1000'); // 限制每个文件的最大匹配数，减少到1000

        if (B) commandParts.push('-B', B.toString());
        if (A) commandParts.push('-A', A.toString());
        if (C) commandParts.push('-C', C.toString());
        if (n) commandParts.push('--line-number');
        if (i) commandParts.push('--ignore-case');
        if (multiline) commandParts.push('--multiline', '--multiline-dotall');

        // 设置默认输出模式为 content（更有用）
        const actualOutputMode = output_mode || 'content';
        if (actualOutputMode === 'files_with_matches') {
            commandParts.push('--files-with-matches');
        } else if (actualOutputMode === 'count') {
            commandParts.push('--count');
        }

        if (type) commandParts.push('--type', type);
        if (glob) commandParts.push('--glob', shellEscape(glob));

        commandParts.push('--');
        commandParts.push(shellEscape(pattern));

        if (path) {
            commandParts.push(shellEscape(path));
        }

        let command = commandParts.join(' ');

        if (head_limit) {
            command += ` | head -n ${head_limit}`;
        }

        // 添加超时控制，并确保在正确的工作目录执行
        const result = shell.exec(command, {
            silent: true,
            timeout: 15000, // 15秒超时，提高响应速度
            cwd: process.cwd(), // 确保使用当前工作目录
        });

        if (result.code !== 0 && result.stderr) {
            // rg exits with code 1 if no matches are found, which is not an error if stdout is empty.
            if (result.code === 1 && result.stdout === '') {
                return 'No matches found.';
            }
            // 检查是否是超时错误
            if (result.stderr.includes('timeout') || result.stderr.includes('killed')) {
                return `Error: Search timed out after 15 seconds. Please use a more specific pattern or limit the search scope with type/glob/path parameters.`;
            }
            return `Error executing ripgrep: ${result.stderr}`;
        }

        return result.stdout || 'No matches found.';
    },
    {
        name: 'Grep',
        description: `A powerful search tool for finding text patterns within file contents using ripgrep

⚠️ IMPORTANT USAGE GUIDELINES:
- Use this tool ONLY for searching TEXT PATTERNS within file contents
- For reading entire files or specific files, use the Read tool instead
- For finding files by name/path patterns, use the Glob tool instead
- This tool is optimized for content search, not file browsing

Usage:
- Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")  
- Filter files with glob parameter (e.g., "src/*.js", "src/**/*.tsx") or type parameter (e.g., "js", "py", "rust")
- Output modes: "content" shows matching lines, "files_with_matches" shows only file paths, "count" shows match counts
- Pattern syntax: Uses ripgrep (not grep) - literal braces need escaping (use \`interface\\{\\}\` to find \`interface{}\` in Go code)
- Multiline matching: By default patterns match within single lines only. For cross-line patterns like \`struct \\{[\\s\\S]*?field\`, use \`multiline: true\`

Performance Guidelines:
- Patterns must be at least 2 characters long to avoid performance issues
- Avoid overly broad patterns like ".*" or complex multi-wildcard patterns  
- For large searches without type/glob/path restrictions, results are automatically limited to 500 lines
- Searches timeout after 15 seconds - use more specific patterns if this occurs
- Each file is limited to 1000 matches maximum
`,
        schema: z.object({
            pattern: z.string().describe('The regular expression pattern to search for in file contents'),
            path: z
                .string()
                .optional()
                .describe('File or directory to search in (rg PATH). Defaults to current working directory.'),
            glob: z
                .string()
                .optional()
                .describe('Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob'),
            output_mode: z
                .enum(['content', 'files_with_matches', 'count'])
                .optional()
                .describe(
                    'Output mode: "content" shows matching lines (supports -A/-B/-C context, -n line numbers, head_limit), "files_with_matches" shows file paths (supports head_limit), "count" shows match counts (supports head_limit). Defaults to "content".',
                ),
            '-B': z
                .number()
                .optional()
                .describe(
                    'Number of lines to show before each match (rg -B). Requires output_mode: "content", ignored otherwise.',
                ),
            '-A': z
                .number()
                .optional()
                .describe(
                    'Number of lines to show after each match (rg -A). Requires output_mode: "content", ignored otherwise.',
                ),
            '-C': z
                .number()
                .optional()
                .describe(
                    'Number of lines to show before and after each match (rg -C). Requires output_mode: "content", ignored otherwise.',
                ),
            '-n': z
                .boolean()
                .optional()
                .describe('Show line numbers in output (rg -n). Requires output_mode: "content", ignored otherwise.'),
            '-i': z.boolean().optional().describe('Case insensitive search (rg -i)'),
            type: z
                .string()
                .optional()
                .describe(
                    'File type to search (rg --type). Common types: js, py, rust, go, java, etc. More efficient than include for standard file types.',
                ),
            head_limit: z
                .number()
                .optional()
                .describe(
                    'Limit output to first N lines/entries, equivalent to "| head -N". Works across all output modes: content (limits output lines), files_with_matches (limits file paths), count (limits count entries). When unspecified, shows all results from ripgrep.',
                ),
            multiline: z
                .boolean()
                .optional()
                .describe(
                    'Enable multiline mode where . matches newlines and patterns can span lines (rg -U --multiline-dotall). Default: false.',
                ),
        }),
    },
);
