export const PALETTE = [
  "red",
  "blue",
  "purple",
  "yellow",
  "green",
  "camel"
] as const;

export type LessonHue = (typeof PALETTE)[number] | "paper" | (string & {});

export function hueNameToClass(hueName?: LessonHue | null): string {
  if (!hueName) return "class-paper";
  if (hueName.startsWith("class-")) return hueName;
  return `class-${hueName}`;
}
