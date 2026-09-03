// ── Supabase row ──────────────────────────────────────
import type { MovementStandard } from "@wodapp/types";

export interface StandardsSet {
  myGender: MovementStandard | null;
  otherGender: MovementStandard | null;
}

// ── level name → column key ───────────────────────────
export const LEVEL_KEYS = [
  { label: "Untrained", key: "level_untrained_kg" },
  { label: "Novice", key: "level_novice_kg" },
  { label: "Intermediate", key: "level_intermediate_kg" },
  { label: "Advanced", key: "level_advanced_kg" },
  { label: "Elite", key: "level_elite_kg" },
  { label: "World record", key: "level_world_record_kg" }
] as const satisfies { label: string; key: keyof MovementStandard }[];

export type LevelKey = (typeof LEVEL_KEYS)[number]["key"];

// ── peer / athlete shapes ─────────────────────────────
export interface BenchmarkEntry {
  estimated_1rm?: number | null;
  score?: number | null;
  date?: string;
}

export interface Peer {
  id: string;
  display_name?: string;
  emoji?: string;
  benchmarks: BenchmarkEntry[];
  gender?: string;
  age?: number;
  weight?: number;
}

export interface ProcessedPeer {
  id: string;
  display_name?: string;
  emoji?: string;
  avatar_url?: string;
  val: number;
  date?: string;
  isUser: boolean;
  gender?: string;
  age?: number;
  weight?: number;
}

export interface SimulatedNode extends ProcessedPeer {
  x: number;
  y: number;
  r: number;
  label: string;
}

export interface UserProfile {
  gender: string; // matches movement_standards.gender
  age: number;
  weight: number;
}
