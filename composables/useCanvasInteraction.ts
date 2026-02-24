import { onMounted, onUnmounted, ref, type Ref } from "vue";
import { type Viewport, screenToCell } from "~/composables/useCanvasRenderer";

const CLICK_THRESHOLD = 4;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const MIN_CELL_SIZE = 4;
const MAX_CELL_SIZE = 80;

export function useCanvasInteraction(
  canvas: Ref<HTMLCanvasElement | null>,
  viewport: Viewport,
  onCellClick: (x: number, y: number) => void,
) {
  const mouseX = ref<number | null>(null);
  const mouseY = ref<number | null>(null);

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;
  let totalDrag = 0;

  function onPointerDown(e: PointerEvent) {
    const el = canvas.value;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startOffsetX = viewport.offsetX.value;
    startOffsetY = viewport.offsetY.value;
    totalDrag = 0;
  }

  function updateMouseCell(e: PointerEvent | MouseEvent) {
    const el = canvas.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (e.clientX - rect.left) * dpr;
    const py = (e.clientY - rect.top) * dpr;
    const [cx, cy] = screenToCell(
      px,
      py,
      el.width,
      el.height,
      viewport.offsetX.value,
      viewport.offsetY.value,
      viewport.cellSize.value * dpr,
    );
    mouseX.value = cx;
    mouseY.value = cy;
  }

  function onPointerMove(e: PointerEvent) {
    updateMouseCell(e);
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    totalDrag = Math.max(totalDrag, Math.abs(dx) + Math.abs(dy));
    viewport.offsetX.value = startOffsetX - dx / viewport.cellSize.value;
    viewport.offsetY.value = startOffsetY - dy / viewport.cellSize.value;
  }

  function onMouseLeave() {
    mouseX.value = null;
    mouseY.value = null;
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const el = canvas.value;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);

    if (totalDrag < CLICK_THRESHOLD) {
      const rect = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;
      const [cx, cy] = screenToCell(
        px,
        py,
        el.width,
        el.height,
        viewport.offsetX.value,
        viewport.offsetY.value,
        viewport.cellSize.value * dpr,
      );
      onCellClick(cx, cy);
    }
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const el = canvas.value;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    const oldCs = viewport.cellSize.value;
    const factor = e.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
    const newCs = Math.min(
      MAX_CELL_SIZE,
      Math.max(MIN_CELL_SIZE, oldCs * factor),
    );
    viewport.cellSize.value = newCs;

    // Adjust offset so the cell under the cursor stays fixed
    const w = el.width;
    const h = el.height;
    const cellXBefore = (mx - w / 2) / (oldCs * dpr) + viewport.offsetX.value;
    const cellYBefore = (my - h / 2) / (oldCs * dpr) + viewport.offsetY.value;
    const cellXAfter = (mx - w / 2) / (newCs * dpr) + viewport.offsetX.value;
    const cellYAfter = (my - h / 2) / (newCs * dpr) + viewport.offsetY.value;
    viewport.offsetX.value += cellXBefore - cellXAfter;
    viewport.offsetY.value += cellYBefore - cellYAfter;
  }

  let boundEl: HTMLCanvasElement | null = null;

  function bind() {
    const el = canvas.value;
    if (!el || el === boundEl) return;
    unbind();
    boundEl = el;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
  }

  function unbind() {
    if (!boundEl) return;
    boundEl.removeEventListener("pointerdown", onPointerDown);
    boundEl.removeEventListener("pointermove", onPointerMove);
    boundEl.removeEventListener("pointerup", onPointerUp);
    boundEl.removeEventListener("pointercancel", onPointerUp);
    boundEl.removeEventListener("mouseleave", onMouseLeave);
    boundEl.removeEventListener("wheel", onWheel);
    boundEl = null;
  }

  onMounted(bind);
  onUnmounted(unbind);

  return { mouseX, mouseY };
}
