export function validateAuditHistory(
  index: {
    id: string;
    path: string;
    generatedAt: string;
    [key: string]: unknown;
  }[],
  readReport: (path: string) => unknown,
  sources: { id: string; url: string }[],
  assertions: { id: string }[],
): string[];
