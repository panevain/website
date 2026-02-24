<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useGameOfLife } from "~/composables/useGameOfLife";
import { useCanvasRenderer } from "~/composables/useCanvasRenderer";
import { useCanvasInteraction } from "~/composables/useCanvasInteraction";

const props = withDefaults(
  defineProps<{
    initialCells?: [number, number][];
    center?: [number, number];
    autoplay?: boolean;
    speed?: number;
    cellSize?: number;
    width?: string;
    height?: string;
  }>(),
  {
    initialCells: () => [],
    center: undefined,
    autoplay: false,
    speed: 10,
    cellSize: 20,
    width: "100%",
    height: "100%",
  },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const speedRef = ref(props.speed);
const currentCellSize = ref(props.cellSize);
const initialCenter = props.center ?? [0, 0];
const offsetX = ref(initialCenter[0]);
const offsetY = ref(initialCenter[1]);

const {
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
} = useGameOfLife(props.initialCells, speedRef);

if (props.autoplay) {
  onMounted(() => play());
}

const viewport = { offsetX, offsetY, cellSize: currentCellSize };

const { fps } = useCanvasRenderer(canvasRef, cells, viewport);
const { mouseX, mouseY } = useCanvasInteraction(
  canvasRef,
  viewport,
  (x: number, y: number) => toggle(x, y),
);

const zoomPercent = computed(
  () => Math.round((currentCellSize.value / props.cellSize) * 100) + "%",
);

function resetView() {
  offsetX.value = initialCenter[0];
  offsetY.value = initialCenter[1];
  currentCellSize.value = props.cellSize;
}

async function handleExport() {
  const str = getExport();
  await navigator.clipboard.writeText(str);
}

function handleImport() {
  const str = prompt("Paste board string:");
  if (str != null && str.trim()) {
    loadImport(str);
  }
}
</script>

<template>
  <div
    :class="$style.wrapper"
    :style="{ width: props.width, height: props.height }"
  >
    <canvas ref="canvasRef" :class="$style.canvas" />
    <div :class="$style.hud">
      <span v-if="mouseX !== null">{{ mouseX }}, {{ mouseY }}</span>
      <span>{{ zoomPercent }}</span>
    </div>
    <div :class="$style.stats">
      <span>gen {{ generation }}</span>
      <span>{{ cells.size }} cells</span>
      <span>{{ fps }} fps</span>
    </div>
    <div :class="$style.controls">
      <div :class="$style.group">
        <button
          :class="[$style.iconBtn, isRunning && $style.active]"
          :title="isRunning ? 'Pause' : 'Play'"
          @click="isRunning ? pause() : play()"
        >
          <!-- Play / Pause icon -->
          <svg v-if="!isRunning" width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 2l10 6-10 6z" fill="currentColor" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16">
            <rect
              x="3"
              y="2"
              width="4"
              height="12"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="9"
              y="2"
              width="4"
              height="12"
              rx="1"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          :class="$style.iconBtn"
          :disabled="isRunning"
          title="Step"
          @click="step"
        >
          <!-- Step-forward icon -->
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 2l7 6-7 6z" fill="currentColor" />
            <rect
              x="11"
              y="2"
              width="3"
              height="12"
              rx="1"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.group">
        <button :class="$style.iconBtn" title="Reset cells" @click="reset">
          <!-- Rewind/reset icon -->
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M3 8a5 5 0 1 1 1.5 3.6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M1 7l2.2 2.5L5.5 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button :class="$style.iconBtn" title="Clear all cells" @click="clear">
          <!-- Trash/clear icon -->
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M5 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M2.5 4h11M4 4l.7 9.1a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button :class="$style.iconBtn" title="Reset view" @click="resetView">
          <!-- Crosshair / re-center icon -->
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M8 2v3M8 11v3M2 8h3M11 8h3"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.speedGroup">
        <svg
          :class="$style.speedIcon"
          width="14"
          height="14"
          viewBox="0 0 16 16"
        >
          <path
            d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm0 2v3.3l2.5 1.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <input
          v-model.number="speedRef"
          type="range"
          min="1"
          max="60"
          :class="$style.slider"
        />
      </div>
      <div :class="$style.divider" />
      <div :class="$style.group">
        <button
          :class="$style.iconBtn"
          title="Export to clipboard"
          @click="handleExport"
        >
          <!-- Share/export icon -->
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M8 2v8M5 5l3-3 3 3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3 10v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          :class="$style.iconBtn"
          title="Import from string"
          @click="handleImport"
        >
          <!-- Download/import icon -->
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M8 2v8M5 7l3 3 3-3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3 10v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style module lang="css">
.wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}

.controls {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  background: color-mix(in srgb, var(--vp-c-bg) 85%, transparent);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  user-select: none;
}

.group {
  display: flex;
  gap: 2px;
}

.iconBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.iconBtn:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.iconBtn:active:not(:disabled) {
  background: var(--vp-c-bg-alt);
}

.iconBtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.iconBtn.active {
  color: var(--vp-c-brand-1);
}

.divider {
  width: 1px;
  height: 18px;
  background: var(--vp-c-divider);
  flex-shrink: 0;
}

.hud {
  position: absolute;
  top: 8px;
  left: 10px;
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-family: monospace;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--vp-c-bg) 75%, transparent);
  padding: 2px 8px;
  border-radius: 4px;
  pointer-events: none;
  user-select: none;
}

.speedGroup {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}

.speedIcon {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.slider {
  width: 64px;
  height: 4px;
  cursor: pointer;
  accent-color: var(--vp-c-brand-1);
}

.stats {
  position: absolute;
  top: 8px;
  right: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11px;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-3);
  background: color-mix(in srgb, var(--vp-c-bg) 75%, transparent);
  padding: 4px 8px;
  border-radius: 4px;
  pointer-events: none;
  user-select: none;
  line-height: 1.4;
}
</style>
