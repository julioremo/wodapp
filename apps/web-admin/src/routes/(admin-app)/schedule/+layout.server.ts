import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/login");

  const { data: coaches } = await locals.supabase
    .from("memberships")
    .select("...profiles(id, full_name)")
    .eq("location_id", locals.location?.id)
    .in("role", ["coach", "manager", "admin"]);

  return {
    coaches: coaches || []
  };
};
