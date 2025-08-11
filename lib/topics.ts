import { WordEntry } from "./puzzle";
import { getCached } from "./cache";
import { yyyyMmDd } from "../utils/date";

const isCrosswordFriendly = (word: string) => /^[A-Za-z]{3,15}$/.test(word);

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
    const res = await fetch(`https://api.datamuse.com/words?topics=${encodeURIComponent(topic)}&md=d&max=50`);
    if (!res.ok) throw new Error(`Datamuse request failed: ${res.status}`);
    const data = await res.json();
    return (data || [])
      .filter((w: any) => w.word && w.defs && w.defs.length > 0)
      .map((w: any) => ({ answer: w.word.toUpperCase(), clue: parseDefinition(w.defs[0]) }))
      .filter((p: WordEntry) => isCrosswordFriendly(p.answer));
  });
  if (!result) console.error('getSeasonalWords failed');
  return result ?? [];
}

const decodeHTML = (s: string) => s
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&eacute;/g, 'é')
  .replace(/&rsquo;/g, '’')
  .replace(/&ldquo;/g, '“')
  .replace(/&rdquo;/g, '”');

export async function getFunFactWords(): Promise<WordEntry[]> {
  const key = `funfact-${yyyyMmDd()}`;
  const result = await getCached<WordEntry[]>(key, async () => {
    const res = await fetch('https://opentdb.com/api.php?amount=20&type=multiple');
    if (!res.ok) throw new Error(`OpenTDB request failed: ${res.status}`);
    const json = await res.json();
    return (json.results || [])
      .map((q: any) => ({
        answer: decodeHTML(q.correct_answer).replace(/[^A-Za-z]/g, '').toUpperCase(),
        clue: decodeHTML(q.question)
      }))
      .filter((p: WordEntry) => isCrosswordFriendly(p.answer));
  });
  if (!result) console.error('getFunFactWords failed');
  return result ?? [];
}

export async function getCurrentEventWords(): Promise<WordEntry[]> {
  const now = new Date();
  const key = `current-${yyyyMmDd(now)}`;
  const result = await getCached<WordEntry[]>(key, async () => {
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const res = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`);
    if (!res.ok) throw new Error(`Wikimedia request failed: ${res.status}`);
    const json = await res.json();
    const articles = json.items?.[0]?.articles || [];
    const out: WordEntry[] = [];
    for (const a of articles) {
      const title = a.article as string;
      const normalized = title.replace(/_/g, ' ');
      const answer = normalized.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (!isCrosswordFriendly(answer)) continue;
      const sumRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!sumRes.ok) continue;
      const sumJson = await sumRes.json();
      const clue = sumJson.extract || sumJson.description;
      if (!clue) continue;
      out.push({ answer, clue });
      if (out.length >= 10) break;
    }
    return out;
  });
  if (!result) console.error('getCurrentEventWords failed');
  return result ?? [];
}
