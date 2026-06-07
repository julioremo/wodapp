# @wodapp/core

This package contains the shared business logic, utility functions, and strict type definitions used by both the Athlete and Admin apps.

## Responsibilities

### 1. Supabase Initialization (`setupSupabase`)
To prevent mismatched instances of `@supabase/supabase-js` across the monorepo, the client is initialized here. 
* **Important:** Apps consuming this function (like `web-athlete/src/hooks.server.ts`) must explicitly cast the returned client to their strict `Database` type at the boundary:
  `supabase as SupabaseClient<Database>`

### 2. Time & Scheduling Logic
Contains pure functions for handling CrossFit gym schedules:
* `globalClock`: Centralized time state.
* `getAvailability`: Calculates booking windows, countdowns, and waitlist logic.

### 3. Shared Enums & Constants
Use this package to store immutable UI configs so they don't get hardcoded into the database or duplicated across apps. 
* Example: `BENCHMARK_CATEGORIES` (maps the database slug `skill` to the UI label "Gymnastics & Skills").

## Development
Because this is an internal monorepo package, changes made here should instantly reflect in the consuming apps via pnpm workspace symlinks. If type errors persist after a change here, restart the consuming app's Svelte language server.