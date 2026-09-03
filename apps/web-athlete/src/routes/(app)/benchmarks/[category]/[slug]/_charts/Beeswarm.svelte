<script lang="ts">
import { getChartCanvas } from "@wodapp/core";
import type { ScaleLinear, Simulation } from "d3";
import { forceCollide, forceSimulation, forceX, forceY } from "d3";
import { untrack } from "svelte";
import type { ProcessedPeer, SimulatedNode } from "../distribution.types";
import Hairline from "./Hairline.svelte";

let {
  data,
  yScale,
  userStrokeClass = "stroke-foreground",
  peerStrokeClass = "stroke-foreground",
  axisStrokeClass = "stroke-grey-400 dark:stroke-grey-600",
  maleFillClass = "fill-tomato-400 dark:fill-tomato-700",
  femaleFillClass = "fill-azure-400 dark:fill-azure-600",
  defaultFillClass = "fill-grey-400 dark:fill-grey-700",
  nodeRadius = 7,
  userNodeRadius = 12,
}: {
  data: ProcessedPeer[];
  yScale: ScaleLinear<number, number>;
  userStrokeClass?: string;
  peerStrokeClass?: string;
  axisStrokeClass?: string;
  maleFillClass?: string;
  femaleFillClass?: string;
  defaultFillClass?: string;
  nodeRadius?: number;
  userNodeRadius?: number;
} = $props();

const canvas = getChartCanvas();

let nodes = $state<SimulatedNode[]>([]);
let simulation: Simulation<SimulatedNode, undefined> | null = null;

$effect(() => {
  if (canvas.width === 0 || canvas.height === 0 || data.length === 0) return;

  const cx = canvas.cx;
  const currentData = data;
  const scale = yScale;

  untrack(() => {
    const currentPositions = new Map(nodes.map((n) => [n.id, n.x]));

    const snapshots: SimulatedNode[] = currentData.map((d) => {
      const nameStr = d.isUser ? "ME" : (d.display_name?.toUpperCase() ?? "");
      const valStr = `(${d.val.toFixed(0)}${canvas.unit})`;

      return {
        ...d,
        x: currentPositions.get(d.id) ?? cx,
        y: scale(d.val),
        r: d.isUser ? userNodeRadius : nodeRadius,
        label: `${nameStr} ${valStr}`,
      };
    });

    simulation = forceSimulation(snapshots)
      .force("y", forceY<SimulatedNode>((d) => scale(d.val)).strength(1))
      .force("x", forceX<SimulatedNode>(cx).strength(0.1))
      .force(
        "collide",
        forceCollide((d) => d.r + 1),
      )
      .stop();

    simulation.tick(300);
    nodes = [...snapshots];
  });
});

let userNode = $derived(nodes.find((n) => n.isUser));
let userY = $derived(userNode ? userNode.y : null);

let hoveredId = $state<string | null>(null);
let hoveredNode = $derived(
  hoveredId ? (nodes.find((n) => n.id === hoveredId) ?? null) : null,
);
let hoveredY = $derived(hoveredNode ? hoveredNode.y : null);

const bh = 60;
const zx = $derived(canvas.cx);
const zy = $derived.by(() => {
  const currentRange = yScale.range();
  return currentRange.length === 3 ? currentRange[1] : 0;
});
const breakY = $derived(zy - bh / 2);
const breakH = 4;
const breakT = $derived(breakY + breakH);
const breakB = $derived(breakY - breakH);
const breakW = 5;
const breakZ = 2;
</script>

{#snippet circleNode(
  node: SimulatedNode,
  strokeClass: string = "stroke-transparent",
  strokeOpacity: number = 1,
)}
  <!-- Images in SVG circles require a clip path to be perfectly round -->
  {#if node.avatar_url}
    <image
      href={node.avatar_url}
      x={node.x - node.r}
      y={node.y - node.r}
      width={node.r * 2}
      height={node.r * 2}
      clip-path="url(#avatar-clip-{node.id})"
      preserveAspectRatio="xMidYMid slice" />
  {/if}
  <circle
    cx={node.x}
    cy={node.y}
    r={node.r}
    stroke-width="1"
    stroke-opacity={strokeOpacity}
    class="{node.avatar_url
      ? 'fill-transparent'
      : node.gender === 'male'
        ? maleFillClass
        : node.gender === 'female'
          ? femaleFillClass
          : defaultFillClass} {strokeClass} cursor-pointer transition-transform transition-opacity ease focus:ring-0 focus:outline-none duration-500"
    role="button"
    tabindex="0"
    aria-label="{node.display_name ?? 'Anonymous Athlete'}: {node.val.toFixed(
      0,
    )} {canvas.unit}"
    onmouseenter={() => (hoveredId = node.id)}
    onmouseleave={() => (hoveredId = null)} />
{/snippet}

<g class="beeswarm">
  <defs>
    {#each nodes as node (node.id)}
      {#if node.avatar_url}
        <clipPath id="avatar-clip-{node.id}">
          <circle cx={node.x} cy={node.y} r={node.r} />
        </clipPath>
      {/if}
    {/each}
  </defs>

  <!-- vertical line -->
  <!-- <line
    x1={zx}
    x2={zx}
    y1={canvas.margin.top}
    y2={canvas.height - canvas.margin.bottom}
    class="stroke-muted opacity-50 stroke-1"
    stroke-dasharray="4 4" /> -->

  <g class={axisStrokeClass} stroke-width="1">
    <!-- axis line: bottom segment -->
    <line x1={zx} x2={zx} y1={yScale(0)} y2={breakT} />
    <!-- axis line: top segment -->
    <line x1={zx} x2={zx} y1={breakB} y2={canvas.margin.top} />
    <!-- break symbol -->
    <line
      x1={zx + breakW}
      x2={zx - breakW}
      y1={breakT + breakZ}
      y2={breakT - breakZ} />
    <line
      x1={zx + breakW}
      x2={zx - breakW}
      y1={breakB + breakZ}
      y2={breakB - breakZ} />
    <!-- <polyline
      points="
      {zx + breakW},{breakT}
      {zx - breakW},{breakT}
      {zx + breakW},{breakB}
      {zx - breakW},{breakB}
    "
      fill="none" /> -->
  </g>

  <!-- LAYER 1: Peers -->
  {#each nodes as node (node.id)}
    {@render circleNode(node)}
  {/each}

  <!-- LAYERS 2 & 3: user line, then node -->
  {#if userNode && userY != null}
    {@const isFaded = hoveredY != null && Math.abs(userY - hoveredY) < 20}
    <Hairline
      y={userY}
      label={userNode.label}
      class="text-foreground transition-opacity duration-500 {isFaded
        ? 'opacity-10'
        : 'opacity-100'}" />
    {@render circleNode(userNode, userStrokeClass, isFaded ? 0.1 : 1)}
  {/if}

  <!-- LAYERS 4 & 5: hovered line, then node -->
  {#if hoveredNode && hoveredY != null}
    <g pointer-events="none">
      <Hairline
        y={hoveredY}
        label={hoveredNode.label}
        class="text-foreground" />

      {@render circleNode(hoveredNode, peerStrokeClass)}
    </g>
  {/if}
</g>
