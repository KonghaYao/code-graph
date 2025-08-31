import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const fetchJson = tool(
  async ({ url, method = 'GET', query, headers, body }) => {
    try {
      const u = new URL(url);
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          u.searchParams.set(k, String(v));
        }
      }
      const res = await fetch(u.toString(), {
        method,
        headers: headers as Record<string, string> | undefined,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        return JSON.stringify({ status: res.status, ok: res.ok, body: text.slice(0, 2000) });
      }
      const json = await res.json();
      return JSON.stringify({ status: res.status, ok: res.ok, body: json });
    } catch (err) {
      return `Error: ${(err as Error).message}`;
    }
  },
  {
    name: 'fetch_json',
    description: 'Fetch JSON from a URL with optional method, query, headers, and body',
    schema: z.object({
      url: z.string().url(),
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
      query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      headers: z.record(z.string(), z.string()).optional(),
      body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    }),
  },
);

