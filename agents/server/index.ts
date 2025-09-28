import LangGraphApp from '@langgraph-js/pure-graph/dist/adapter/hono/index.js';
import { registerGraph } from '@langgraph-js/pure-graph';
import { Hono } from 'hono';
import { graph } from '../code/graph.js';

const app = new Hono();

registerGraph('code', graph);

app.route('/', LangGraphApp);

export default {
    port: 3000,
    idleTimeout: 255,
    fetch: app.fetch,
};
