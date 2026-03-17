import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { editClassSchema } from "$lib/schemas/schedule";

export const load = async ({ locals }) => {
  const today = new Date();
  const startBuffer = new Date(today);
  const endBuffer = new Date(today);

  // Load 1 month back and 3 months forward
  startBuffer.setMonth(today.getMonth() - 1);
  endBuffer.setMonth(today.getMonth() + 3);

  const editForm = await superValidate(zod4(editClassSchema));

  const [classesResult, programsResult] = await Promise.all([
    locals.supabase
      .from("classes")
      .select("*, program:programs(title), coach:profiles(display_name)")
      .eq("location_id", locals.location?.id)
      .gte("start_time", startBuffer.toISOString())
      .lt("start_time", endBuffer.toISOString())
      .order("start_time", { ascending: true }),
    locals.supabase
      .from("programs")
      .select("id, program_date, class_type, title, slug, created_at") // select what the form needs
      .order("created_at", { ascending: false })
      .limit(200)
  ]);

  return {
    editForm,
    classes: classesResult.data || [],
    programs: programsResult.data || []
  };
};

export const actions = {
  updateClass: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(editClassSchema));
    if (!form.valid) return fail(400, { form });

    const startDateTime = new Date(`${form.data.date}T${form.data.time}`);
    const endDateTime = new Date(startDateTime.getTime() + form.data.duration * 60000);

    // If the select passes "unassigned" string, convert to null for DB
    const coachId = form.data.coach_id === "Unassigned" ? null : form.data.coach_id;
    const programId = form.data.program_id === "Unassigned" ? null : form.data.program_id;

    const { error } = await locals.supabase
      .from("classes")
      .update({
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        class_type: form.data.class_type,
        coach_id: coachId,
        program_id: programId,
        capacity: form.data.capacity
      })
      .eq("id", form.data.id);

    if (error) return fail(500, { form, message: error.message });

    return { form };
  },

  deleteClass: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(editClassSchema));

    if (!form.valid) return fail(400, { message: "Invalid Class ID" });

    const { error } = await locals.supabase.from("classes").delete().eq("id", form.data.id);

    if (error) return fail(500, { message: error.message });

    return { form, deleted: true };
  }
};
