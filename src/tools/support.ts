import { z } from 'zod';

export function registerSupportTools(server: any, env: { DB: D1Database }) {
  server.tool(
    'handoff_to_human',
    'Escalar la conversacion a un agente humano de soporte. Usa esta herramienta cuando el cliente tiene una pregunta o problema que no puede ser resuelto por el agente de IA, como quejas, solicitudes de reembolso, pedidos personalizados o problemas tecnicos.',
    {
      reason: z.string().describe('Descripcion breve de por que se necesita la escalacion'),
      tags: z.array(z.string()).optional().describe('Etiquetas de contexto como ["reembolso", "queja", "tecnico"] para enrutar al equipo correcto'),
      cart_id: z.number().optional().describe('ID del carrito si es relevante para la escalacion'),
      customer_message: z.string().optional().describe('El ultimo mensaje o solicitud del cliente'),
    },
    async ({ reason, tags, cart_id, customer_message }: {
      reason: string;
      tags?: string[];
      cart_id?: number;
      customer_message?: string;
    }) => {
      const escalation = {
        timestamp: new Date().toISOString(),
        reason,
        tags: tags ?? [],
        cart_id: cart_id ?? null,
        customer_message: customer_message ?? null,
        status: 'escalated',
      };

      console.log('HUMAN_HANDOFF:', JSON.stringify(escalation));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            mensaje: 'La conversacion ha sido escalada a un agente humano.',
            escalation_id: `ESC-${Date.now()}`,
            razon: reason,
            etiquetas: tags ?? [],
            estado: 'pendiente_revision_humana',
          }, null, 2),
        }],
      };
    }
  );
}
