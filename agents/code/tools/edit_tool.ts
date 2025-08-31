import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

export const edit_tool = tool(
    async ({ file_path, old_string, new_string, replace_all }) => {
        try {
            let content = await fs.readFile(file_path, 'utf-8');
            const occurrences = (content.match(new RegExp(old_string, 'g')) || []).length;

            if (occurrences === 0) {
                return `Error: old_string not found in ${file_path}`;
            }

            if (!replace_all && occurrences > 1) {
                return `Error: old_string is not unique in ${file_path}. Use replace_all to replace all occurrences.`;
            }

            if (replace_all) {
                content = content.replace(new RegExp(old_string, 'g'), new_string);
            } else {
                content = content.replace(old_string, new_string);
            }

            await fs.writeFile(file_path, content, 'utf-8');
            return `File ${file_path} has been edited successfully.`;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return `Error: File not found at ${file_path}`;
            }
            throw error;
        }
    },
    {
        name: 'Edit',
        description:
            'Performs exact string replacements in files. \n\nUsage:\n- You must use your `Read` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file. \n- When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix. The line number prefix format is: spaces + line number + tab. Everything after that tab is the actual file content to match. Never include any part of the line number prefix in the old_string or new_string.\n- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.\n- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.\n- The edit will FAIL if `old_string` is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use `replace_all` to change every instance of `old_string`. \n- Use `replace_all` for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.',
        schema: z.object({
            file_path: z.string().describe('The absolute path to the file to modify'),
            old_string: z.string().describe('The text to replace'),
            new_string: z.string().describe('The text to replace it with (must be different from old_string)'),
            replace_all: z
                .boolean()
                .optional()
                .default(false)
                .describe('Replace all occurences of old_string (default false)'),
        }),
    },
);
