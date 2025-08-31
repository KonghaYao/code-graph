import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const sleep = tool(
  async ({ ms }) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return `Slept for ${ms} ms`;
  },
  {
    name: 'sleep',
    description: 'Sleep for a number of milliseconds (max 60000)',
    schema: z.object({ ms: z.number().int().min(0).max(60000) }),
  },
);

