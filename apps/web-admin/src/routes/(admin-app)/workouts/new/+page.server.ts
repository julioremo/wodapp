import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { workoutSchema } from "$lib/schemas/workout";
import { fail, redirect } from "@sveltejs/kit";
import { slugify } from "$lib/utils";

export const load = async ({ locals, url }) => {
  const form = await superValidate(zod4(workoutSchema));

  // CAPTURE URL PARAMS
  const paramDate = url.searchParams.get("date");
  const paramType = url.searchParams.get("type");
  // PRE-FILL FORM
  if (paramDate) form.data.date = paramDate;
  if (paramType) form.data.class_type = paramType;

  return { form };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(workoutSchema));
    // if (!form.valid) return fail(400, { form });

    console.log("----- SUBMITTING WORKOUT -----");
    console.log("Form Valid?", form.valid);
    console.log("Form Data:", form.data);

    if (!form.valid) {
      console.error("Validation Failed:", form.errors);
      return fail(400, { form });
    }

    // 1. GENERATE SLUG & TITLE
    // If no title, use "Type-Date"
    let finalTitle = form.data.title;
    let baseSlug = form.data.title;
    if (!finalTitle && form.data.date && form.data.class_type) {
      // Fallback: "Crossfit 16 Feb"
      const dateObj = new Date(form.data.date);
      finalTitle = `${form.data.class_type} ${dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
      baseSlug = `${form.data.class_type}-${form.data.date}`;
    } else if (!finalTitle) {
      // Absolute fallback
      finalTitle = "Untitled Workout";
      baseSlug = `workout-${Date.now()}`;
    }
    const slug = slugify(baseSlug!);

    const payload = {
      title: form.data.title || null,
      slug: slug,
      description: form.data.description
    };
    const { data: workout, error: wError } = await locals.supabase
      .from("workouts")
      .insert(payload)
      .select("id")
      .single();

    if (wError) return fail(500, { form, message: wError.message });

    // Link classes
    if (form.data.date && form.data.class_type) {
      let query = locals.supabase
        .from("classes")
        .update({ program_id: workout.id })
        .eq("class_type", form.data.class_type)
        // Ensure we catch the whole day in UTC/Local correctly
        .gte("start_time", `${form.data.date}T00:00:00`)
        .lte("start_time", `${form.data.date}T23:59:59`);

      // If NOT applying to all, filter by the specific IDs selected
      if (!form.data.apply_to_all && form.data.selected_class_ids?.length) {
        query = query.in("id", form.data.selected_class_ids);
      }

      const { error: cError } = await query;
      if (cError) console.error("Error linking classes:", cError);
    }

    throw redirect(303, "/workouts");
  }
};
