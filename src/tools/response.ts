type ToolResponse = {
  content: { type: 'text'; text: string }[];
  isError?: true;
};

export function toolSuccess(data: unknown): ToolResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function toolError(message: string): ToolResponse {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function withErrorHandler(
  errorPrefix: string,
  handler: (...args: any[]) => Promise<ToolResponse>,
): (...args: any[]) => Promise<ToolResponse> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toolError(`${errorPrefix}: ${(error as Error).message}`);
    }
  };
}
