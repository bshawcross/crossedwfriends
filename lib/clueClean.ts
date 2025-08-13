export function cleanClue(raw: string): string {
  if (!raw) return '';
  const entityMap: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    rsquo: '’',
    lsquo: '‘',
    ldquo: '“',
    rdquo: '”',
    eacute: 'é'
  };
  let s = raw.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, p1) => {
    if (p1[0] === '#') {
      const code = p1[1].toLowerCase() === 'x' ? parseInt(p1.slice(2), 16) : parseInt(p1.slice(1), 10);
      if (!isNaN(code)) return String.fromCodePoint(code);
      return m;
    }
    return entityMap[p1] ?? m;
  });
  s = s.replace(/<[^>]*>/g, ' ');
  s = s.replace(/https?:\/\/\S+|www\.\S+/gi, ' ');
  s = s.replace(/\(\s*\d+(?:[\s,\-]*\d+)*\s*\)/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
