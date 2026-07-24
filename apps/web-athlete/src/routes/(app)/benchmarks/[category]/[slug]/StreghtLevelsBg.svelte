<script lang="ts">
import { getChartCanvas } from "@wodapp/core";
import type { MovementStandard } from "@wodapp/types";
import type { ScaleLinear } from "d3";
import type { Snippet } from "svelte";
import type { HairlineArgs, StandardsSet } from "./distribution.types";
import { LEVEL_KEYS } from "./distribution.types";

// ── props ─────────────────────────────────────────────
interface Props {
  standardsSet: StandardsSet;
  yScale: ScaleLinear<number, number>;
  hairline?: Snippet<[HairlineArgs]>;
}

let { standardsSet, yScale, hairline }: Props = $props();

const canvas = getChartCanvas();

const LEVEL_COLORS: Record<string, string> = {
  Untrained: "rgba(140,100,100,0.12)",
  Novice: "rgba(100,140,100,0.12)",
  Intermediate: "rgba(70,120,160,0.12)",
  Advanced: "rgba(90,60,160,0.12)",
  Elite: "rgba(139,26,26,0.12)",
  "World record": "rgba(139,26,26,0.06)"
};

let gender: "myGender" | "otherGender" = "myGender";
let activeStandard: MovementStandard | null = $derived(standardsSet[gender]);

interface LevelLine {
  label: string;
  value: number;
  y: number;
  color: string;
}

// ── level lines from active standard ─────────────────
let levelLines: LevelLine[] = $derived([
  ...LEVEL_KEYS.map(({ label, key }): LevelLine | null => {
    const value = (activeStandard?.[key] as number) ?? null;

    if (value == null) return null;

    return { label, value, y: yScale(value), color: LEVEL_COLORS[label] };
  }).filter((l): l is LevelLine => l !== null)
]);

const zy = $derived.by(() => {
  const currentRange = yScale.range();
  // If the range has 3 values, the squish point is the middle one
  if (currentRange.length === 3) {
    return currentRange[1];
  }
  return 0;
});
const bh = 60;
</script>

<defs>
  <pattern
    id="hatch-elite"
    patternUnits="userSpaceOnUse"
    width="4"
    height="4"
    patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="4" stroke={LEVEL_COLORS.Elite} stroke-width="2" opacity="0.4" />
  </pattern>

  <clipPath id="chart-area-clip">
    <rect x={canvas.left} y={canvas.top} width={canvas.innerWidth} height={canvas.innerHeight} />
  </clipPath>
</defs>

<g class="strength-levels-bg">
  <!-- ── direction hint ──────────────────────────────── -->
  <text
    x={canvas.cx}
    y={canvas.top-canvas.margin.top}
    text-anchor="middle"
    font-family="CMU Typewriter Text, monospace"
    font-size="8"
    fill="#8a857d"
    letter-spacing="0.08em">
    ↑ HEAVIER
  </text>

  <!-- ── level zones ─────────────────────────────────── -->
  {#each levelLines as line, i (line.label)}
    {@const prevY = i === 0 ? canvas.height : levelLines[i - 1].y}
    {@const zoneH = prevY - line.y}
    {@const midY  = line.y + zoneH / 2}

    <rect
      x={0}
      y={line.y}
      width={canvas.width}
      height={zoneH}
      fill={line.color}
      opacity="0.5"
      class="transition-all duration-500 ease-out" />
  <!-- zone label centred vertically in the band -->
  <!-- <text
      x={canvas.right - 60}
      y={midY}
      dominant-baseline="middle"
      text-anchor="middle"
      font-family="CMU Typewriter Text, monospace"
      font-size="8"
      fill="#8a857d"
      letter-spacing="0.08em"
      opacity="0.8">
    </text>-->
  {/each}

  <!-- hatched discontinuity band -->
  <rect
    x={canvas.left}
    y={zy - bh*4/6}
    width={canvas.innerWidth}
    height={bh/3}
    fill="white"
    opacity="1" />
  <!-- paper-colored overlay to visually separate from zones below -->
  <rect
    x={canvas.left}
    y={zy - bh*4/6}
    width={canvas.innerWidth}
    height={bh/3}
    fill="url(#hatch-elite)" />

  <!-- ── level hairlines ─────────────────────────────── -->
  {#if hairline}
    {#each levelLines as line (line.label)}
      {#if line.y >= canvas.top && line.y <= canvas.bottom}
        {@render hairline({
          y: line.y, 
          label: `↑ ${line.label.toUpperCase()}  (${line.value.toFixed(0)}${canvas.unit})`, 
          color: "#8a857d",
          labelPos: "left",
          lineClass: "[stroke-dasharray:2,3]"
        })}
      {/if}
    {/each}
  {/if}
</g>
