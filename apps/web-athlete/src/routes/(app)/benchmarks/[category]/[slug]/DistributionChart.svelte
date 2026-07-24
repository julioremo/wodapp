<script lang="ts">
import { ChartCanvas, setChartCanvas } from "@wodapp/core";
import * as d3 from "d3";
import Beeswarm from "./Beeswarm.svelte";
import type { HairlineArgs, Peer, StandardsSet } from "./distribution.types";
import { LEVEL_KEYS } from "./distribution.types";
import StreghtLevelsBg from "./StreghtLevelsBg.svelte";

interface Props {
  peers: Peer[];
  standardsSet: StandardsSet;
  userId: string;
}
let { peers = [], standardsSet, userId }: Props = $props();

const canvas = new ChartCanvas();
setChartCanvas(canvas);

// Extract highest PR per peer and filter out invalid data
let processedPeers = $derived(
  peers
    .map((peer) => {
      if (!peer.benchmarks || peer.benchmarks.length === 0) return null;

      const pr = peer.benchmarks.reduce((max, current) => {
        const currentVal = Number(current.estimated_1rm ?? current.score);
        const maxVal = Number(max.estimated_1rm ?? max.score);
        return currentVal > maxVal ? current : max;
      });

      return {
        ...peer,
        val: Number(pr.estimated_1rm ?? pr.score),
        isUser: peer.id === userId,
      };
    })
    .filter((p) => p !== null),
);

const peerValues: number[] = $derived(processedPeers.map((d) => d.val));

const standardValues: number[] = $derived(
  Object.values(standardsSet)
    .flatMap((std) => (std ? LEVEL_KEYS.map(({ key }) => std[key]) : []))
    .filter((val): val is number => typeof val === "number"),
);

const hasData = $derived(peerValues.length > 0 || standardValues.length > 0);

// 2. The Vertical Scale (higher score = lower pixel Y value)
let yScale = $derived.by(() => {
  if (!hasData || canvas.height === 0) return d3.scaleLinear();

  const allValues = [...peerValues, ...standardValues];
  const absoluteMin = d3.min(allValues) as number;
  const absoluteMax = d3.max(allValues) as number;

  // 2. Set floor just below the lowest point of either dataset
  const paddingFloor = (absoluteMax - absoluteMin) * 0.05 || 10;
  const floor = Math.max(0, absoluteMin - paddingFloor);
  const maxPeer = d3.max(peerValues) as number;

  if (standardValues.length === 0) {
    return d3
      .scaleLinear()
      .domain([floor, maxPeer + paddingFloor])
      .range([canvas.bottom, canvas.top]);
  }

  const elite1 = standardsSet.myGender?.level_elite_kg ?? 0;
  const elite2 = standardsSet.otherGender?.level_elite_kg ?? 0;
  const maxElite = Math.max(elite1, elite2);

  const wr1 = standardsSet.myGender?.level_world_record_kg ?? 0;
  const wr2 = standardsSet.otherGender?.level_world_record_kg ?? 0;

  // If no WR exists, create an artificial ceiling above Elite
  const maxWr = Math.max(wr1, wr2) || maxElite * 1.15;
  // Guarantee the domain doesn't cut off a peer who lifts more than the WR
  const topDomain = Math.max(maxWr, maxPeer + paddingFloor);

  const tailVisualHeight = 60;
  // Piecewise scale: regular from floor to Elite, squished from Elite to WR/MaxPeer
  return d3
    .scaleLinear()
    .domain([floor, maxElite, topDomain])
    .range([canvas.height, canvas.top + tailVisualHeight, canvas.top]);
});
</script>

{#snippet hairline({
  y,
  label = "",
  color = "black",
  labelPos = "right",
  lineClass,
  textClass,
}: HairlineArgs)}
  <line
    x1={canvas.left - 8}
    x2={canvas.right + 8}
    y1={y}
    y2={y}
    stroke={color}
    stroke-width="0.5"
    class={lineClass} />
  {#if label}
    <text
      x={labelPos === "right" ? canvas.right - 8 : canvas.left + 8}
      y={y - canvas.fontSize}
      dominant-baseline="middle"
      text-anchor={labelPos === "right" ? "end" : "start"}
      font-family="CMU Typewriter Text, monospace"
      font-size={canvas.fontSize}
      fill={color}
      letter-spacing="0.08em"
      class={textClass}>
      {label}
    </text>
  {/if}
{/snippet}

<div
  class="w-full relative rounded-none"
  style="height: calc(100vh - 12rem);"
  bind:clientWidth={canvas.width}
  bind:clientHeight={canvas.height}>
  {#if canvas.width > 0 && canvas.height > 0}
    <svg
      role="figure"
      width={canvas.width}
      height={canvas.height}
      class="absolute inset-0 overflow-visible">
      // Context drills down outer dimension props
      <StreghtLevelsBg {standardsSet} {yScale} {hairline} />
      <Beeswarm data={processedPeers} {yScale} {hairline} />
    </svg>
  {/if}
</div>
