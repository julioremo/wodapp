<script lang="ts">
import { format } from "date-fns";
import { CircleCheck, LoaderCircle, Trash2 } from "lucide-svelte";
import { onMount, tick } from "svelte";
import { enhance } from "$app/forms";
import { blockPlaceholders } from "$lib/data/placeholders";
import type { Block } from "$lib/types/program";

function getSeededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

let {
  programs = [],
  class_type,
  date,
  isScheduled = true,
  onDelete
} = $props<{
  programs: any[];
  class_type: string;
  date: Date;
  isScheduled?: boolean;
  onDelete?: () => void;
}>();

const dateString = typeof date === "string" ? date : format(date, "yyyy-MM-dd");

// state

let formRef = $state<HTMLFormElement>();
let syncState = $state<"idle" | "saving" | "saved" | "error">("idle");
let debounceTimer: ReturnType<typeof setTimeout>;

let program = programs[0] || null;
const defaultSlug = `${class_type.toLowerCase()}-${format(date, "ddMMyy")}`;
let programTitle = $state(program?.title || defaultSlug);
let programId = $state(programs[0]?.id || null);

let deleteConfirming = $state(false);

// LocalStorage Key specific to this day/track
const localKey = `draft-${format(date, "yyyy-MM-dd")}-${class_type}`;

function getDefaultDuration(type: string) {
  const durations: Record<string, number> = {
    Warmup: 4,
    Strength: 20,
    Skill: 20,
    WOD: 15,
    "Cool Down": 5
  };
  return durations[type] || 10;
}

function getPlaceholder(workoutType: string, index: number) {
  const options = blockPlaceholders[workoutType] || blockPlaceholders["Warmup"];
  // Combine the cell's unique data to act as the seed
  const dateStr = date.toISOString().split("T")[0];
  const seed = `${dateStr}-${class_type}-${workoutType}-${index}`;
  const randomIndex = getSeededRandom(seed) % options.length;
  return options[randomIndex];
}

// Initialize from props, OR LocalStorage fallback, OR empty
let blocks = $state<Block[]>(
  program?.workouts?.length > 0
    ? program.workouts.map((w: any, i: number) => ({ ...w, sort_order: i }))
    : [
        {
          id: crypto.randomUUID(),
          title: "",
          description: "",
          duration: getDefaultDuration("Warmup"),
          workout_type: "Warmup",
          sort_order: 0
        }
      ]
);

onMount(() => {
  const localDraft = localStorage.getItem(localKey);
  // Only load the draft if the database didn't already provide saved workouts
  if (localDraft && (!program?.workouts || program.workouts.length === 0)) {
    blocks = JSON.parse(localDraft);
  }
});

let blockRefs = $state<HTMLElement[]>([]);

// 2. The Universal Trigger
// Call this whenever data changes. It saves locally instantly, and queues a server sync.
function triggerSave(immediate = false) {
  // Save to LocalStorage instantly
  localStorage.setItem(localKey, JSON.stringify(blocks));

  syncState = "saving";
  clearTimeout(debounceTimer);

  const delay = immediate ? 0 : 2500; // 2.5s for typing, 0 for paste

  debounceTimer = setTimeout(() => {
    if (formRef) formRef.requestSubmit(); // Programmatically submit the hidden form
  }, delay);
}

// Smart Progression Logic
function getNextType(prevType: string) {
  const flow: Record<string, string> = {
    Warmup: "Strength",
    Strength: "WOD",
    Skill: "WOD",
    WOD: "Cool Down",
    "Cool Down": "Cool Down"
  };
  return flow[prevType] || "Warmup";
}

// --- Block Management (Trigger saves on all actions) ---
async function addBlock(insertIndex: number) {
  const prevType = insertIndex > 0 ? blocks[insertIndex - 1].workout_type : null;
  const nextType = prevType ? getNextType(prevType) : "Warmup";
  blocks.splice(insertIndex, 0, {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    duration: getDefaultDuration(nextType),
    workout_type: nextType,
    sort_order: 0
  });
  blocks.forEach((b, i) => (b.sort_order = i));
  triggerSave(true); // Immediate sync on structural change
  await tick();
  blockRefs[insertIndex]?.focus();
}

async function removeBlock(index: number) {
  if (blocks.length <= 1) return;
  blocks.splice(index, 1);
  blocks.forEach((b, i) => (b.sort_order = i));
  triggerSave(true);
  await tick();
  blockRefs[index > 0 ? index - 1 : 0]?.focus();
}

function handleKeydown(e: KeyboardEvent, index: number) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    addBlock(index + 1);
  }
  if (e.key === "Backspace" && blocks[index].description.trim() === "") {
    e.preventDefault();
    removeBlock(index);
  }
}

function handleInput() {
  triggerSave(false); // Debounced sync for rapid typing
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
  triggerSave(true); // Immediate sync on paste
}

// 3. Background Form Submission
function handleSubmit({ action, cancel }) {
  const isDelete = action.search.includes("deleteProgram");

  if (!isDelete && (!blocks || blocks.length === 0)) {
    cancel();
    syncState = "idle";
    return;
  }

  if (!isDelete) {
    blocks.forEach((b) => {
      const firstLine = b.description.split("\n")[0] || "";
      b.title = firstLine.startsWith("#") ? firstLine.replace(/^#+\s*/, "").trim() : `${b.workout_type} Block`;
    });

    if (formRef) {
      const jsonInput = formRef.querySelector('input[name="blocks_json"]') as HTMLInputElement;
      if (jsonInput) jsonInput.value = JSON.stringify(blocks);
    }
  }

  return async ({ result, update }: any) => {
    if (result.type === "success") {
      syncState = "saved";
      localStorage.removeItem(localKey);

      if (result.data?.programId) {
        programId = result.data.programId;
      }

      if (isDelete) {
        blocks = [
          {
            title: "",
            description: "",
            duration: getDefaultDuration("Warmup"),
            workout_type: "Warmup",
            sort_order: 0
          }
        ];
        programTitle = defaultSlug;
        programId = null;

        if (onDelete) onDelete();
      }

      setTimeout(() => {
        if (syncState === "saved") syncState = "idle";
      }, 2000);
    } else {
      syncState = "error";
    }

    await update({ reset: false });
  };
}
</script>

<div
  class="flex flex-col relative group/cell bg-stone-100 focus-within:bg-stone-50 shadow-md/5 focus-within:shadow-lg/10 rounded-none hover:border-muted-foreground/50 focus-within:border-primary border-2 transition-shadow font-mono"
>
  <form bind:this={formRef} novalidate method="POST" action="?/saveProgram" use:enhance={handleSubmit} class="flex flex-col min-h-[320px] px-2 py-2 gap-3 selection:bg-yellow">
    <input type="hidden" name="program_id" value={programId || ""} />
    <input type="hidden" name="date" value={dateString} />
    <input type="hidden" name="class_type" value={class_type} />
    <input type="hidden" name="blocks_json" value={JSON.stringify(blocks)} />

    
    
    <div class="flex justify-between items-center pb-1.5 border-b-2 border-primary border-dashed w-full gap-3">

      <input
        name="title"
        bind:value={programTitle}
        oninput={() => triggerSave(false)}
        class="flex-1 min-w-0 font-semibold text-foreground/90 bg-transparent border-none p-0 focus:ring-0 focus:outline-none truncate" 
      />
      
      <div class="text-[10px] text-muted-foreground/60 flex items-center leading-none gap-1 min-w-4 justify-end">
          {#if !isScheduled}
            <span class="text-[10px] text-destructive/80 font-medium uppercase tracking-wider mt-0.5">
              Not Scheduled
            </span>
          {/if}

          {#if syncState === 'saving'}
            <LoaderCircle class="size-3.5 animate-spin" />
          {:else if syncState === 'saved'}
            <CircleCheck class="size-3.5 text-green-500/70 shrink-0" />
          {:else if syncState === 'error'}
            <span class="text-destructive text-nowrap">Not saved</span>
          {:else if syncState === 'idle' && programId}
            {#if deleteConfirming}
              <button 
                type="submit" 
                formaction="?/deleteProgram"
                onmouseleave={() => deleteConfirming = false}
                class="text-[10px] -mr-1 font-mono font-bold text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors"
              >
                <span class="h-3.5">Delete?</span>
              </button>
            {:else}
              <button 
                type="button" 
                onclick={(e) => { e.preventDefault(); deleteConfirming = true; }}
                class="p-1 -mr-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                title="Clear program {programTitle}"
              >
                <Trash2 class="size-3.5" />
              </button>
            {/if}
          {/if}

      </div>

    </div>

    <div class="flex flex-col gap-1 flex-1">
      {#each blocks as block, i}
        <div class="group/block relative flex gap-2 p-1 py-2 -mx-1 rounded hover:bg-card/70 transition-colors">
          <div class="flex flex-col w-full gap-1 py-1">
            <div class="flex items-center justify-between mt-1">
              <div class="w-full flex justify-between">
                <select
                  bind:value={block.workout_type}
                  onchange={() => {
                    block.duration = getDefaultDuration(block.workout_type);
                    triggerSave(true)}}
                  class="bg-stone-100 text-muted-foreground rounded px-1.5 py-0.5 border-none text-[9px] font-semibold uppercase tracking-wider focus:ring-0 focus:outline-none cursor-pointer"
                >
                  {#each ["Warmup", "Strength", "Skill", "WOD", "Cool Down"] as blockType }
                    <option value={blockType}>{blockType}</option>
                  {/each}
                </select>

                <div class="flex items-center text-[10px] text-muted-foreground bg-stone-100 px-1.5 py-0.5 rounded focus-within:bg-background focus-within:ring-1 focus-within:ring-border focus-within:text-foreground hover:bg-background/80 transition-all cursor-text">
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    bind:value={block.duration}
                    oninput={() => triggerSave(false)}
                    class="bg-transparent border-none p-0 text-right w-4 focus:ring-0 focus:outline-none hide-arrows placeholder:text-muted-foreground/40 focus:text-foreground"
                  />
                  <span class="ml-0.5">min</span>
                </div>
              </div>
            </div>

            <div
              bind:this={blockRefs[i]}
              contenteditable="true"
              role="textbox"
              tabindex="0"
              aria-multiline="true"
              bind:innerText={block.description}
              onkeydown={(e) => handleKeydown(e, i)}
              oninput={handleInput}
              onpaste={handlePaste}
              data-placeholder={getPlaceholder(block.workout_type, i)}
              class="text-md font-mono leading-relaxed focus:outline-none min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/25"
            ></div>
          </div>
        </div>
      {/each}
      <button 
        type="button" 
        onclick={() => addBlock(blocks.length)}
        class="opacity-0 group-focus-within/cell:opacity-50 group-focus-within/cell:hover:opacity-100 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 py-1.5 px-1 mt-2 w-fit rounded transition-colors"
      >
        + Add program block
      </button>
    </div>
  </form>
</div>

<style>
  .hide-arrows::-webkit-outer-spin-button,
  .hide-arrows::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .hide-arrows {
    -moz-appearance: textfield;
  }

  [contenteditable="true"]:empty:before {
    pointer-events: none;
    display: block;
  }
</style>
