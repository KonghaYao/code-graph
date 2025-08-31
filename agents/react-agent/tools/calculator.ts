import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const calculator = tool(
  async ({ a, b, op }) => {
    if (op === 'div' && b === 0) {
      return 'Error: division by zero';
    }
    const result =
      op === 'add' ? a + b :
      op === 'sub' ? a - b :
      op === 'mul' ? a * b :
      op === 'div' ? a / b :
      NaN;
    return String(result);
  },
  {
    name: 'calculator',
    description: 'Perform arithmetic on two numbers. ops: add | sub | mul | div',
    schema: z.object({
      a: z.number(),
      b: z.number(),
      op: z.enum(['add', 'sub', 'mul', 'div']),
    }),
  },
);

