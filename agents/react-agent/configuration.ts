import { SYSTEM_PROMPT_TEMPLATE } from './prompts.js';
import { RunnableConfig } from '@langchain/core/runnables';
import { createDefaultAnnotation, createState } from '@langgraph-js/pro';
export const ConfigurationSchema = createState().build({
    /**
     * The system prompt to be used by the agent.
     */
    systemPromptTemplate: createDefaultAnnotation(() => SYSTEM_PROMPT_TEMPLATE),

    /**
     * The name of the language model to be used by the agent.
     */
    model: createDefaultAnnotation(() => 'claude-3-7-sonnet-latest'),
});

export function useConfiguration(config: RunnableConfig): typeof ConfigurationSchema.State {
    /**
     * Ensure the defaults are populated.
     */
    const configurable = config.configurable;
    return configurable as unknown as typeof ConfigurationSchema.State;
}
