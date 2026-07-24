<script lang="ts">
import { getChartCanvas } from "@wodapp/core";
import type { ScaleLinear, Simulation } from "d3";
import { forceCollide, forceSimulation, forceX, forceY } from "d3";
import type { Snippet } from "svelte";
import { untrack } from "svelte";
import type {
  HairlineArgs,
  ProcessedPeer,
  SimulatedNode,
} from "./distribution.types";

// ── props ─────────────────────────────────────────────
interface Props {
  data: ProcessedPeer[];
  yScale: ScaleLinear<number, number>;
  hairline: Snippet<[HairlineArgs]>;
  userStrokeColor?: string;
  peerStrokeColor?: string;
  nodeRadius?: number;
  userNodeRadius?: number;
}

let {
  data,
  yScale,
  hairline,
  userStrokeColor = "var(--color-grey-900)",
  peerStrokeColor = "var(--color-grey-900)",
  nodeRadius = 7,
  userNodeRadius = 12,
}: Props = $props();

const canvas = getChartCanvas();

let nodes = $state<SimulatedNode[]>([]);
let simulation: Simulation<SimulatedNode, undefined> | null = null;

$effect(() => {
  // Rebuild only if layout changes (width/height/scale)
  // New nodes are injected into the existing simulation
  if (canvas.width === 0 || canvas.height === 0 || data.length === 0) return;

  const cx = canvas.cx;
  const width = canvas.width;
  const height = canvas.height;
  const currentData = data;
  const scale = yScale;

  if (width === 0 || height === 0 || currentData.length === 0) return;

  untrack(() => {
    const currentPositions = new Map(nodes.map((n) => [n.id, n.x]));

    const snapshots: SimulatedNode[] = currentData.map((d) => ({
      ...d,
      x: currentPositions.get(d.id) ?? cx,
      y: scale(d.val),
      r: d.isUser ? userNodeRadius : nodeRadius,
      label: `${d.isUser ? "ME" : (d.display_name?.toUpperCase() ?? "Athlete")} (${d.val.toFixed(0)}${canvas.unit})`,
    }));

    simulation = forceSimulation(snapshots)
      .force("y", forceY((d) => scale(d.val)).strength(1))
      .force("x", forceX(cx).strength(0.1))
      .force(
        "collide",
        forceCollide((d) => d.r + 1),
      )
      .stop();

    simulation.tick(300);
    nodes = [...snapshots].sort((a, b) => +a.isUser - +b.isUser);
  });
});

// ── derived ───────────────────────────────────────────
let userNode = $derived(nodes.find((n) => n.isUser));
let userY = $derived(userNode ? userNode.y : null);

// ── tooltip state ─────────────────────────────────────
let hoveredId = $state<string | null>(null);
let hoveredNode = $derived(
  hoveredId ? (nodes.find((n) => n.id === hoveredId) ?? null) : null,
);
let hoveredY = $derived(hoveredNode ? hoveredNode.y : null);

// break point sign
const bh = 60;
const zx = $derived(canvas.cx);
const zy = $derived.by(() => {
  const currentRange = yScale.range();
  // If the range has 3 values, the squish point is the middle one
  if (currentRange.length === 3) {
    return currentRange[1];
  }
  return 0;
});
</script>

<g class="beeswarm">
  <!-- vertical line -->
  <!-- <line
    x1={zx}
    y1={canvas.margin.top}
    x2={zx}
    y2={height - canvas.margin.bottom}
    class="stroke-muted opacity-50 stroke-1"
    stroke-dasharray="4 4" /> -->

  <!-- axis line: bottom segment -->
  <line
    x1={zx}
    y1={yScale(0)}
    x2={zx}
    y2={zy - bh / 2 + 5 * 1.5}
    stroke="#c8c2b5"
    stroke-width="1" />

  <!-- zigzag break symbol -->
  <!-- <polyline
  points="
    {zx + 5},{zy - bh / 2 + 5*1.5}
    {zx - 5},{zy - bh / 2 + 5*1.5}
    {zx + 5},{zy - bh / 2 - 5*1.5}
    {zx - 5},{zy - bh / 2 - 5*1.5}
  "
  fill="none"
  stroke="#8a857d"
  stroke-width="1"
/> -->

  <line
    x1={zx + 5}
    x2={zx - 5}
    y1={zy - bh / 2 + 5 + 2}
    y2={zy - bh / 2 + 5 - 2}
    stroke="#8a857d"
    stroke-width="1" />

  <line
    x1={zx + 5}
    x2={zx - 5}
    y1={zy - bh / 2 - 5 + 2}
    y2={zy - bh / 2 - 5 - 2}
    stroke="#8a857d"
    stroke-width="1" />

  <!-- axis line: top segment -->
  <line
    x1={zx}
    y1={zy - bh / 2 - 5 * 1.5}
    x2={zx}
    y2={canvas.margin.top}
    stroke="#c8c2b5"
    stroke-width="1" />

  <!-- user percentile hairline -->
  {#if userNode && userY}
    <g
      opacity={hoveredY && Math.abs(userY - hoveredY) < 20 ? 0.1 : 1}
      style="transition: opacity 500ms ease">
      {@render hairline({
        y: userY,
        label: userNode.label,
        color: userStrokeColor,
        textClass: "font-bold",
        lineClass: "stroke-1",
      })}
    </g>
  {/if}
  <!-- peers percentile hairline -->
  {#if hoveredNode && hoveredY}
    {@render hairline({
      y: hoveredY,
      label: hoveredNode.label,
      color: peerStrokeColor,
      textClass: "font-bold",
      lineClass: "stroke-1",
    })}
  {/if}

  <!-- dots -->
  {#each nodes as node (node.id)}
    <!-- <g
      style="transform: translate({node.x}px, {node.y}px);"
      class="cursor-pointer transition-transform ease-out focus:ring-0 focus:outline-none duration-500"
      stroke={hoveredId === node.id ? peerStrokeColor : "transparent"}
      role="button"
      tabindex="0"
      aria-label="{node.display_name ?? 'Athlete'}: {node.val.toFixed(0)} {canvas.unit}"
      onmouseenter={() => hoveredId = node.id}
      onmouseleave={() => hoveredId = null}> -->
    <circle
      cx={node.x}
      cy={node.y}
      r={node.r}
      stroke-width="1"
      stroke={hoveredId === node.id ? peerStrokeColor : "transparent"}
      class="{node.emoji
        ? 'fill-white'
        : node.gender === 'male'
          ? 'fill-tomato-400'
          : 'fill-azure-400'} cursor-pointer transition-transform ease-out focus:ring-0 focus:outline-none duration-500"
      role="button"
      tabindex="0"
      aria-label="{node.display_name ?? 'Athlete'}: {node.val.toFixed(
        0,
      )} {canvas.unit}"
      onmouseenter={() => (hoveredId = node.id)}
      onmouseleave={() => (hoveredId = null)}></circle>
    {#if node.emoji}
      <text
        x={node.x}
        y={node.y + node.r * 0.1}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={node.r * 2}
        class="cursor-pointer transition-transform ease-out focus:ring-0 focus:outline-none duration-500"
        stroke={hoveredId === node.id ? peerStrokeColor : "transparent"}
        role="button"
        tabindex="0"
        aria-label="{node.display_name ?? 'Athlete'}: {node.val.toFixed(
          0,
        )} {canvas.unit}"
        onmouseenter={() => (hoveredId = node.id)}
        onmouseleave={() => (hoveredId = null)}>
        {node.emoji}
      </text>
    {/if}
  {/each}
</g>
