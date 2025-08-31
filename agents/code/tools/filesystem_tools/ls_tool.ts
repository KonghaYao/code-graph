import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs';

// Helper function to get .gitignore patterns
const getGitignorePatterns = (rootPath: string): string[] => {
    const gitignorePath = path.join(rootPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        return [];
    }
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
};

// Helper function to check if a file matches .gitignore patterns
const matchesGitignore = (filePath: string, patterns: string[]): boolean => {
    // A very simplified glob-like matching. Does not handle all gitignore complexities.
    return patterns.some((pattern) => {
        const normalizedPattern = pattern.startsWith('/') ? pattern.substring(1) : pattern;
        // Check for direct file match or directory match
        if (filePath === normalizedPattern || filePath.startsWith(`${normalizedPattern}/`)) {
            return true;
        }
        // Check for wildcard matches (simplified)
        if (normalizedPattern.includes('*')) {
            const regex = new RegExp(`^${normalizedPattern.replace(/\./g, '.').replace(/\*/g, '.*')}$`);
            return regex.test(filePath);
        }
        return false;
    });
};

export const ls_tool = tool(
    async ({ paths, recursive, all, followSymlinks, listDirectories, longFormat, ignoreGitignore }) => {
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
            // For now, we return JSON.stringify directly and don't apply .gitignore filtering for longFormat.
            return JSON.stringify(result, null, 2);
        }

        // For other options, it returns a ShellString which has .code
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }

        let stdout = result.stdout;

        if (ignoreGitignore) {
            const rootPath = process.cwd(); // Assuming current working directory is the repo root
            const gitignorePatterns = getGitignorePatterns(rootPath);

            const files = stdout.split('\n').filter((file) => file.trim() !== '');
            const filteredFiles = files.filter((file) => !matchesGitignore(file, gitignorePatterns));
            stdout = filteredFiles.join('\n');
        }

        return stdout;
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
            ignoreGitignore: z.boolean().optional().default(true).describe('Ignore files specified in .gitignore.'),
        }),
    },
);
