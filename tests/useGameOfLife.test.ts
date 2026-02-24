import { describe, it, expect } from "vitest";
import {
  useGameOfLife,
  cellKey,
  keyX,
  keyY,
  exportCells,
  importCells,
} from "~/composables/useGameOfLife";

function cellsToCoords(cells: Set<number>): [number, number][] {
  return [...cells]
    .map((k) => [keyX(k), keyY(k)] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

describe("cellKey / keyX / keyY", () => {
  it("round-trips origin", () => {
    const k = cellKey(0, 0);
    expect(keyX(k)).toBe(0);
    expect(keyY(k)).toBe(0);
  });

  it("round-trips positive coordinates", () => {
    const k = cellKey(100, 200);
    expect(keyX(k)).toBe(100);
    expect(keyY(k)).toBe(200);
  });

  it("round-trips negative coordinates", () => {
    const k = cellKey(-50, -100);
    expect(keyX(k)).toBe(-50);
    expect(keyY(k)).toBe(-100);
  });

  it("round-trips boundary min", () => {
    const k = cellKey(-32768, -32768);
    expect(keyX(k)).toBe(-32768);
    expect(keyY(k)).toBe(-32768);
  });

  it("round-trips boundary max", () => {
    const k = cellKey(32767, 32767);
    expect(keyX(k)).toBe(32767);
    expect(keyY(k)).toBe(32767);
  });

  it("produces unique keys for different coordinates", () => {
    expect(cellKey(1, 2)).not.toBe(cellKey(2, 1));
    expect(cellKey(0, 1)).not.toBe(cellKey(1, 0));
  });
});

describe("useGameOfLife", () => {
  it("creates cells from initial state", () => {
    const { cells } = useGameOfLife([
      [0, 0],
      [1, 1],
    ]);
    expect(cells.value.size).toBe(2);
    expect(cells.value.has(cellKey(0, 0))).toBe(true);
    expect(cells.value.has(cellKey(1, 1))).toBe(true);
  });

  it("blinker oscillates", () => {
    // Horizontal blinker: (0,0),(1,0),(2,0)
    const { cells, step } = useGameOfLife([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);

    step();
    // Should become vertical: (1,-1),(1,0),(1,1)
    expect(cells.value.size).toBe(3);
    expect(cellsToCoords(cells.value)).toEqual([
      [1, -1],
      [1, 0],
      [1, 1],
    ]);

    step();
    // Should return to horizontal
    expect(cellsToCoords(cells.value)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
  });

  it("block is stable", () => {
    const initial: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    const { cells, step } = useGameOfLife(initial);

    step();
    expect(cells.value.size).toBe(4);
    expect(cellsToCoords(cells.value)).toEqual(
      [...initial].sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    );
  });

  it("toggle adds and removes cells", () => {
    const { cells, toggle } = useGameOfLife([]);

    toggle(5, 3);
    expect(cells.value.has(cellKey(5, 3))).toBe(true);

    toggle(5, 3);
    expect(cells.value.has(cellKey(5, 3))).toBe(false);
  });

  it("toggle mutates the existing Set", () => {
    const { cells, toggle } = useGameOfLife([]);
    const before = cells.value;
    toggle(1, 1);
    expect(cells.value).toBe(before);
  });

  it("reset restores initial state and generation", () => {
    const initial: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
    ];
    const { cells, generation, step, reset } = useGameOfLife(initial);

    step();
    step();
    expect(generation.value).toBe(2);

    reset();
    expect(generation.value).toBe(0);
    expect(cellsToCoords(cells.value)).toEqual(
      [...initial].sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    );
  });

  it("empty grid stays empty", () => {
    const { cells, step } = useGameOfLife([]);
    step();
    expect(cells.value.size).toBe(0);
  });

  it("single cell dies", () => {
    const { cells, step } = useGameOfLife([[5, 5]]);
    step();
    expect(cells.value.size).toBe(0);
  });

  it("two adjacent cells die", () => {
    const { cells, step } = useGameOfLife([
      [0, 0],
      [1, 0],
    ]);
    step();
    expect(cells.value.size).toBe(0);
  });

  it("L-triomino becomes block", () => {
    const { cells, step } = useGameOfLife([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    step();
    expect(cells.value.size).toBe(4);
    expect(cellsToCoords(cells.value)).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
  });

  it("glider maintains 5 cells across steps", () => {
    const { cells, step } = useGameOfLife([
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
    for (let i = 0; i < 20; i++) {
      step();
      expect(cells.value.size).toBe(5);
    }
  });

  it("clear empties cells and resets generation", () => {
    const { cells, generation, step, clear } = useGameOfLife([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
    step();
    clear();
    expect(cells.value.size).toBe(0);
    expect(generation.value).toBe(0);
  });
});

describe("exportCells / importCells", () => {
  it("round-trips a set of cells", () => {
    const original = new Set([
      cellKey(0, 0),
      cellKey(1, 0),
      cellKey(2, 0),
      cellKey(10, 5),
      cellKey(-3, -7),
    ]);
    const str = exportCells(original);
    const restored = importCells(str);
    expect(restored).toEqual(original);
  });

  it("empty set produces empty string", () => {
    expect(exportCells(new Set())).toBe("");
  });

  it("empty string produces empty set", () => {
    expect(importCells("")).toEqual(new Set());
    expect(importCells("  ")).toEqual(new Set());
  });

  it("single cell round-trips", () => {
    const original = new Set([cellKey(5, 3)]);
    const restored = importCells(exportCells(original));
    expect(restored).toEqual(original);
  });

  it("negative coordinates round-trip", () => {
    const original = new Set([
      cellKey(-10, -20),
      cellKey(-5, 3),
      cellKey(0, 0),
    ]);
    const restored = importCells(exportCells(original));
    expect(restored).toEqual(original);
  });

  it("produces a compact string via delta encoding", () => {
    const cells = new Set([cellKey(0, 0), cellKey(1, 0), cellKey(2, 0)]);
    const str = exportCells(cells);
    expect(str.length).toBeLessThan(20);
    expect(importCells(str)).toEqual(cells);
  });
});
