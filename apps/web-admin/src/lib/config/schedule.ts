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

export interface ScheduleConfig {
  startHour: number;
  endHour: number;
  timeStep: number;
  pixelPerMinute: number;
  hiddenDays: number[];
  programSortOrder: string[];
  nonProgrammableTypes: string[];
}

export const SCHEDULE_CONFIG: ScheduleConfig = {
  startHour: 6,
  endHour: 22,
  timeStep: 15,
  pixelPerMinute: 1,
  hiddenDays: [0], // Sunday
  programSortOrder: ["Crossfit",  "Gymnastics", "Hyrox", "Sweat"],
  nonProgrammableTypes: ["Weightlifting", "Stretching", "Open Gym", "Intro Class"] // Add your ignored types here
};
