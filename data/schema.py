from enum import Enum
from typing import Optional

from pydantic import BaseModel


class WorkoutType(str, Enum):
    AMRAP = "AMRAP"
    FOR_TIME = "FOR_TIME"
    RFT = "RFT"
    EMOM = "EMOM"
    TIMED_LADDER_AMRAP = "TIMED_LADDER_AMRAP"


class Movement(BaseModel):
    reps: int
    exercise_id: str
    load: Optional[str] = None


class Round(BaseModel):
    movements: list[Movement]


class Workout(BaseModel):
    workout_type: WorkoutType
    time_cap_minutes: Optional[int] = None
    time_extension_minutes: Optional[int] = None
    rounds_to_complete: Optional[int] = None
    interval_minutes: Optional[int] = None
    rounds: list[Round]


class WorkoutRow(BaseModel):
    """Mirrors the Supabase workouts table."""

    id: str
    raw_text: str
    status: str  # 'pending' | 'processing' | 'done' | 'error'
    parsed_workout: Optional[Workout] = None
    normalized_text: Optional[str] = None
    error: Optional[str] = None
