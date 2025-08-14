import denylist from "../../data/denylist.json";

const denySet = new Set<string>(denylist);

export function isValidFill(ans: string, opts: { allow2?: boolean } = {}): boolean {
  if (!/^[A-Z]+$/.test(ans)) return false;
  if (ans.length === 1) return false;
  if (ans.length === 2 && !opts.allow2) return false;
  if (denySet.has(ans)) return false;
  return true;
}
