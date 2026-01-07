/**
 * Middleware for loading and exposing AGENTS.md documentation to the system prompt.
 *
 * This middleware implements a progressive disclosure pattern for AGENTS.md files:
 * 1. Load AGENTS.md content at session start
 * 2. Inject AGENTS.md info into system prompt for discoverability
 * 3. Agent reads full AGENTS.md content when relevant to a task
 *
 * Only supports root-level AGENTS.md: {PROJECT_ROOT}/AGENTS.md
 */

import { AgentMiddleware } from 'langchain';
import { AIMessage, SystemMessage } from '@langchain/core/messages';
import fs from 'fs/promises';
import { join } from 'path';
// AGENTS.md System Documentation
const AGENTS_MD_SYSTEM_PROMPT = `

## AGENTS.md 

{agents_md}`;

/**
 * Middleware for loading and exposing AGENTS.md documentation.
 *
 * This middleware implements progressive disclosure for AGENTS.md:
 * - Loads metadata from AGENTS.md at session start
 * - Injects AGENTS.md info into system prompt for discoverability
 * - Agent reads full AGENTS.md content when relevant (progressive disclosure)
 *
 * Only supports root-level AGENTS.md: {PROJECT_ROOT}/AGENTS.md
 */
export class AgentsMdMiddleware implements AgentMiddleware {
    name = 'AgentsMdMiddleware';
    // No context schema needed
    stateSchema = undefined;

    // No context schema needed
    contextSchema = undefined;

    // No additional tools
    tools = [];

    private projectRoot: string;
    private systemPromptTemplate: string;

    /**
     * Initialize the AGENTS.md middleware.
     *
     * @param projectRoot - Path to the project root directory (defaults to process.cwd())
     */
    constructor(options: { projectRoot?: string } = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.systemPromptTemplate = AGENTS_MD_SYSTEM_PROMPT;
    }

    /**
     * Inject AGENTS.md documentation into the system prompt.
     *
     * This runs on every model call to ensure AGENTS.md info is always available.
     *
     * @param request - The model request being processed
     * @param handler - The handler function to call with the modified request
     * @returns The model response from the handler
     */
    async wrapModelCall(request: any, handler: any): Promise<AIMessage> {
        if (
            !(await fs
                .access(join(this.projectRoot, 'AGENTS.md'))
                .then(() => true)
                .catch(() => false))
        ) {
            return await handler(request);
        }
        // Read AGENTS.md file
        const agentsMdFile = await fs.readFile(join(this.projectRoot, 'AGENTS.md'), 'utf-8');

        // Format the AGENTS.md documentation
        const agentsMdSection = this.systemPromptTemplate.replace('{agents_md}', agentsMdFile);

        // Create new system message by appending AGENTS.md section
        let newSystemPrompt: string;
        if (request.systemPrompt) {
            newSystemPrompt = request.systemPrompt + '\n\n' + agentsMdSection;
        } else {
            newSystemPrompt = agentsMdSection;
        }

        // Create a new system message
        const newSystemMessage = new SystemMessage(newSystemPrompt);

        // Create modified request
        const modifiedRequest = {
            ...request,
            systemMessage: newSystemMessage,
        };

        // Call the handler with modified request
        return await handler(modifiedRequest);
    }
}
