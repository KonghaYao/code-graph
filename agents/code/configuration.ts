import { RunnableConfig } from '@langchain/core/runnables';
import { createDefaultAnnotation, createState } from '@langgraph-js/pro';
import { EnvConfig } from './prompts/coding.js';

const PermissionConfig = createState().build({
    permission: createDefaultAnnotation(() => 'all'),
});

export const ConfigurationSchema = createState(EnvConfig, PermissionConfig).build({
    /**
     * The name of the language model to be used by the agent.
     */
    model: createDefaultAnnotation(() => 'claude-3-7-sonnet-latest'),
});

export function useConfiguration(config: RunnableConfig): typeof ConfigurationSchema.State {
    /**
     * Ensure the defaults are populated.
     */
    const configurable = config.configurable ?? {};
    return configurable as unknown as typeof ConfigurationSchema.State;
}
