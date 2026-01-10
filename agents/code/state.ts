import { AgentState } from '@langgraph-js/pro';
import { z } from 'zod';
import { SubAgentStateSchema } from './ask_agents';

export const CodeState = AgentState.extend(SubAgentStateSchema.shape).extend({
    main_model: z.string().default('qwen-plus'),
    cwd: z.string().default(''),
    agent_name: z.string().default('Code Agent'),
    mcp_config: z.unknown().optional(),
    switch_command: z.string().optional(),
});
