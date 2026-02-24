import { shallowRef, type Ref, watch, onScopeDispose } from "vue";
import { keyX, keyY } from "~/composables/useGameOfLife";

export interface Viewport {
  offsetX: Ref<number>;
  offsetY: Ref<number>;
  cellSize: Ref<number>;
}

export function screenToCell(
  px: number,
  py: number,
  canvasW: number,
  canvasH: number,
  offsetX: number,
  offsetY: number,
  cellSize: number,
): [number, number] {
  return [
    Math.floor((px - canvasW / 2) / cellSize + offsetX),
    Math.floor((py - canvasH / 2) / cellSize + offsetY),
  ];
}

export function useCanvasRenderer(
  canvas: Ref<HTMLCanvasElement | null>,
  cells: Ref<Set<number>>,
  viewport: Viewport,
) {
  let animFrameId: number | null = null;
  let observer: ResizeObserver | null = null;

  let cachedBg = "";
  let cachedCell = "";
  let cachedGrid = "";
  let styleFrameCount = 0;
  const STYLE_REFRESH_INTERVAL = 60;

  const fps = shallowRef(0);
  let fpsFrames = 0;
  let fpsLastTime = 0;

  function resize() {
    const el = canvas.value;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    el.width = rect.width * dpr;
    el.height = rect.height * dpr;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
  }

  function draw() {
    const el = canvas.value;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const w = el.width;
    const h = el.height;
    const dpr = window.devicePixelRatio || 1;
    const cs = viewport.cellSize.value * dpr;
    const ox = viewport.offsetX.value;
    const oy = viewport.offsetY.value;

    // Cache computed styles, refresh periodically for theme changes
    if (styleFrameCount % STYLE_REFRESH_INTERVAL === 0) {
      const style = getComputedStyle(el);
      cachedBg = style.getPropertyValue("--vp-c-bg").trim() || "#ffffff";
      cachedCell = style.getPropertyValue("--vp-c-text-1").trim() || "#000000";
      cachedGrid = style.getPropertyValue("--vp-c-divider").trim() || "#e2e2e3";
    }
    styleFrameCount++;

    ctx.fillStyle = cachedBg;
    ctx.fillRect(0, 0, w, h);

    // Visible cell range
    const minCX = Math.floor(ox - w / (2 * cs)) - 1;
    const maxCX = Math.ceil(ox + w / (2 * cs)) + 1;
    const minCY = Math.floor(oy - h / (2 * cs)) - 1;
    const maxCY = Math.ceil(oy + h / (2 * cs)) + 1;

    // Draw grid lines when zoomed in enough
    if (cs >= 16 * dpr) {
      ctx.strokeStyle = cachedGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let cx = minCX; cx <= maxCX; cx++) {
        const px = (cx - ox) * cs + w / 2;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
      }
      for (let cy = minCY; cy <= maxCY; cy++) {
        const py = (cy - oy) * cs + h / 2;
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
      }
      ctx.stroke();
    }

    // Draw live cells — batched into a single path + fill
    ctx.fillStyle = cachedCell;
    const gap = cs >= 16 * dpr ? 1 * dpr : 0;
    const size = cs - gap;
    ctx.beginPath();
    for (const key of cells.value) {
      const cx = keyX(key);
      const cy = keyY(key);
      if (cx < minCX || cx > maxCX || cy < minCY || cy > maxCY) continue;
      const px = (cx - ox) * cs + w / 2 + gap;
      const py = (cy - oy) * cs + h / 2 + gap;
      ctx.rect(px, py, size, size);
    }
    ctx.fill();
  }

  function loop(timestamp: number) {
    fpsFrames++;
    if (timestamp - fpsLastTime >= 1000) {
      fps.value = fpsFrames;
      fpsFrames = 0;
      fpsLastTime = timestamp;
    }
    draw();
    animFrameId = requestAnimationFrame(loop);
  }

  function startRendering() {
    resize();
    const el = canvas.value;
    if (el?.parentElement) {
      observer = new ResizeObserver(() => resize());
      observer.observe(el.parentElement);
    }
    animFrameId = requestAnimationFrame(loop);
  }

  function stopRendering() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // Auto-start when canvas becomes available
  const stopWatch = watch(canvas, (el) => {
    if (el) {
      startRendering();
      stopWatch();
    }
  });

  onScopeDispose(stopRendering);

  return { startRendering, stopRendering, resize, fps };
}
