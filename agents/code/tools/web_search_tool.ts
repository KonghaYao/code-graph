import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const web_search_tool = tool(
    async ({ query, allowed_domains, blocked_domains }) => {
        // This is a placeholder for a web search implementation.
        // It would typically involve calling a search engine API.
        let search_info = `Searching for: "${query}"`;
        if (allowed_domains) {
            search_info += ` within domains: ${allowed_domains.join(', ')}`;
        }
        if (blocked_domains) {
            search_info += ` blocking domains: ${blocked_domains.join(', ')}`;
        }
        return `Placeholder: ${search_info}. No actual search performed.`;
    },
    {
        name: 'WebSearch',
        description:
            '\n- Allows Claude to search the web and use the results to inform responses\n- Provides up-to-date information for current events and recent data\n- Returns search result information formatted as search result blocks\n- Use this tool for accessing information beyond Claude\'s knowledge cutoff\n- Searches are performed automatically within a single API call\n\nUsage notes:\n  - Domain filtering is supported to include or block specific websites\n  - Web search is only available in the US\n  - Account for "Today\'s date" in <env>. For example, if <env> says "Today\'s date: 2025-07-01", and the user wants the latest docs, do not use 2024 in the search query. Use 2025.\n',
        schema: z.object({
            query: z.string().min(2).describe('The search query to use'),
            allowed_domains: z.array(z.string()).optional().describe('Only include search results from these domains'),
            blocked_domains: z.array(z.string()).optional().describe('Never include search results from these domains'),
        }),
    },
);
