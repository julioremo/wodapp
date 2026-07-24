import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { logScoreSchema } from '@wodapp/core';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) error(401, "Unauthorized");

    const { data: recentActivity, error: dbError } = await supabase
        .from("benchmarks")
        .select(`
      id,
      score,
      reps,
      date,
      movements (name, category, slug, measurement_type)
    `)
        .eq("profile_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

    if (dbError) {
        console.error(dbError);
        throw error(500, "Error loading recent benchmarks");
    }

    return {
        recentActivity: recentActivity ?? [],
    };
};


export const actions = {
  logScore: async ({ request, locals }) => {
    // 1. Get the authenticated user (adjust according to your auth setup)
    const session = await locals.supabase.auth.getSession();
    const user = session.data.session?.user;
    
    if (!user) {
      return fail(401, { error: 'You must be logged in to log a score.' });
    }

    // 2. Parse the form
    const formData = await request.formData();
    const parsed = logScoreSchema.safeParse(Object.fromEntries(formData));
    
    if (!parsed.success) {
      return fail(400, {
        data: Object.fromEntries(formData),
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { movement_id, score, reps, notes, date } = parsed.data;

    // 3. Build the payload. Omit date if it's empty so Postgres uses CURRENT_DATE
    const payload: any = {
      profile_id: user.id,
      movement_id,
      score,
      reps,
      notes
    };
    if (date) payload.date = date;

    // 4. Insert into the database
    const { error } = await locals.supabase
      .from('benchmarks')
      .insert(payload);

    if (error) {
      return fail(500, { data: Object.fromEntries(formData), error: error.message });
    }

    return { success: true };
  }
};
