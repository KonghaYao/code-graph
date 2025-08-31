import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const echo = tool(
  async ({ text }) => text,
  {
    name: 'echo',
    description: 'Echo back the provided text',
    schema: z.object({ text: z.string() }),
  },
);

