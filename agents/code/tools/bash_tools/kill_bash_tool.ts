import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { background_processes } from './bash_manager.js';

export const kill_bash_tool = tool(
    async ({ shell_id }) => {
        const pid = parseInt(shell_id, 10);
        const managed_process = background_processes.get(pid);

        if (!managed_process) {
            return `Error: No background process found with ID ${shell_id}.`;
        }

        managed_process.process.kill();
        background_processes.delete(pid);

        return `Successfully killed bash process with ID ${shell_id}.`;
    },
    {
        name: 'KillBash',
        description:
            '\n- Kills a running background bash shell by its ID\n- Takes a shell_id parameter identifying the shell to kill\n- Returns a success or failure status \n- Use this tool when you need to terminate a long-running shell\n- Shell IDs can be found using the /bashes command\n',
        schema: z.object({
            shell_id: z.string().describe('The ID of the background shell to kill'),
        }),
    },
);
