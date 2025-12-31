import { AgentState } from '@langgraph-js/pro';
import { z } from 'zod';
import { SubAgentStateSchema } from './ask_agents';

export const CodeState = AgentState.merge(SubAgentStateSchema).merge(
    z.object({
        agent_name: z.string(),
        main_model: z.string().default('qwen-plus'),
        cwd: z.string(),
    }),
);
