import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";

// In-memory file system mock
const files = new Map<string, string>();
const fsPromises = {
  readFile: vi.fn(async (p: string) => {
    const val = files.get(p);
    if (val === undefined) throw new Error("ENOENT");
    return val;
  }),
  writeFile: vi.fn(async (p: string, data: string) => {
    files.set(p, data);
  }),
  mkdir: vi.fn(async () => {})
};
vi.mock("fs", () => ({
  promises: fsPromises,
  default: { promises: fsPromises }
}));

function mockFetch(impl: (url: string) => any) {
  const fn = vi.fn((url: any) => impl(url as string));
  (global as any).fetch = fn;
  return fn;
}

beforeEach(() => {
  files.clear();
  fsPromises.readFile.mockClear();
  fsPromises.writeFile.mockClear();
  fsPromises.mkdir.mockClear();
  vi.resetModules();
});

afterEach(() => {
  delete (global as any).fetch;
});

describe("getSeasonalWords", () => {
  it("returns normalized WordEntry[]", async () => {
    mockFetch(() =>
      Promise.resolve({
        ok: true,
        json: async () => [{ word: "apple", defs: ["n\tfruit"] }]
      })
    );
    const { getSeasonalWords } = await import("../../lib/topics");
    const result = await getSeasonalWords(new Date("2024-01-01"));
    expect(result).toEqual([{ answer: "APPLE", clue: "fruit" }]);
  });

  it("returns [] on failure", async () => {
    mockFetch(() => Promise.resolve({ ok: false, status: 500 }));
    const { getSeasonalWords } = await import("../../lib/topics");
    const result = await getSeasonalWords(new Date("2024-02-01"));
    expect(result).toEqual([]);
  });
});

describe("getFunFactWords", () => {
  it("returns normalized WordEntry[]", async () => {
    mockFetch(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          results: [
            { correct_answer: "Alpha Beta", question: "Sample?" }
          ]
        })
      })
    );
    const { getFunFactWords } = await import("../../lib/topics");
    const result = await getFunFactWords();
    expect(result).toEqual([{ answer: "ALPHABETA", clue: "Sample?" }]);
  });

  it("returns [] on failure", async () => {
    mockFetch(() => Promise.resolve({ ok: false, status: 500 }));
    const { getFunFactWords } = await import("../../lib/topics");
    const result = await getFunFactWords();
    expect(result).toEqual([]);
  });
});

describe("getCurrentEventWords", () => {
  it("returns normalized WordEntry[]", async () => {
    mockFetch((url) => {
      if (url.includes("metrics/pageviews")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{ articles: [{ article: "Foo_Bar" }] }]
          })
        });
      }
      if (url.includes("page/summary/Foo_Bar")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ extract: "Example summary" })
        });
      }
      return Promise.reject(new Error("unknown url"));
    });
    const { getCurrentEventWords } = await import("../../lib/topics");
    const result = await getCurrentEventWords();
    expect(result).toEqual([{ answer: "FOOBAR", clue: "Example summary" }]);
  });

  it("returns [] on failure", async () => {
    mockFetch((url) => {
      if (url.includes("metrics/pageviews")) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    const { getCurrentEventWords } = await import("../../lib/topics");
    const result = await getCurrentEventWords();
    expect(result).toEqual([]);
  });
});

describe("getCached", () => {
  it("writes to disk and uses memory cache", async () => {
    const { getCached } = await import("../../lib/cache");
    const key = "test";
    const fetcher = vi.fn(async () => "value");
    const result1 = await getCached(key, fetcher);
    expect(result1).toBe("value");
    const filePath = path.join(process.cwd(), ".cache", `${key}.json`);
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      filePath,
      JSON.stringify("value")
    );
    const fetcher2 = vi.fn(async () => "newValue");
    const result2 = await getCached(key, fetcher2);
    expect(result2).toBe("value");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher2).not.toHaveBeenCalled();
    expect(fsPromises.readFile).toHaveBeenCalledTimes(1);
  });

  it("reads from disk when memory is empty", async () => {
    const key = "disk";
    const filePath = path.join(process.cwd(), ".cache", `${key}.json`);
    files.set(filePath, JSON.stringify("diskValue"));
    const { getCached } = await import("../../lib/cache");
    const fetcher = vi.fn();
    const result = await getCached(key, fetcher);
    expect(result).toBe("diskValue");
    expect(fsPromises.readFile).toHaveBeenCalledWith(filePath, "utf8");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
