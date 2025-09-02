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
        const commandParts: string[] = [rgPath];

        if (B) commandParts.push('-B', B.toString());
        if (A) commandParts.push('-A', A.toString());
        if (C) commandParts.push('-C', C.toString());
        if (n) commandParts.push('--line-number');
        if (i) commandParts.push('--ignore-case');
        if (multiline) commandParts.push('--multiline');

        if (output_mode === 'files_with_matches') {
            commandParts.push('--files-with-matches');
        } else if (output_mode === 'count') {
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

        const result = shell.exec(command, { silent: true });

        if (result.code !== 0 && result.stderr) {
            // rg exits with code 1 if no matches are found, which is not an error if stdout is empty.
            if (result.code === 1 && result.stdout === '') {
                return 'No matches found.';
            }
            return `Error executing ripgrep: ${result.stderr}`;
        }

        return result.stdout || 'No matches found.';
    },
    {
        name: 'Grep',
        description: `A powerful search tool built on ripgrep

  Usage:
  - ALWAYS use Grep for search tasks. NEVER invoke \`grep\` or \`rg\` as a Bash command. The Grep tool has been optimized for correct permissions and access.
  - Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")
  - Filter files with glob parameter (e.g., "*.js", "**/*.tsx") or type parameter (e.g., "js", "py", "rust")
  - Output modes: "content" shows matching lines, "files_with_matches" shows only file paths (default), "count" shows match counts
  - Use Task tool for open-ended searches requiring multiple rounds
  - Pattern syntax: Uses ripgrep (not grep) - literal braces need escaping (use \`interface\\{\\}\` to find \`interface{}\` in Go code)
  - Multiline matching: By default patterns match within single lines only. For cross-line patterns like \`struct \\{[\\s\\S]*?field\`, use \`multiline: true\`
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
                    'Output mode: "content" shows matching lines (supports -A/-B/-C context, -n line numbers, head_limit), "files_with_matches" shows file paths (supports head_limit), "count" shows match counts (supports head_limit). Defaults to "files_with_matches".',
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
