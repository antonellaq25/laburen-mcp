import { env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerSupportTools } from '../src/tools/support';

function createMockServer() {
  const tools = new Map<string, { description: string; schema: any; handler: Function }>();
  return {
    tool(name: string, description: string, schema: any, handler: Function) {
      tools.set(name, { description, schema, handler });
    },
    getHandler(name: string) {
      return tools.get(name)?.handler;
    },
    tools,
  };
}

describe('handoff_to_human tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerSupportTools(server, { DB: env.DB });
    expect(server.tools.has('handoff_to_human')).toBe(true);
  });

  it('returns escalation response with reason', async () => {
    const server = createMockServer();
    registerSupportTools(server, { DB: env.DB });
    const handler = server.getHandler('handoff_to_human')!;

    const result = await handler({ reason: 'Solicitud de reembolso' });
    const data = JSON.parse(result.content[0].text);

    expect(data.mensaje).toContain('escalada');
    expect(data.razon).toBe('Solicitud de reembolso');
    expect(data.escalation_id).toMatch(/^ESC-/);
    expect(data.estado).toBe('pendiente_revision_humana');
  });

  it('includes tags when provided', async () => {
    const server = createMockServer();
    registerSupportTools(server, { DB: env.DB });
    const handler = server.getHandler('handoff_to_human')!;

    const result = await handler({
      reason: 'Queja sobre producto',
      tags: ['queja', 'calidad'],
    });
    const data = JSON.parse(result.content[0].text);
    expect(data.etiquetas).toEqual(['queja', 'calidad']);
  });

  it('defaults to empty tags when not provided', async () => {
    const server = createMockServer();
    registerSupportTools(server, { DB: env.DB });
    const handler = server.getHandler('handoff_to_human')!;

    const result = await handler({ reason: 'Pregunta general' });
    const data = JSON.parse(result.content[0].text);
    expect(data.etiquetas).toEqual([]);
  });

  it('logs escalation to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = createMockServer();
    registerSupportTools(server, { DB: env.DB });
    const handler = server.getHandler('handoff_to_human')!;

    await handler({
      reason: 'Problema técnico',
      cart_id: 42,
      customer_message: 'No puedo pagar',
    });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const logArg = consoleSpy.mock.calls[0][1];
    const logged = JSON.parse(logArg);
    expect(logged.reason).toBe('Problema técnico');
    expect(logged.cart_id).toBe(42);
    expect(logged.customer_message).toBe('No puedo pagar');
    expect(logged.status).toBe('escalated');

    consoleSpy.mockRestore();
  });
});
