import { fail } from "@sveltejs/kit";
import { publicProfileSchema } from "@wodapp/core";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

export const load = async ({ parent }) => {
  const { profile } = await parent();
  const form = await superValidate(profile || {}, zod4(publicProfileSchema));
  return { form };
};

export const actions = {
  default: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: "Unauthorized" });

    const form = await superValidate(request, zod4(publicProfileSchema));
    if (!form.valid) return fail(400, { form });

    const { error } = await supabase.from("profiles").update(form.data).eq("id", user.id);
    if (error) return message(form, "Failed to update profile.", { status: 500 });

    return message(form, "Public profile updated!");
  }
};
