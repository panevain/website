import { shallowRef, triggerRef, type Ref } from "vue";

function cellKey(x: number, y: number): number {
  return ((x + 0x8000) << 16) | (y + 0x8000);
}

function keyX(key: number): number {
  return (key >>> 16) - 0x8000;
}

function keyY(key: number): number {
  return (key & 0xffff) - 0x8000;
}

const NEIGHBOR_DELTAS = [-65537, -65536, -65535, -1, 1, 65535, 65536, 65537];

export interface GameOfLifeState {
  cells: Ref<Set<number>>;
  generation: Ref<number>;
  isRunning: Ref<boolean>;
}

export interface GameOfLifeActions {
  step(): void;
  toggle(x: number, y: number): void;
  play(): void;
  pause(): void;
  reset(): void;
  clear(): void;
  getExport(): string;
  loadImport(str: string): void;
}

export { cellKey, keyX, keyY };

/**
 * Compact board serialization format:
 * - Cells sorted by (y, x), then delta-encoded
 * - Each number is base36, pairs separated by "," and cells by ";"
 * - First cell is absolute, rest are deltas from the previous cell
 * Example: "1,5;0,1;9,-1;..." (base36 encoded deltas)
 */
export function exportCells(cells: Set<number>): string {
  if (cells.size === 0) return "";
  const coords = [...cells]
    .map((k) => [keyX(k), keyY(k)] as [number, number])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const parts: string[] = [];
  let px = 0;
  let py = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x, y] = coords[i];
    if (i === 0) {
      parts.push(`${toB36(x)},${toB36(y)}`);
    } else {
      parts.push(`${toB36(x - px)},${toB36(y - py)}`);
    }
    px = x;
    py = y;
  }
  return parts.join(";");
}

export function importCells(str: string): Set<number> {
  const result = new Set<number>();
  const trimmed = str.trim();
  if (!trimmed) return result;
  let x = 0;
  let y = 0;
  for (const part of trimmed.split(";")) {
    const sep = part.indexOf(",");
    if (sep === -1) continue;
    x += fromB36(part.substring(0, sep));
    y += fromB36(part.substring(sep + 1));
    result.add(cellKey(x, y));
  }
  return result;
}

function toB36(n: number): string {
  return n.toString(36);
}

function fromB36(s: string): number {
  return parseInt(s, 36);
}

export function useGameOfLife(
  initialCells: [number, number][] = [],
  speed: Ref<number> = shallowRef(10),
): GameOfLifeState & GameOfLifeActions {
  const initial = new Set<number>(initialCells.map(([x, y]) => cellKey(x, y)));
  const cells = shallowRef(new Set<number>(initial));
  const generation = shallowRef(0);
  const isRunning = shallowRef(false);
  let animFrameId: number | null = null;
  let lastTickTime = 0;

  function step(): void {
    const current = cells.value;
    const neighborCounts = new Map<number, number>();

    for (const key of current) {
      for (let i = 0; i < 8; i++) {
        const nk = (key + NEIGHBOR_DELTAS[i]) | 0;
        neighborCounts.set(nk, (neighborCounts.get(nk) ?? 0) + 1);
      }
    }

    const next = new Set<number>();
    for (const [key, count] of neighborCounts) {
      if (count === 3 || (count === 2 && current.has(key))) {
        next.add(key);
      }
    }

    cells.value = next;
    generation.value++;
  }

  function toggle(x: number, y: number): void {
    const key = cellKey(x, y);
    const s = cells.value;
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
    }
    triggerRef(cells);
  }

  function loop(timestamp: number): void {
    if (!isRunning.value) return;
    const msPerTick = 1000 / speed.value;
    if (timestamp - lastTickTime >= msPerTick) {
      step();
      lastTickTime = timestamp;
    }
    animFrameId = requestAnimationFrame(loop);
  }

  function play(): void {
    if (isRunning.value) return;
    isRunning.value = true;
    lastTickTime = performance.now();
    animFrameId = requestAnimationFrame(loop);
  }

  function pause(): void {
    isRunning.value = false;
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function reset(): void {
    pause();
    cells.value = new Set<number>(initial);
    generation.value = 0;
  }

  function clear(): void {
    pause();
    cells.value = new Set<number>();
    generation.value = 0;
  }

  function getExport(): string {
    return exportCells(cells.value);
  }

  function loadImport(str: string): void {
    pause();
    cells.value = importCells(str);
    generation.value = 0;
  }

  return {
    cells,
    generation,
    isRunning,
    step,
    toggle,
    play,
    pause,
    reset,
    clear,
    getExport,
    loadImport,
  };
}
