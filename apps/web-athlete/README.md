This is the mobile-first frontend for athletes to book classes, log daily WODs, and track their benchmark performance.

## Tech Stack
* **Framework:** SvelteKit (SPA/SSR hybrid)
* **Styling:** Tailwind CSS + Shadcn-svelte
* **Database & Auth:** Supabase (PostgreSQL)
* **Data Viz:** D3.js (via Svelte reactivity)
* **Package Manager:** pnpm

## Monorepo Context
This app relies on the `@wodapp/core` local package for shared business logic, database types, and initializing the global Supabase client. 

## Development Workflow

### 1. Starting the Server
Always use `pnpm` from the root or within this directory.
```bash
pnpm --filter web-athlete dev

```

*Note: If you ever see mysterious squiggly lines on `PageServerLoad` or `$types`, manually run `pnpm sync`.*

### 2. Updating the Database Types

When the Supabase schema changes (e.g., adding a new table or generated column), regenerate the TypeScript definitions:

```bash
# If using local Supabase:
npx supabase gen types typescript --schema public --project-id my-supabase-id > packages/types/src/database.types.ts

# Then, ALWAYS update the clean type mappings in:
# packages/types/src/index.ts (e.g., export type Movement = Database["public"]...)

```

## Architecture Notes

### Routing Strategy

* **`/(auth)`**: Login/Register flows.
* **`/(app)`**: The main authenticated app protected by `+layout.server.ts`.
* If `locals.user` is missing, users are bounced to `/login`.
* The layout fetches memberships and determines the `activeLocation` before rendering child routes.



### The Benchmark Tracker

The taxonomy is strictly separated into three levels to keep the UI clean:

1. **Category:** (`weight`, `distance`, `skill`) - Drives the UI routing.
2. **Measurement Type:** (`weight`, `time`, `reps`, `distance`, `calories`) - Drives the input component (e.g., a stopwatch vs. a numeric keypad).
3. **Movement:** The specific physical atom (e.g., "Back Squat", "5k Row").

Note: The `benchmarks` table is strictly for raw capacity metrics. Benchmarks on named WODs such as "Fran" or Open 26.2 live in the `results` table, which does link to the right id and description on `workouts`.