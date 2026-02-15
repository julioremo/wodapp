// TODO: move this to db
export const CLASS_TYPE_COLORS: Record<string, string> = {
  Crossfit: "red",
  Weightlifting: "blue",
  "Community Workout": "purple",
  Gymnastics: "green",
  Metcon: "orange",
  Yoga: "pink"
};

export const DEFAULT_CLASS_COLOR = "stone";

export const SCHEDULE_CONFIG = {
  startHour: 6,
  endHour: 22,
  pixelPerMinute: 1,
  hiddenDays: [0] // Sunday
};

export type ScheduleConfig = typeof SCHEDULE_CONFIG;
