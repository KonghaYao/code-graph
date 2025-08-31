import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const exit_plan_mode_tool = tool(
    async ({ plan }) => {
        // This tool is for signaling the end of a planning phase.
        // The actual exiting of plan mode would be handled by the agent orchestrator.
        return `Exiting plan mode. The user has approved the following plan:\n${plan}`;
    },
    {
        name: 'ExitPlanMode',
        description:
            'Use this tool when you are in plan mode and have finished presenting your plan and are ready to code. This will prompt the user to exit plan mode. \nIMPORTANT: Only use this tool when the task requires planning the implementation steps of a task that requires writing code. For research tasks where you\'re gathering information, searching files, reading files or in general trying to understand the codebase - do NOT use this tool.\n\nEg. \n1. Initial task: "Search for and understand the implementation of vim mode in the codebase" - Do not use the exit plan mode tool because you are not planning the implementation steps of a task.\n2. Initial task: "Help me implement yank mode for vim" - Use the exit plan mode tool after you have finished planning the implementation steps of the task.\n',
        schema: z.object({
            plan: z
                .string()
                .describe(
                    'The plan you came up with, that you want to run by the user for approval. Supports markdown. The plan should be pretty concise.',
                ),
        }),
    },
);
