import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import shell from 'shelljs';

export const ls_tool = tool(
    async ({ paths, recursive, all, followSymlinks, listDirectories, longFormat }) => {
        let options = '';
        if (recursive) options += 'R';
        if (all) options += 'A';
        if (followSymlinks) options += 'L';
        if (listDirectories) options += 'd';
        if (longFormat) options += 'l';

        const result = shell.ls(options ? `-${options}` : '', paths);

        if (longFormat) {
            // When -l is used, shell.ls returns an array of objects, not a ShellString.
            // It doesn't have a .code property for simple error checking.
            return JSON.stringify(result, null, 2);
        }

        // For other options, it returns a ShellString which has .code
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }
        return result.stdout;
    },
    {
        name: 'LS',
        description: `Lists files and directories in given paths. Available options:
-R: recursive
-A: all files (include files beginning with ., except for . and ..)
-L: follow symlinks
-d: list directories themselves, not their contents
-l: list objects representing each file, each with fields containing ls -l output fields.`,
        schema: z.object({
            paths: z.array(z.string()).describe('Paths to search.'),
            recursive: z.boolean().optional().describe('Recursive (option -R).'),
            all: z.boolean().optional().describe('All files, including hidden (option -A).'),
            followSymlinks: z.boolean().optional().describe('Follow symlinks (option -L).'),
            listDirectories: z
                .boolean()
                .optional()
                .describe('List directories themselves, not their contents (option -d).'),
            longFormat: z.boolean().optional().describe('Return list of objects with file details (option -l).'),
        }),
    },
);
