import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('fs', () => {
  const promises = { readFile: vi.fn() };
  return {
    __esModule: true,
    default: { promises },
    promises,
  };
});
const fs = await import('fs');
const { GET } = await import('../../app/api/puzzle/[date]/route');

const fsPromises = fs.promises as unknown as {
  readFile: ReturnType<typeof vi.fn>;
};

describe('puzzle API route', () => {
  const samplePuzzle = {
    id: '2024-01-01',
    title: 'Sample',
    theme: '',
    across: [],
    down: [],
    cells: [],
  };

  beforeEach(() => {
    fsPromises.readFile.mockReset();
  });

  it('returns puzzle JSON for valid date', async () => {
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(samplePuzzle));
    const date = '2024-01-01';
    const req = new NextRequest(`http://localhost/api/puzzle/${date}`);
    const res = await GET(req, { params: { date } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(samplePuzzle);
  });

  it('returns 404 for missing puzzle', async () => {
    fsPromises.readFile.mockRejectedValueOnce(new Error('not found'));
    const date = '1999-01-01';
    const req = new NextRequest(`http://localhost/api/puzzle/${date}`);
    const res = await GET(req, { params: { date } });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: 'Puzzle not found' });
  });
});

