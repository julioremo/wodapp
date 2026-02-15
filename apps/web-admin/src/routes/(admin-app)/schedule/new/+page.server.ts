import { fail } from "@sveltejs/kit";
import { superValidate, setError } from "sveltekit-superforms";
import { sessionSchema, scheduleFormSchema, defaultSession } from "$lib/schemas/schedule.js";
import { zod4 } from "sveltekit-superforms/adapters";

export const load = async ({ locals }) => {
  const { data: coaches } = await locals.supabase
    .from("memberships")
    .select("...profiles(id, full_name)")
    .eq("location_id", locals.location?.id)
    .in("role", ["coach", "manager", "admin"]);

  const defaultSessionPlusCoach = {
    ...defaultSession,
    coach_id: coaches?.[0]?.id
  };

  const form = await superValidate(zod4(scheduleFormSchema), {
    defaults: {
      start_date: new Date().toISOString().split("T")[0], // Today
      is_recurring: false,
      weekdays: [],
      sessions: [defaultSessionPlusCoach]
    }
  });

  return { form };
};

// Helper: Create one class from a specific session row
function createClass(dateStr: string, session: any, location_id: string) {
  const startDateTime = new Date(`${dateStr}T${session.time}`);
  const endDateTime = new Date(startDateTime.getTime() + session.duration * 60000);

  return {
    class_type: session.class_type,
    coach_id: session.coach_id || null,
    capacity: session.capacity,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    location_id
  };
}

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(scheduleFormSchema));
    if (!form.valid) return fail(400, { form });

    const classesToInsert = [];
    const { start_date, sessions, is_recurring } = form.data;

    if (!is_recurring) {
      console.log("No recursion loop somehow");
      // Single day: Only loop through the day's rows
      for (const session of sessions) {
        classesToInsert.push(createClass(start_date, session, locals.location.id));
      }
    } else {
      console.log("Entered recursion loop");
      // Recursion loop
      const currentDate = new Date(start_date);
      const endDate = new Date(form.data.recurrence_end_date!);
      endDate.setHours(23, 59, 59);

      while (currentDate <= endDate) {
        const currentDayIndex = currentDate.getDay();

        if (form.data.weekdays.includes(currentDayIndex)) {
          const dateStr = currentDate.toISOString().split("T")[0];

          // For this valid day, insert ALL sessions defined in the template
          for (const session of sessions) {
            classesToInsert.push(createClass(dateStr, session, locals.location.id));
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Insert
    const { error } = await locals.supabase.from("classes").insert(classesToInsert);
    if (error) return setError(form, "", error.message);

    return { form };
  }
};
