import { fail } from "@sveltejs/kit";
import { activeGymSchema } from "@wodapp/core";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

export const load = async ({ parent }) => {
  const { memberships, profile, activeLocation } = await parent();
  const activeMemberships = memberships.filter((m) => m.status === "active");
  const initialData = {
    last_location_id: activeLocation?.id || profile?.last_location_id || ""
  };
  const form = await superValidate(initialData, zod4(activeGymSchema));

  return {
    activeMemberships,
    form
  };
};

export const actions = {
  default: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: "Unauthorized" });

    const form = await superValidate(request, zod4(activeGymSchema));
    if (!form.valid) return fail(400, { form });

    const { error } = await supabase
      .from("profiles")
      .update({ last_location_id: form.data.last_location_id })
      .eq("id", user.id);

    if (error) {
      return fail(500, { message: "Failed to update active gym." });
    }
    return message(form, "Active gym updated!");
  }
};
