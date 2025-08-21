import { normalizeAnswer } from './candidatePool';

export type GenItem = { answer: string; clue: string; source?: string };

function stripMarkdown(input: string): string {
  let out = input;
  // Remove fenced code blocks
  out = out.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  out = out.replace(/`([^`]*)`/g, '$1');
  // Remove bold/italic markers
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/\*([^*]+)\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');
  out = out.replace(/_([^_]+)_/g, '$1');
  return out.trim();
}

export function parseGen(output: unknown): GenItem[] {
  let data: unknown;
  try {
    if (typeof output === 'string') {
      data = JSON.parse(output);
    } else {
      data = JSON.parse(String(output));
    }
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: GenItem[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const ans = (item as any).answer;
    const clueRaw = (item as any).clue;
    if (typeof ans !== 'string' || typeof clueRaw !== 'string') continue;
    const answer = normalizeAnswer(ans);
    if (!answer) continue;
    const clue = stripMarkdown(clueRaw);
    const source = typeof (item as any).source === 'string' ? (item as any).source : undefined;
    out.push({ answer, clue, source });
  }
  return out;
}

