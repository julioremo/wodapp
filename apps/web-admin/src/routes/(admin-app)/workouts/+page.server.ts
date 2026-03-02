import { fail } from "@sveltejs/kit";
import { addDays, endOfWeek, format, parseISO, startOfWeek } from "date-fns";

export const load = async ({ locals, url, parent }) => {
  const parentData = await parent();
  const settings = parentData.settings;

  const availableProgrammableTypes = settings.classTypes
    .filter((ct: any) => ct.isProgrammable && ct.isActive)
    .map((ct: any) => ct.name);

  const nonProgrammableTypes = settings.classTypes
    .filter((ct: any) => !ct.isProgrammable)
    .map((ct: any) => ct.name);

  const dateParam = url.searchParams.get("date");
  const targetDate = dateParam ? parseISO(dateParam) : new Date();

  const startOfWk = startOfWeek(targetDate, { weekStartsOn: 1 });
  const weekStart = format(startOfWk, "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(targetDate, { weekStartsOn: 1 }), "yyyy-MM-dd");

  // 1. Initialize the 7 days with completely empty objects
  const daysMap: Record<string, Record<string, { isScheduled: boolean; programs: any[] }>> = {};
  for (let i = 0; i < 7; i++) {
    const dateStr = format(addDays(startOfWk, i), "yyyy-MM-dd");
    daysMap[dateStr] = {};
  }

  // 2. Fetch Classes and Programs simultaneously for performance
  // Note: We fetch classes up to the start of the *next* week to ensure we catch late-night classes
  const [classesResult, programsResult] = await Promise.all([
    locals.supabase
      .from("classes")
      .select("start_time, class_type")
      .gte("start_time", weekStart)
      .lt("start_time", format(addDays(startOfWk, 7), "yyyy-MM-dd")),
    locals.supabase
      .from("programs")
      .select(
        `
        id, title, class_type, program_date,
        program_workouts (
          sort_order,
          workout:workouts (id, title, description, clean_description, duration, workout_type, tags, coach_notes, slug)
        )
      `
      )
      .gte("program_date", weekStart)
      .lte("program_date", weekEnd)
  ]);

  // 3. LAYER ONE: Populate empty slots based on the actual class schedule
  if (classesResult.data) {
    for (const cls of classesResult.data) {
      if (nonProgrammableTypes.includes(cls.class_type)) continue;

      const clsDateStr = format(new Date(cls.start_time), "yyyy-MM-dd");

      if (daysMap[clsDateStr]) {
        if (!daysMap[clsDateStr][cls.class_type]) {
          // It's on the schedule!
          daysMap[clsDateStr][cls.class_type] = { isScheduled: true, programs: [] };
        } else {
          daysMap[clsDateStr][cls.class_type].isScheduled = true;
        }
      }
    }
  }

  // 4. LAYER TWO: Drop the existing programs into the slots
  if (programsResult.data) {
    for (const prog of programsResult.data) {
      const dateKey = prog.program_date;
      const typeKey = prog.class_type;

      if (daysMap[dateKey]) {
        if (!daysMap[dateKey][typeKey]) {
          // Program exists in DB, but NO class is scheduled
          daysMap[dateKey][typeKey] = { isScheduled: false, programs: [] };
        }

        const sortedWorkouts = (prog.program_workouts || [])
          .map((pw: any) => ({ ...pw.workout, sort_order: pw.sort_order }))
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

        daysMap[dateKey][typeKey].programs.push({
          id: prog.id,
          title: prog.title,
          class_type: prog.class_type,
          workouts: sortedWorkouts
        });
      }
    }
  }

  return {
    daysMap,
    weekStart,
    weekEnd,
    availableProgrammableTypes,
    settings
  };
};

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const randomChars = () => Math.random().toString(36).substring(2, 6);

export const actions = {
  saveProgram: async ({ request, locals }) => {
    const data = await request.formData();
    // Extract context
    const programIdRaw = data.get("program_id")?.toString();
    const programId = programIdRaw === "" ? null : programIdRaw;
    const date = data.get("date")?.toString();
    const classType = data.get("class_type")?.toString();
    const title = data.get("title")?.toString();
    const blocksJson = data.get("blocks_json")?.toString();

    if (!date || !classType || !blocksJson) {
      return fail(400, { message: "Missing required fields" });
    }

    let blocks: any[] = [];

    try {
      blocks = JSON.parse(blocksJson);
    } catch (e) {
      return fail(400, { message: "Invalid blocks format" });
    }

    const baseSlug = generateSlug(`${classType}-${date}`);

    blocks.forEach((b) => {
      const originalText = b.description || "";
      let rawText = originalText;

      const titleMatch = rawText.match(/^##\s+(.+)$/m);
      if (titleMatch) {
        b.title = titleMatch[1].trim();
        rawText = rawText.replace(/^##\s+.+\n?/, "");
      } else {
        b.title = `${b.workout_type} Block`;
      }

      const tagRegex = /#[\w-]+/g;
      const tagsMatch = rawText.match(tagRegex);
      b.tags = tagsMatch ? tagsMatch.map((t) => t.slice(1).toLowerCase()) : [];
      rawText = rawText.replace(tagRegex, "");

      const noteRegex = /\(Notes?:\s*([^)]+)\)/i;
      const noteMatch = rawText.match(noteRegex);
      if (noteMatch) {
        b.coach_notes = noteMatch[1].trim();
        rawText = rawText.replace(noteRegex, "");
      } else {
        b.coach_notes = null;
      }

      b.clean_description = rawText.trim();
      b.description = originalText;

      if (!b.slug) {
        b.slug = `${baseSlug}-${generateSlug(b.workout_type)}-${randomChars()}`;
      }
    });

    console.log(
      "Parsed Blocks payload:",
      JSON.stringify(
        blocks.map((b) => ({
          title: b.title,
          tags: b.tags,
          notes: b.coach_notes,
          clean_description: b.description
        })),
        null,
        2
      )
    );

    // Keys MUST match the exact SQL parameter names (p_...)
    const { data: returnedProgramId, error } = await locals.supabase.rpc("save_program", {
      p_program_id: programId,
      p_date: date,
      p_class_type: classType,
      p_title: title,
      p_blocks: blocks
    });

    // 2. We must catch and return the error so the frontend knows it failed
    if (error) {
      console.error("Database Save Error:", error);
      return fail(500, { message: "Failed to save to database." });
    }

    return { success: true, programId: returnedProgramId };
  },

  deleteProgram: async ({ request, locals }) => {
    const data = await request.formData();
    const programId = data.get("program_id")?.toString();

    if (!programId) {
      return fail(400, { message: "No program ID provided." });
    }

    const { error } = await locals.supabase.rpc("delete_program", { p_program_id: programId });

    if (error) {
      console.error("Database Delete Error:", error);
      return fail(500, { message: "Failed to delete program and workouts." });
    }

    return { success: true, deleted: true };
  }
};
