// chart.canvas.svelte.ts
import { createContext } from "svelte";

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export class ChartCanvas {
  // Reactive dimensions bound to the container
  width = $state(0);
  height = $state(0);

  // Config
  fontSize = $state(9);
  unit = $state("kg");
  margin: Margin = $state({ top: 25, right: 25, bottom: 40, left: 25 });

  // Computed layout
  top = $derived(this.margin.top);
  bottom = $derived(this.height - this.margin.bottom);
  left = $derived(this.margin.left);
  right = $derived(this.width - this.margin.right);
  innerWidth = $derived(this.width - this.margin.left - this.margin.right);
  innerHeight = $derived(this.height - this.margin.top - this.margin.bottom);
  cx = $derived(this.width / 2);
  cy = $derived(this.height / 2);

  constructor(initialConfig?: { margin?: Margin; fontSize?: number; unit?: string }) {
    if (initialConfig?.margin) this.margin = initialConfig.margin;
    if (initialConfig?.fontSize) this.fontSize = initialConfig.fontSize;
    if (initialConfig?.unit) this.unit = initialConfig.unit;
  }
}

export const [getChartCanvas, setChartCanvas] = createContext<ChartCanvas>();
