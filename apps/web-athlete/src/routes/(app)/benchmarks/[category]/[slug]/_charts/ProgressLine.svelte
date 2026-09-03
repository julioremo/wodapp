<script lang="ts">
import * as d3 from "d3";
import { format } from "date-fns";
import { onMount } from "svelte";

// ── types ────────────────────────────────────────────
interface Entry {
  date: string;
  w: number;
  pr: boolean;
}

// ── props ────────────────────────────────────────────
interface Props {
  data?: Entry[];
  accentColor?: string;
}

let {
  data = [
    { date: "Jan '24", w: 100, pr: false },
    { date: "Feb '24", w: 105, pr: false },
    { date: "Apr '24", w: 105, pr: false },
    { date: "May '24", w: 110, pr: true },
    { date: "Jul '24", w: 108, pr: false },
    { date: "Sep '24", w: 115, pr: true },
    { date: "Nov '24", w: 120, pr: true },
    { date: "Feb '25", w: 122, pr: false },
    { date: "May '25", w: 125, pr: true }
  ],
  accentColor = "#8b1a1a"
}: Props = $props();

// ── layout ───────────────────────────────────────────
const PAD = { l: 28, r: 28, t: 42, b: 16 };
let svgEl: SVGSVGElement;
let width = $state(340);
const height = 140;

// ── scales (derived) ─────────────────────────────────
let xScale = $derived(
  d3
    .scalePoint()
    .domain(data.map((_, i) => String(i)))
    .range([PAD.l, width - PAD.r])
);

let yScale = $derived(
  d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.w)! - 8, d3.max(data, (d) => d.w)! + 8])
    .range([height - PAD.b, PAD.t])
);

let lineGen = $derived(
  d3
    .line<Entry>()
    .x((_, i) => xScale(String(i))!)
    .y((d) => yScale(d.w))
    .curve(d3.curveCatmullRom.alpha(0.5))
);

let pathD = $derived(lineGen(data) ?? "");

// ── animation state ───────────────────────────────────
let pathEl = $state<SVGPathElement | null>(null);
let pathLength = $state(0);
let drawProgress = $state(0); // 0 → 1
let visibleCount = $state(0); // how many dots revealed
let phase = $state<"idle" | "running" | "done">("idle");
let rafId: number;

function replay() {
  cancelAnimationFrame(rafId);
  drawProgress = 0;
  visibleCount = 0;
  phase = "running";

  // measure path after DOM update
  requestAnimationFrame(() => {
    if (pathEl) pathLength = pathEl.getTotalLength();
    const duration = 1800;
    const t0 = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - t0) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      drawProgress = ease;

      // reveal dots as line passes their x
      const lineX = PAD.l + ease * (width - PAD.l - PAD.r);
      let count = 0;
      data.forEach((_, i) => {
        if ((xScale(String(i)) ?? 0) <= lineX + 2) count = i + 1;
      });
      visibleCount = count;

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        phase = "done";
      }
    }
    rafId = requestAnimationFrame(step);
  });
}

onMount(() => {
  // measure initial width
  if (svgEl) width = svgEl.parentElement?.clientWidth ?? 340;

  // small delay so path is rendered before measuring
  setTimeout(replay, 120);

  return () => cancelAnimationFrame(rafId);
});

// ── label placement: alternate above/below, offset if close ──
function labelSide(i: number): "above" | "below" {
  return i % 2 === 0 ? "above" : "below";
}

// ── dash offset for draw-on animation ────────────────
let dashOffset = $derived(pathLength * (1 - drawProgress));

// ── PR current ────────────────────────────────────────
let currentPR = $derived(Math.max(...data.map((d) => d.w)));
</script>

<div class="w-full">
  <svg
    bind:this={svgEl}
    role="figure"
    class="w-full overflow-visible"
    viewBox={`0 0 ${width} ${height}`}
    style:height="{height}px">
    <defs>
      <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#8a857d" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#1a1814" stop-opacity="1" />
      </linearGradient>
    </defs>

    <!-- PR reference line -->
    <line
      x1={PAD.l}
      y1={yScale(currentPR)}
      x2={width - PAD.r}
      y2={yScale(currentPR)}
      stroke="#c8c2b5"
      stroke-width="0.5"
      stroke-dasharray="3 4" />

    <!-- animated path -->
    <path
      bind:this={pathEl}
      d={pathD}
      fill="none"
      stroke="url(#prog-grad)"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray={pathLength}
      stroke-dashoffset={dashOffset} />

    <!-- dots + labels -->
    {#each data as entry, i}
      {@const x = xScale(String(i)) ?? 0}
      {@const y = yScale(entry.w)}
      {@const side = labelSide(i)}
      {@const isLast = i === data.length - 1}
      {@const show = i < visibleCount}

      {#if show}
        <!-- tick -->
        <line
          x1={x}
          y1={side === 'above' ? y - (entry.pr ? 9 : 6) : y + (entry.pr ? 9 : 6)}
          x2={x}
          y2={side === 'above' ? y - 17 : y + 17}
          stroke="#c8c2b5"
          stroke-width="0.5" />

        <!-- weight label -->
        <text
          {x}
          y={side === 'above' ? y - 19 : y + 24}
          text-anchor="middle"
          font-family="CMU Typewriter Text, monospace"
          font-size={entry.pr ? 10 : 9}
          font-weight={entry.pr ? 'bold' : 'normal'}
          fill={entry.pr ? (isLast ? accentColor : '#1a1814') : '#8a857d'}>
          {entry.w}
        </text>

        <!-- dot -->
        <circle
          cx={x}
          cy={y}
          r={isLast ? 6 : entry.pr ? 4.5 : 3}
          fill={isLast ? accentColor : entry.pr ? '#1a1814' : '#f5f2eb'}
          stroke={entry.pr ? (isLast ? accentColor : '#1a1814') : '#8a857d'}
          stroke-width={entry.pr ? 1.5 : 1} />

        <!-- pulse ring on final dot -->
        {#if isLast && phase === 'done'}
          <circle
            cx={x}
            cy={y}
            r="6"
            fill="none"
            stroke={accentColor}
            stroke-width="1"
            class="pulse-ring" />
        {/if}
      {/if}
    {/each}
  </svg>

  <!-- replay -->
  <!-- <button
    onclick={replay}
    class="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#8a857d] hover:text-[#1a1814] transition-colors bg-transparent border-none cursor-pointer p-0">
    <span class="text-[11px]">↺</span>
    Replay
  </button> -->
</div>

<style lang="css">
@keyframes pulse-out {
  0% {
    r: 6;
    opacity: 0.7;
  }
  100% {
    r: 20;
    opacity: 0;
  }
}
.pulse-ring {
  animation: pulse-out 1.2s ease-out 0.05s forwards;
}
</style>
