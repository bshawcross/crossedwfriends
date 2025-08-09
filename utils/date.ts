export function yyyyMmDd(d = new Date(), tz='America/Los_Angeles') {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' });
  const parts = fmt.formatToParts(d).reduce((acc:any, p:any)=>{acc[p.type]=p.value; return acc;}, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function tzOffset(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc: any, p: any) => { acc[p.type] = p.value; return acc; }, {});
  const asUTC = Date.UTC(
    parseInt(parts.year, 10),
    parseInt(parts.month, 10) - 1,
    parseInt(parts.day, 10),
    parseInt(parts.hour, 10),
    parseInt(parts.minute, 10),
    parseInt(parts.second, 10)
  );
  return asUTC - date.getTime();
}

export function msUntilNextPuzzle(tz = 'America/Los_Angeles') {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now).reduce((acc: any, p: any) => { acc[p.type] = p.value; return acc; }, {});
  const year = parseInt(parts.year, 10);
  const month = parseInt(parts.month, 10);
  const day = parseInt(parts.day, 10);
  const guess = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
  const offset = tzOffset(guess, tz);
  const target = guess.getTime() - offset;
  return target - now.getTime();
}
