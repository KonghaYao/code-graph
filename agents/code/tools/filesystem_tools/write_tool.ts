import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

export const write_tool = tool(
    async ({ file_path, content }) => {
        try {
            await fs.writeFile(file_path, content, 'utf-8');
            return `File ${file_path} has been written successfully.`;
        } catch (error: any) {
            return `Error writing file: ${error.message}`;
        }
    },
    {
        name: 'Write',
        description:
            "Writes a file to the local filesystem.\n\nUsage:\n- This tool will overwrite the existing file if there is one at the provided path.\n- If this is an existing file, you MUST use the Read tool first to read the file's contents. This tool will fail if you did not read the file first.\n- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.\n- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.\n- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked.",
        schema: z.object({
            file_path: z.string().describe('The absolute path to the file to write (must be absolute, not relative)'),
            content: z.string().describe('The content to write to the file'),
        }),
    },
);
