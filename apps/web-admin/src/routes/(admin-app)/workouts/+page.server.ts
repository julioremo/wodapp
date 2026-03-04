import { fail } from "@sveltejs/kit";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { workoutSchema } from "$lib/schemas/workout";

export const load = async ({ locals }) => {
  if (!locals.location) return { workouts: [], form: await superValidate(zod(workoutSchema)) };

  const { data: workouts, error } = await locals.supabase
    .from("workouts")
    .select("*")
    .eq("location_id", locals.location.id)
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load workouts:", error);

  // Initialize an empty form for the editor
  const form = await superValidate(zod(workoutSchema));

  return {
    workouts: workouts || [],
    form
  };
};

export const actions = {
  saveWorkout: async ({ request, locals }) => {
    const form = await superValidate(request, zod(workoutSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const payload = {
      slug: form.data.slug,
      description: form.data.description,
      duration: form.data.duration,
      workout_type: form.data.workout_type,
      class_type: form.data.class_type || null, // Ensure empty strings become SQL nulls
      location_id: locals.location.id
    };

    if (form.data.id) {
      // Update existing
      const { error } = await locals.supabase
        .from("workouts")
        .update(payload)
        .eq("id", form.data.id)
        .eq("location_id", locals.location.id);

      if (error) return fail(500, { form, message: error.message });
    } else {
      // Insert new
      const { data, error } = await locals.supabase
        .from("workouts")
        .insert(payload)
        .select("id")
        .single();

      if (error) return fail(500, { form, message: error.message });
      form.data.id = data.id; // Pass the new UUID back to the client
    }

    return { form, success: true };
  },

  deleteWorkout: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get("id");

    if (!id) return fail(400, { message: "Missing workout ID" });

    const { error } = await locals.supabase
      .from("workouts")
      .delete()
      .eq("id", id)
      .eq("location_id", locals.location.id);

    if (error) return fail(500, { message: error.message });

    return { success: true };
  }
};
