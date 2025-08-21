import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import { join } from 'path';

function runGenDaily() {
  const result = spawnSync('npm', ['run', 'gen:daily'], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, GENDAILY_TEST: '1' },
    encoding: 'utf8',
  });
  const output = (result.stdout + result.stderr).split(/\n/).filter((l) => l.trim().startsWith('{'));
  return output.map((l) => JSON.parse(l));
}

describe('genDaily logging', () => {
  it('emits expected events', () => {
    const logs = runGenDaily();
    const messages = logs.map((l) => l.message);
    const sequence = ['start_run', 'reseed_started', 'place_word', 'dead_end', 'backtrack', 'final_failure', 'reseed_finished'];
    let lastIndex = -1;
    for (const msg of sequence) {
      const idx = messages.indexOf(msg);
      expect(idx).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
    logs.forEach((log) => {
      for (const key of Object.keys(log)) {
        expect(key.startsWith('runtime_fallback_')).toBe(false);
      }
    });
  });
});
