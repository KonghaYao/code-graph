import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { glob } from 'glob';

export const glob_tool = tool(
    async ({ pattern, path }) => {
        const files = await glob(pattern, {
            ignore: ['node_modules', '.git'],
            cwd: path,
            absolute: true,
        });
        return files.join('\n');
    },
    {
        name: 'Glob',
        description: `- Fast file pattern matching tool that works with any codebase size
- Supports glob patterns like "**/*.js" or "src/**/*.ts"
- Returns matching file paths sorted by modification time
- Use this tool when you need to find files by name patterns
- When you are doing an open ended search that may require multiple rounds of globbing and grepping, use the Agent tool instead
- You have the capability to call multiple tools in a single response. It is always better to speculatively perform multiple searches as a batch that are potentially useful.`,
        schema: z.object({
            pattern: z.string().describe('The glob pattern to match files against'),
            path: z
                .string()
                .optional()
                .describe(
                    'The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.',
                ),
        }),
    },
);
