import { json } from "@sveltejs/kit";

export const GET = async ({ url, locals }) => {
  const date = url.searchParams.get("date");
  const type = url.searchParams.get("type");

  if (!date || !type) return json([]);

  const { data } = await locals.supabase
    .from("classes")
    .select("id, start_time")
    .eq("class_type", type)
    // Filter by full day
    .gte("start_time", `${date}T00:00:00`)
    .lte("start_time", `${date}T23:59:59`)
    .order("start_time");

  return json(data ?? []);
};
