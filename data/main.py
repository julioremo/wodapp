"""
WOD Parser Worker
-----------------
Receives webhook POSTs from Supabase (via pg_net) whenever a new row is
inserted in the `workouts` table with status='pending'.

Flow:
  Svelte insert (description) → pg_net trigger → POST /webhook/workout
                                                        ↓
                                                  flashtext normalization
                                                        ↓  → clean_description
                                                  parse workout (dummy → Haiku)
                                                        ↓  → structured_data
                                                  supabase-py PATCH row
                                                        ↓
                                                  Svelte realtime update
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from keywords import build_keyword_processor, normalize_text
from pydantic import BaseModel
from schema import Movement, Round, Workout, WorkoutType

from supabase import AsyncClient, acreate_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv()
SUPABASE_URL = os.environ["PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")

TABLE = "workouts"


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.kp = build_keyword_processor()
    app.state.db: AsyncClient = await acreate_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("Supabase async client and keyword processor ready.")
    yield
    # supabase-py AsyncClient has no explicit close — connections are managed internally


app = FastAPI(title="WOD Parser Worker", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Webhook payload shape (Supabase sends this on every trigger)
# ---------------------------------------------------------------------------
class WebhookPayload(BaseModel):
    type: str  # INSERT | UPDATE | DELETE
    table: str
    record: dict
    old_record: dict | None = None
    schema: str = "public"


# ---------------------------------------------------------------------------
# Dummy parser — replace body with Claude Haiku or Outlines call
# ---------------------------------------------------------------------------
def dummy_parse(norm_description: str) -> Workout:
    # Extract keys that exist in the text
    extracted_exercises = [w for w in norm_description.split(" ") if "[" in w]

    # 2. Build the Movement list dynamically
    movements = []
    for key in extracted_exercises:
        movements.append(
            Movement(
                reps=15,  # Hardcoded for the test
                exercise_id=key,
                load="RX",  # Hardcoded for the test
            )
        )

    # 3. Return the strict Pydantic model
    return Workout(
        workout_type=WorkoutType.AMRAP,
        time_cap_minutes=20,
        time_extension_minutes=None,
        rounds_to_complete=None,
        interval_minutes=None,
        rounds=[Round(movements=movements)]
        if movements
        else [],  # Prevents failure if no movements are found
    )


# ---------------------------------------------------------------------------
# Supabase helpers  (all use supabase-py, no manual HTTP)
# ---------------------------------------------------------------------------
async def set_status(db: AsyncClient, row_id: str, status: str) -> None:
    await db.table(TABLE).update({"status": status}).eq("id", row_id).execute()


async def write_result(
    db: AsyncClient,
    row_id: str,
    clean_description: str,
    workout: Workout,
) -> None:
    await (
        db.table(TABLE)
        .update(
            {
                "status": "done",
                "clean_description": clean_description,
                "structured_data": workout.model_dump(),
            }
        )
        .eq("id", row_id)
        .execute()
    )


async def write_error(db: AsyncClient, row_id: str, error: str) -> None:
    await (
        db.table(TABLE)
        .update({"status": "error", "error": error})
        .eq("id", row_id)
        .execute()
    )


# ---------------------------------------------------------------------------
# Core processing pipeline (runs as a background task)
# ---------------------------------------------------------------------------
async def process_workout(row_id: str, description: str) -> None:
    db: AsyncClient = app.state.db
    kp = app.state.kp

    try:
        await set_status(db, row_id, "processing")

        # Step 1 — flashtext normalization
        norm_description = normalize_text(description, kp)
        logger.info(f"[{row_id}] clean_description ready.")

        # Step 2 — parse  (swap dummy_parse here when ready)
        workout = dummy_parse(norm_description)
        logger.info(f"[{row_id}] Parsed as {workout.workout_type}.")

        # Step 3 — persist; triggers Svelte realtime update
        await write_result(db, row_id, norm_description, workout)
        logger.info(f"[{row_id}] Done.")

    except Exception as exc:
        logger.exception(f"[{row_id}] Processing failed.")
        await write_error(db, row_id, str(exc))


# ---------------------------------------------------------------------------
# Webhook endpoint
# ---------------------------------------------------------------------------
@app.post("/compile_workout")
async def workout_webhook(
    payload: WebhookPayload,
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(default=""),
):
    if WEBHOOK_SECRET and x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret.")

    if payload.type != "INSERT" or payload.table != TABLE:
        return {"ok": True, "skipped": True}

    record = payload.record

    # Guard: only process rows that are freshly pending
    if record.get("status") != "pending":
        return {"ok": True, "skipped": True}

    row_id = record["id"]
    description = record.get("clean_description", "")

    if not description.strip():
        return {"ok": True, "skipped": True, "reason": "empty description"}

    background_tasks.add_task(process_workout, row_id, description)
    logger.info(f"[{row_id}] Queued for processing.")

    return {"ok": True, "queued": row_id}


@app.get("/health")
async def health():
    return {"status": "ok"}
