import type { ButtonVariant } from "@ui/button";
import type { CardStateName } from "./card-states";
import type { LessonHue } from "./types";

type CardTreatment = "neutral" | "tinted" | "muted" | "muted-tinted";

interface StateTreatmentConfig {
  treatment: CardTreatment;
  buttonVariant: ButtonVariant;
}

const STATE_CONFIG: Record<CardStateName, StateTreatmentConfig> = {
  bookable: { treatment: "neutral", buttonVariant: "default" },
  waitlist_available: { treatment: "neutral", buttonVariant: "secondary" },
  confirmed: { treatment: "tinted", buttonVariant: "tint" },
  waitlisted: { treatment: "tinted", buttonVariant: "tint" },
  past: { treatment: "muted", buttonVariant: "subtle" },
  outside_window: { treatment: "muted", buttonVariant: "subtle" },
  past_booked: { treatment: "muted-tinted", buttonVariant: "subtle" }
};

const CARD_CLASSES: Record<CardTreatment, string> = {
  neutral: "bg-card hover:bg-accent",
  tinted: "bg-[var(--card-tint)] hover:bg-[var(--card-hover)]",
  "muted-tinted": "bg-[var(--card-tint)]",
  muted: "bg-muted" // TODO: hover:bg-accent once card becomes actionable,
};

export function stateToCardClasses(uiState: CardStateName) {
  const config = STATE_CONFIG[uiState];
  return CARD_CLASSES[config.treatment];
}

export function stateToButtonVariant(uiState: CardStateName) {
  return STATE_CONFIG[uiState].buttonVariant;
}

export function hueNameToClass(hueName: LessonHue): string {
  return `class-${hueName}`; // pairs with the .class-red / .class-blue rules in color-theme.css
}
