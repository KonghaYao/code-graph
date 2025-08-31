import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

const editSchema = z.object({
    old_string: z.string().describe('The text to replace'),
    new_string: z.string().describe('The text to replace it with'),
    replace_all: z
        .boolean()
        .optional()
        .default(false)
        .describe('Replace all occurences of old_string (default false).'),
});

export const multi_edit_tool = tool(
    async ({ file_path, edits }) => {
        try {
            let content = await fs.readFile(file_path, 'utf-8');
            for (const edit of edits) {
                const { old_string, new_string, replace_all } = edit;
                const occurrences = (content.match(new RegExp(old_string, 'g')) || []).length;

                if (occurrences === 0) {
                    return `Error: old_string "${old_string}" not found in the current state of the file.`;
                }

                if (!replace_all && occurrences > 1) {
                    return `Error: old_string "${old_string}" is not unique. Use replace_all.`;
                }

                if (replace_all) {
                    content = content.replace(new RegExp(old_string, 'g'), new_string);
                } else {
                    content = content.replace(old_string, new_string);
                }
            }
            await fs.writeFile(file_path, content, 'utf-8');
            return `File ${file_path} has been edited successfully with ${edits.length} edits.`;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return `Error: File not found at ${file_path}`;
            }
            throw error;
        }
    },
    {
        name: 'MultiEdit',
        description:
            "This is a tool for making multiple edits to a single file in one operation. It is built on top of the Edit tool and allows you to perform multiple find-and-replace operations efficiently. Prefer this tool over the Edit tool when you need to make multiple edits to the same file.\n\nBefore using this tool:\n\n1. Use the Read tool to understand the file's contents and context\n2. Verify the directory path is correct\n\nTo make multiple file edits, provide the following:\n1. file_path: The absolute path to the file to modify (must be absolute, not relative)\n2. edits: An array of edit operations to perform, where each edit contains:\n   - old_string: The text to replace (must match the file contents exactly, including all whitespace and indentation)\n   - new_string: The edited text to replace the old_string\n   - replace_all: Replace all occurences of old_string. This parameter is optional and defaults to false.\n\nIMPORTANT:\n- All edits are applied in sequence, in the order they are provided\n- Each edit operates on the result of the previous edit\n- All edits must be valid for the operation to succeed - if any edit fails, none will be applied\n- This tool is ideal when you need to make several changes to different parts of the same file\n- For Jupyter notebooks (.ipynb files), use the NotebookEdit instead\n\nCRITICAL REQUIREMENTS:\n1. All edits follow the same requirements as the single Edit tool\n2. The edits are atomic - either all succeed or none are applied\n3. Plan your edits carefully to avoid conflicts between sequential operations\n\nWARNING:\n- The tool will fail if edits.old_string doesn't match the file contents exactly (including whitespace)\n- The tool will fail if edits.old_string and edits.new_string are the same\n- Since edits are applied in sequence, ensure that earlier edits don't affect the text that later edits are trying to find\n\nWhen making edits:\n- Ensure all edits result in idiomatic, correct code\n- Do not leave the code in a broken state\n- Always use absolute file paths (starting with /)\n- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.\n- Use replace_all for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.\n\nIf you want to create a new file, use:\n- A new file path, including dir name if needed\n- First edit: empty old_string and the new file's contents as new_string\n- Subsequent edits: normal edit operations on the created content",
        schema: z.object({
            file_path: z.string().describe('The absolute path to the file to modify'),
            edits: z.array(editSchema).min(1).describe('Array of edit operations to perform sequentially on the file'),
        }),
    },
);
