<script lang="ts">
import { ChartCanvas, setChartCanvas } from "@wodapp/core";
import type { Benchmark } from "@wodapp/types";
import type { ScaleLinear } from "d3";
import * as d3 from "d3";
import { format } from "date-fns";
import type { Snippet } from "svelte";
import { backOut } from "svelte/easing";
import { fade, scale } from "svelte/transition";
import type { HairlineArgs } from "./distribution.types";

interface Props {
  history: Benchmark[];
  background?: Snippet<[ScaleLinear<number, number>, Snippet<[HairlineArgs]>]>;
}
let { history, background }: Props = $props();

const canvas = new ChartCanvas();
setChartCanvas(canvas);

let height = 200;

const config = {
  domainPaddingRatio: 0.15,
  animation: {
    fadeDuration: 400,
    scaleDuration: 400,
    lineBase: 500,
    lineMax: 3000,
    linePerPoint: 300,
  },
  style: {
    dotRadius: 3,
    strokeWidth: 3,
    tickLength: 7,
    dateOffset: 22,
    scoreOffset: -16,
    fontSizeSm: "14",
    fontSizeXs: "9",
    fontWeightBold: "bold",
  },
};

const getValue = (d: Benchmark) => d.estimated_1rm ?? d.score;

let xScale = $derived(
  d3
    .scaleTime()
    .domain(d3.extent(history, (d) => new Date(d.date)) as [Date, Date])
    .range([
      canvas.margin.left,
      Math.max(canvas.margin.left, canvas.width - canvas.margin.right),
    ]),
);

let yScale = $derived.by(() => {
  if (history.length === 0) return d3.scaleLinear();
  const values = history.map(getValue);
  const min = d3.min(values) as number;
  const max = d3.max(values) as number;

  // Calculate padding based on the spread of the data
  const amplitude = max - min;
  const padding =
    amplitude === 0 ? min * 0.05 : amplitude * config.domainPaddingRatio;

  return d3
    .scaleLinear()
    .domain([min - padding, max + padding])
    .range([canvas.bottom, canvas.top]);
});

let lineGenerator = $derived(
  d3
    .line<Benchmark>()
    .x((d) => xScale(new Date(d.date)))
    .y((d) => yScale(getValue(d)))
    .curve(d3.curveMonotoneX),
);

let maxVal = $derived(history.length ? Math.max(...history.map(getValue)) : 0);

let pathEl = $state<SVGPathElement | null>(null);
let pathLength = $state(0);
let drawProgress = $state(0);
let rafId: number;

$effect(() => {
  history; // explicit read to track changes
  if (canvas.width > 0 && pathEl) {
    pathLength = pathEl.getTotalLength();
    drawProgress = 0;
    const duration = Math.max(
      config.animation.lineBase,
      Math.min(
        config.animation.lineMax,
        history.length * config.animation.linePerPoint,
      ),
    );
    const t0 = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - t0) / duration);
      drawProgress = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    }
    rafId = requestAnimationFrame(step);
  }

  return () => cancelAnimationFrame(rafId);
});

let dashOffset = $derived(pathLength * (1 - drawProgress));
let currentLineX = $derived(
  canvas.margin.left +
    drawProgress * (canvas.width - canvas.margin.left - canvas.margin.right),
);

// Sweep right-to-left to prioritize the newest entries
let processedHistory = $derived.by(() => {
  if (!history.length || !canvas.width) return [];

  // PASS 1: Left-to-right (chronological) to find the start of each year
  let currentYear = -1;
  const basePoints = history.map((point, i) => {
    const dateObj = new Date(point.date);
    const year = dateObj.getFullYear();
    const isEarliestOfYear = year !== currentYear;
    currentYear = year;

    const val = getValue(point);
    const cx = xScale(dateObj);
    const cy = yScale(val);

    // --- SMART LABEL POSITIONING ---
    const prevCy = i > 0 ? yScale(getValue(history[i - 1])) : cy;
    const nextCy =
      i < history.length - 1 ? yScale(getValue(history[i + 1])) : cy;

    // Remember: smaller cy is HIGHER on screen.
    const isPeak = prevCy >= cy && nextCy >= cy;
    const isValley = prevCy <= cy && nextCy <= cy;
    const isIncreasing = prevCy > cy && cy > nextCy; // Line shoots up and right ( / )
    const isDecreasing = prevCy < cy && cy < nextCy; // Line shoots down and right ( \ )

    let labelDy = -14;
    let labelDx = 0;
    let labelAnchor = "middle";

    if (isPeak) {
      labelDy = -14;
    } else if (isValley) {
      labelDy = 22;
    } else if (isIncreasing) {
      // Push top-left to avoid the steep right-upward line
      labelDy = -10;
      labelDx = -8;
      labelAnchor = "end";
    } else if (isDecreasing) {
      // Push top-right to avoid the steep right-downward line
      labelDy = -10;
      labelDx = 8;
      labelAnchor = "start";
    }

    // Edge case safety: Prevent text from being pushed off the left/right canvas edges
    if (i === 0 && labelAnchor === "end") {
      labelDx = 0;
      labelAnchor = "middle";
    }
    if (i === history.length - 1 && labelAnchor === "start") {
      labelDx = 0;
      labelAnchor = "middle";
    }

    return {
      point,
      val,
      cx,
      cy,
      isMax: val === maxVal,
      dateObj,
      year,
      isEarliestOfYear,
      labelDx,
      labelDy,
      labelAnchor,
    };
  });

  // PASS 2: Right-to-left to determine visibility, prioritizing Newest + Start of Year
  const reversed = [...basePoints].reverse();
  const results: typeof basePoints & {
    showLabel?: boolean;
    showYear?: boolean;
  } = [];

  let lastLabelX = Infinity;
  let lastLabelIndex = -1; // Track index to retroactively hide labels if needed
  const minGap = 35;

  for (let i = 0; i < reversed.length; i++) {
    const p = reversed[i];
    let showLabel = false;
    let showYear = false;

    // Condition 1: It's the absolute newest point, or there is enough visual space
    if (i === 0 || lastLabelX - p.cx > minGap) {
      showLabel = true;
    }

    // Condition 2: It's the earliest point of a year
    if (p.isEarliestOfYear) {
      showLabel = true;
      showYear = true;

      // If forcing this year label causes a collision with the label to its right...
      if (lastLabelIndex > 0) {
        const prevP = results[lastLabelIndex];
        if (prevP.cx - p.cx <= minGap) {
          // Hide the label to the right (Notice: we protect index 0 from being hidden!)
          prevP.showLabel = false;
          prevP.showYear = false;
        }
      }
    }

    if (showLabel) {
      lastLabelX = p.cx;
      lastLabelIndex = i;
    }

    results.push({ ...p, showLabel, showYear });
  }

  // Reverse back to chronological order for the SVG drawing animation
  return results.reverse();
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
  class="w-full relative"
  style="height: {height}px;"
  bind:clientWidth={canvas.width}
  bind:clientHeight={canvas.height}>
  {#if canvas.width > 0}
    {#if history.length > 0}
      <svg
        role="figure"
        width={canvas.width}
        height={canvas.height}
        class="overflow-hidden absolute top-0 left-0">
        {#if background}
          {@render background(yScale, hairline)}
        {/if}
        <path
          bind:this={pathEl}
          d={lineGenerator(history)}
          fill="none"
          stroke="currentColor"
          stroke-width={config.style.strokeWidth}
          stroke-dasharray={pathLength || 10000}
          stroke-dashoffset={pathLength === 0 ? 10000 : dashOffset} />

        {#each processedHistory as item}
          {#if item.cx <= currentLineX + 2}
            <!-- Render the axis tick and label ONLY if there is room -->
            {#if item.showLabel}
              <g in:fade={{ duration: config.animation.fadeDuration }}>
                <line
                  x1={item.cx}
                  y1={canvas.bottom}
                  x2={item.cx}
                  y2={canvas.bottom + config.style.tickLength}
                  stroke="currentColor"
                  class="text-muted-foreground opacity-50"
                  stroke-width="1" />

                <text
                  x={item.cx}
                  y={canvas.bottom + config.style.dateOffset}
                  text-anchor="middle"
                  font-family="CMU Typewriter Text, monospace"
                  font-size={config.style.fontSizeXs}
                  class="fill-muted-foreground">
                  <tspan x={item.cx} dy="0"
                    >{format(item.dateObj, "d MMM")}</tspan>

                  {#if item.showYear}
                    <!-- Drop the year slightly lower and make it slightly dimmer -->
                    <tspan x={item.cx} dy="1.2em" opacity="0.7">
                      {format(item.dateObj, "yyyy")}
                    </tspan>
                  {/if}
                </text>
              </g>
            {/if}

            <!-- Always draw the data point and score, regardless of axis labels -->
            <circle
              cx={item.cx}
              cy={item.cy}
              r={config.style.dotRadius}
              fill="#ffffff"
              stroke="currentColor"
              stroke-width={config.style.strokeWidth}
              in:scale={{
                duration: config.animation.scaleDuration,
                easing: backOut,
              }}
              style="transform-origin: {item.cx}px {item.cy}px;" />

            <text
              in:fade={{ duration: config.animation.fadeDuration }}
              x={item.cx}
              y={item.cy + item.labelDy}
              text-anchor="middle"
              font-family="CMU Typewriter Text, monospace"
              font-size={config.style.fontSizeSm}
              font-weight={config.style.fontWeightBold}
              paint-order="stroke"
              stroke="#ffffff"
              stroke-width="3"
              stroke-linecap="butt"
              stroke-linejoin="miter"
              class={item.isMax ? "fill-red-500" : "fill-foreground"}>
              {Math.round(item.val)}
            </text>
          {/if}
        {/each}
      </svg>
    {:else}
      <div
        class="flex h-full items-center justify-center text-muted-foreground absolute inset-0">
        No data logged yet.
      </div>
    {/if}
  {/if}
</div>
