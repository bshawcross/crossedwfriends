function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(meta).filter(([k]) => !k.startsWith('runtime_fallback_')),
  );
}

export function logInfo(message: string, meta: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level: 'info', message, ...sanitize(meta) }));
}

export function logWarn(message: string, meta: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({ level: 'warn', message, ...sanitize(meta) }));
}

export function logError(message: string, meta: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ level: 'error', message, ...sanitize(meta) }));
}
