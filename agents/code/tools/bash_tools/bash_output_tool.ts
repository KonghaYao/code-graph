import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { background_processes } from './bash_manager.js';

export const bash_output_tool = tool(
    async ({ bash_id, filter }) => {
        const pid = parseInt(bash_id, 10);
        const managed_process = background_processes.get(pid);

        if (!managed_process) {
            return `Error: No background process found with ID ${bash_id}.`;
        }

        let stdout = managed_process.stdout.join('');
        let stderr = managed_process.stderr.join('');

        // Clear the buffers after reading
        managed_process.stdout = [];
        managed_process.stderr = [];

        if (filter) {
            const regex = new RegExp(filter);
            stdout = stdout
                .split('\n')
                .filter((line) => regex.test(line))
                .join('\n');
            stderr = stderr
                .split('\n')
                .filter((line) => regex.test(line))
                .join('\n');
        }

        let output = '';
        if (stdout) {
            output += `STDOUT:\n${stdout}\n`;
        }
        if (stderr) {
            output += `STDERR:\n${stderr}\n`;
        }

        return output || 'No new output since last check.';
    },
    {
        name: 'BashOutput',
        description:
            '\n- Retrieves output from a running or completed background bash shell\n- Takes a shell_id parameter identifying the shell\n- Always returns only new output since the last check\n- Returns stdout and stderr output along with shell status\n- Supports optional regex filtering to show only lines matching a pattern\n- Use this tool when you need to monitor or check the output of a long-running shell\n- Shell IDs can be found using the /bashes command\n',
        schema: z.object({
            bash_id: z.string().describe('The ID of the background shell to retrieve output from'),
            filter: z
                .string()
                .optional()
                .describe(
                    'Optional regular expression to filter the output lines. Only lines matching this regex will be included in the result. Any lines that do not match will no longer be available to read.',
                ),
        }),
    },
);
