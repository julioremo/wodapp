<script lang="ts">
import { getChartCanvas } from "@wodapp/core";

interface Props {
  y: number;
  label?: string;
  labelPos?: "left" | "right";
  class?: string;
  margin?: number;
}

let {
  y,
  label,
  labelPos = "right",
  class: className = "text-foreground",
  margin,
}: Props = $props();

const canvas = getChartCanvas();
const labelMargin = $derived(margin ?? (canvas.width < 400 ? 0 : 8));
</script>

<g
  class="{className} pointer-events-none antialised"
  style="transition: opacity 500ms ease">
  <line
    x1={canvas.left}
    x2={canvas.right}
    y1={y}
    y2={y}
    stroke="currentColor"
    stroke-width="1" />

  {#if label}
    <text
      x={labelPos === "right"
        ? canvas.right - labelMargin
        : canvas.left + labelMargin}
      y={y - canvas.fontSize}
      dominant-baseline="middle"
      text-anchor={labelPos === "right" ? "end" : "start"}
      font-family="CMU Typewriter Text, monospace"
      font-size={canvas.fontSize}
      fill="currentColor"
      letter-spacing="0.08em"
      class="font-bold">
      {label}
    </text>
  {/if}
</g>
