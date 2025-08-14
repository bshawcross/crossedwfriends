export function logInfo(message: string, meta: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level: 'info', message, ...meta }));
}

export function logWarn(message: string, meta: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({ level: 'warn', message, ...meta }));
}

export function logError(message: string, meta: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ level: 'error', message, ...meta }));
}
