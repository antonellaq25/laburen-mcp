import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProductTools } from './tools/products';
import { registerCartTools } from './tools/cart';
import { registerSupportTools } from './tools/support';
import type { Env } from './types';

export class EcommerceMCP extends McpAgent<Env> {
  server = new McpServer({
    name: 'Laburen E-Commerce Agent',
    version: '1.0.0',
  });

  async init() {
    registerProductTools(this.server, this.env);
    registerCartTools(this.server, this.env);
    registerSupportTools(this.server, this.env);
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          name: 'Laburen E-Commerce MCP Server',
          status: 'healthy',
          mcp_endpoint: '/mcp',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.pathname === '/sse' || url.pathname === '/mcp') {
      return EcommerceMCP.serve(url.pathname).fetch(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};
