"""
TODO: This endpoint should re-create the parser's keyword dict from the aliases column in public.movements

TODO: set a webhook on the movements table to send a POST request to /internal/refresh-aliases whenever there is an INSERT, UPDATE, or DELETE
"""

from fastapi import BackgroundTasks, FastAPI
from flashtext import KeywordProcessor

app = FastAPI()
keyword_processor = KeywordProcessor()


def build_trie_from_db():
    # Fetch from Supabase and rebuild the processor here
    # This runs once on startup, and whenever the webhook is fired
    pass


# Run on server startup
@app.on_event("startup")
def startup_event():
    build_trie_from_db()


# The endpoint Supabase calls when the DB changes
@app.post("/internal/refresh-aliases")
def refresh_aliases(background_tasks: BackgroundTasks):
    # Do this in the background so Supabase gets a fast 200 OK response
    background_tasks.add_task(build_trie_from_db)
    return {"status": "refreshing"}
