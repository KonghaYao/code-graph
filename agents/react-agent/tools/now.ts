import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const now = tool(
  async () => new Date().toISOString(),
  {
    name: 'now',
    description: 'Get the current time in ISO 8601 format',
    schema: z.object({}),
  },
);

