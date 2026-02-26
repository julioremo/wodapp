export const load = async ({ locals }) => {
  const { data: workouts, error } = await locals.supabase
    .from("workouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching workouts:", error);
  }

  return {
    workouts: workouts ?? []
  };
};
