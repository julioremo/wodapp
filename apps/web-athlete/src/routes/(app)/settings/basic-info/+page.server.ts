import { personalInfoSchema } from "@wodapp/core";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { createProfileUpdateAction } from "$lib/profile";

export const load = async ({ parent }) => {
  const { profile } = await parent();
  const form = await superValidate(profile || {}, zod4(personalInfoSchema));
  return { form };
};

export const actions = {
  default: createProfileUpdateAction(personalInfoSchema, "Display name updated")
};
