#!/usr/bin/env python3
import json
import sys

try:
    import puz
except ImportError:
    sys.stderr.write('puz library required\n')
    sys.exit(1)


def main(path: str):
    p = puz.read(path)
    numbering = p.clue_numbering()
    width = p.width
    height = p.height
    solution = []
    for r in range(height):
        row = []
        for c in range(width):
            ch = p.solution[r * width + c]
            row.append(ch if ch != '.' else '#')
        solution.append(row)

    def map_clues(clues):
        out = []
        for cl in clues:
            out.append({"number": cl["num"], "clue": cl["clue"], "answer": cl["answer"]})
        return out

    data = {
        "title": p.title,
        "author": p.author,
        "dimensions": {"width": width, "height": height},
        "solution": solution,
        "clues": {
            "across": map_clues(numbering.across),
            "down": map_clues(numbering.down),
        },
    }
    json.dump(data, sys.stdout)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write('usage: puz2json.py <file.puz>\n')
        sys.exit(1)
    main(sys.argv[1])
