import allowlist from "../data/allowlist.json";
import denylist from "../data/denylist.json";

const allowSet = new Set(allowlist);
const denySet = new Set(denylist);

export function isAnswerAllowed(ans: string): boolean {
  if (!/^[A-Z]+$/.test(ans)) {
    return false;
  }
  if (ans.length === 1) {
    return false;
  }
  if (denySet.has(ans)) {
    return false;
  }
  if (ans.length === 2) {
    return allowSet.has(ans);
  }
  return true;
}
