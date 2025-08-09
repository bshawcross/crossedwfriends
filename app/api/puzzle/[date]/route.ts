import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Puzzle } from '@/lib/puzzle';

export async function GET(
  req: Request,
  { params }: { params: { date: string } }
) {
  const { date } = params;
  try {
    const filePath = path.join(process.cwd(), 'puzzles', `${date}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const puzzle: Puzzle = JSON.parse(data);
    return NextResponse.json(puzzle);
  } catch (err) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }
}
