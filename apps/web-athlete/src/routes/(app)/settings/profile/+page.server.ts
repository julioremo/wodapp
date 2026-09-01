import { fail } from "@sveltejs/kit";
import { avatarSchema, displayNameSchema } from "@wodapp/core";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { createProfileUpdateAction } from "$lib/profile";

export const load = async ({ parent }) => {
  const { profile } = await parent();

  const nameForm = await superValidate(profile || {}, zod4(displayNameSchema));
  const avatarForm = await superValidate(profile || {}, zod4(avatarSchema));

  return { nameForm, avatarForm };
};

export const actions = {
  updateName: createProfileUpdateAction(displayNameSchema, "Display name updated"),

  updateAvatar: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: "Unauthorized" });

    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    // Use a blank schema to ensure Superforms generates a valid response object.
    const form = await superValidate(formData, zod4(z.object({})));

    if (!file || file.size === 0) {
      return fail(400, { message: "No file provided" });
    }

    const filePath = user.id;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return fail(500, { message: "Storage upload failed" });

    // Generate the cache-busting public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);
    if (dbError) return fail(500, { message: "Database update failed" });

    return message(form, "Avatar updated successfully");
  }
};
