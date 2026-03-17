import { error, fail } from "@sveltejs/kit";
import type { Membership, Profile, UserRole } from "@wodapp/types";

type MembershipWithProfile = Membership & {
  profiles: Profile;
};

export const load = async ({ params, locals }) => {
  if (!locals.location) throw error(401, "Unauthorized");

  // 1. Fetch Membership & Profile
  const { data, error: fetchError } = await locals.supabase
    .from("memberships")
    .select(`
      *,
      profiles!inner (*)
    `)
    .eq("id", params.id)
    .eq("location_id", locals.location.id)
    .single();

  if (fetchError || !data) throw error(404, "Member not found");
  const membership = data as unknown as MembershipWithProfile;

  // 2. Fetch Actual Bookings/Attendance
  const { data: bookings } = await locals.supabase
    .from("bookings")
    .select(`
      status,
      classes!inner (
        date,
        class_type
      )
    `)
    .eq("profile_id", membership.profiles.id)
    .in("status", ["confirmed"]); // Filter out cancelled/no-shows

  // Map to the year/month/day format expected by the calendar snippet
  const attendances = (bookings || []).map((b) => {
    const classData = Array.isArray(b.classes) ? b.classes[0] : b.classes;
    const d = new Date(classData.start_time);

    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1, // @internationalized/date months are 1-12
      day: d.getDate(),
      type: classData.name
    };
  });

  return {
    membership,
    attendances
  };
};

export const actions = {
  updateAdministration: async ({ request, params, locals }) => {
    if (!locals.location) return fail(401, { message: "Unauthorized" });

    const data = await request.formData();
    const role = data.get("role")?.toString() as UserRole;
    const status = data.get("status")?.toString();

    if (!role || !status) return fail(400, { message: "Missing fields" });

    const { error: updateError } = await locals.supabase
      .from("memberships")
      .update({ role, status })
      .eq("id", params.id)
      .eq("location_id", locals.location.id);

    if (updateError) return fail(500, { message: updateError.message });

    return { success: true, message: "Membership updated successfully" };
  }
};
