import { WordEntry } from "./puzzle";
import { getCached } from "./cache";
import { yyyyMmDd } from "../utils/date";
import { logError } from "../utils/logger";
import { cleanClue } from "./clueClean";

const isCrosswordFriendly = (word: string) => /^[A-Za-z]{2,15}$/.test(word);

const parseDefinition = (def: string) => def.split('\t').pop() ?? '';

export async function getSeasonalWords(date: Date): Promise<WordEntry[]> {
  const month = date.getUTCMonth() + 1;
  const topics: Record<number, string> = {
    1: 'winter',
    2: 'valentine',
    3: 'spring',
    4: 'spring',
    5: 'spring',
    6: 'summer',
    7: 'summer',
    8: 'summer',
    9: 'autumn',
    10: 'halloween',
    11: 'thanksgiving',
    12: 'christmas'
  };
  const topic = topics[month] ?? 'season';
  const key = `seasonal-${yyyyMmDd(date)}`;
  const result = await getCached<WordEntry[]>(key, async () => {
    const url = `https://api.datamuse.com/words?topics=${encodeURIComponent(topic)}&md=d&max=50`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (e) {
      logError('api_fetch_failed', { source: 'datamuse', url, error: (e as Error).message });
      throw e;
    }
    if (!res.ok) {
      logError('api_status_error', { source: 'datamuse', url, status: res.status });
      throw new Error(`Datamuse request failed: ${res.status}`);
    }
    const data = await res.json();
    return (data || [])
      .filter((w: any) => w.word && w.defs && w.defs.length > 0)
      .map((w: any) => ({ answer: w.word.toUpperCase(), clue: cleanClue(parseDefinition(w.defs[0])), frequency: Infinity }))
      .filter((p: WordEntry) => isCrosswordFriendly(p.answer));
  });
  if (!result) logError('getSeasonalWords_failed', { key, topic });
  return result ?? [];
}

export async function getFunFactWords(): Promise<WordEntry[]> {
  const key = `funfact-${yyyyMmDd()}`;
  const result = await getCached<WordEntry[]>(key, async () => {
    const url = 'https://opentdb.com/api.php?amount=20&type=multiple';
    let res: Response;
    try {
      res = await fetch(url);
    } catch (e) {
      logError('api_fetch_failed', { source: 'opentdb', url, error: (e as Error).message });
      throw e;
    }
    if (!res.ok) {
      logError('api_status_error', { source: 'opentdb', url, status: res.status });
      throw new Error(`OpenTDB request failed: ${res.status}`);
    }
    const json = await res.json();
    return (json.results || [])
      .map((q: any) => ({
        answer: cleanClue(q.correct_answer).replace(/[^A-Za-z]/g, '').toUpperCase(),
        clue: cleanClue(q.question),
        frequency: Infinity,
      }))
      .filter((p: WordEntry) => isCrosswordFriendly(p.answer));
  });
  if (!result) logError('getFunFactWords_failed', { key });
  return result ?? [];
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[(.*?)\\]\\]>|([^<]*))</${tag}>`, 'i');
  const match = block.match(re);
  const content = match?.[1] ?? match?.[2] ?? '';
  return cleanClue(content.trim());
}

export async function getCurrentEventWords(date: Date): Promise<WordEntry[]> {
  const key = `current-${yyyyMmDd(date)}`;
  const result = await getCached<WordEntry[]>(key, async () => {
    const url = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
    let res: Response;
    try {
      res = await fetch(url);
    } catch (e) {
      logError('api_fetch_failed', { source: 'google-news', url, error: (e as Error).message });
      throw e;
    }
    if (!res.ok) {
      logError('api_status_error', { source: 'google-news', url, status: res.status });
      throw new Error(`Google News request failed: ${res.status}`);
    }
    const xml = await res.text();
    const out: WordEntry[] = [];
    const seen = new Set<string>();
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml)) !== null && out.length < 10) {
      const item = m[1];
      const title = extractTag(item, 'title');
      const description = extractTag(item, 'description');
      const clue = cleanClue(description || title);
      const words = `${title} ${description}`.split(/[^A-Za-z]+/g);
      for (const w of words) {
        if (!isCrosswordFriendly(w)) continue;
        const ans = w.toUpperCase();
        if (seen.has(ans)) continue;
        out.push({ answer: ans, clue, frequency: Infinity });
        seen.add(ans);
        if (out.length >= 10) break;
      }
    }
    return out;
  });
  if (!result) logError('getCurrentEventWords_failed', { key });
  return result ?? [];
}
