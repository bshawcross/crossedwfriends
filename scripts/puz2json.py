#!/usr/bin/env python3
"""Convert a .puz crossword puzzle into JSON.

Usage:
    python3 scripts/puz2json.py <file.puz>
"""

from __future__ import annotations

import json
import sys
from typing import List

try:
    import puz
except ImportError:  # pragma: no cover - handled at runtime
    sys.stderr.write("puzpy library required\n")
    sys.exit(1)


def build_grid(p: "puz.Puzzle") -> List[List[str]]:
    """Return a 2D array representing the puzzle's solution grid."""
    width, height = p.width, p.height
    grid: List[List[str]] = []
    for r in range(height):
        row = []
        for c in range(width):
            ch = p.solution[r * width + c]
            row.append("#" if ch == "." else ch)
        grid.append(row)
    return grid


def build_numbering(p: "puz.Puzzle"):
    """Return cell numbering grid and clue metadata."""
    width, height = p.width, p.height
    numbers = [[0] * width for _ in range(height)]
    numbering = p.clue_numbering()
    for cl in list(numbering.across) + list(numbering.down):
        r, c = divmod(cl["cell"], width)
        numbers[r][c] = cl["num"]
    return numbers, numbering


def map_clues(clues, direction: str, width: int, solution: str):
    out = []
    for cl in clues:
        cell = cl["cell"]
        r, c = divmod(cell, width)
        answer_chars = []
        if direction == "across":
            for i in range(cl["len"]):
                ch = solution[cell + i]
                answer_chars.append("#" if ch == "." else ch)
        else:  # down
            for i in range(cl["len"]):
                ch = solution[cell + i * width]
                answer_chars.append("#" if ch == "." else ch)
        out.append(
            {
                "number": cl["num"],
                "clue": cl["clue"],
                "answer": "".join(answer_chars),
                "row": r,
                "col": c,
                "length": cl["len"],
            }
        )
    return out


def main(path: str) -> None:
    p = puz.read(path)
    grid = build_grid(p)
    numbers, numbering = build_numbering(p)
    data = {
        "title": p.title,
        "author": p.author,
        "width": p.width,
        "height": p.height,
        "grid": grid,
        "numbering": numbers,
        "clues": {
            "across": map_clues(numbering.across, "across", p.width, p.solution),
            "down": map_clues(numbering.down, "down", p.width, p.solution),
        },
    }
    json.dump(data, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("usage: puz2json.py <file.puz>\n")
        sys.exit(1)
    main(sys.argv[1])
