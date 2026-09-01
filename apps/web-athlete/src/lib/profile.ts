import { fail, type RequestEvent } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { ZodObject } from "zod";

export function createProfileUpdateAction(schema: ZodObject, successMessage: string) {
  return async ({ request, locals: { supabase, user } }: RequestEvent) => {
    if (!user) return fail(401, { message: "Unauthorized" });

    const form = await superValidate(request, zod4(schema));
    if (!form.valid) return fail(400, { form });

    const { error } = await supabase
      .from("profiles")
      .update(form.data as any)
      .eq("id", user.id);

    if (error) return message(form, "Failed to save profile.", { status: 500 });
    return message(form, successMessage);
  };
}
