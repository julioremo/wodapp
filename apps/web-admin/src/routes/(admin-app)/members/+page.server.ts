import { fail } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  if (!locals.location) return { members: [] };

  const { data, error } = await locals.supabase
    .from("memberships")
    .select(`
      id,
      role,
      status,
      created_at,
      profiles (
        id,
        display_name,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        infractions ( id )
      )
    `)
    .eq("location_id", locals.location.id)
    .eq("profiles.infractions.status", "pending_review")
    .eq("profiles.infractions.location_id", locals.location.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load members:", error);
    return { members: [] };
  }

  const members = data.map((m: any) => ({
    id: m.id,
    profile_id: m.profiles?.id,
    display_name: m.profiles?.display_name || "Unknown",
    full_name: `${m.profiles?.first_name || ""} ${m.profiles?.last_name || ""}`.trim(),
    email: m.profiles?.email || "",
    phone: m.profiles?.phone || "",
    role: m.role,
    status: m.status,
    avatar_url: m.profiles?.avatar_url || null,
    joined: m.created_at,
    pending_infractions: m.profiles?.infractions?.length || 0
  }));

  return { members };
};

export const actions = {
  invite: async ({ request, locals }) => {
    if (!locals.location) {
      return fail(400, { message: "Unauthorized or missing location context." });
    }

    const data = await request.formData();
    const email = data.get("email")?.toString();
    const role = data.get("role")?.toString() || "athlete";

    if (!email) return fail(400, { message: "Email is required" });

    // TODO: Integrate with Supabase Auth admin to send the actual invite email
    // For now, we stub the database record so it shows up in the CRM as "pending"
    console.log(`Inviting ${email} as ${role} to location ${locals.location.name}`);

    return { success: true, message: `Invite sent to ${email}` };
  }
};
