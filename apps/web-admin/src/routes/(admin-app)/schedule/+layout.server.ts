import { redirect } from "@sveltejs/kit";
import { defaultSession } from "$lib/schemas/schedule.js";

export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/login");

  const { data: coaches } = await locals.supabase
    .from("memberships")
    .select("...profiles(id, full_name)")
    .eq("location_id", locals.location?.id)
    .in("role", ["coach", "manager", "admin"]);

  const { data: uniqueTypes } = await locals.supabase.rpc("get_unique_class_types");

  // temporary mock data
  const workouts = [
    { id: "100226", title: "WOD 100226" },
    { id: "110226", title: "WOD 110226" }
  ];

  return {
    coaches: coaches || [],
    classTypes: uniqueTypes?.map((row) => row.class_type) || [],
    workouts: workouts
  };
};
