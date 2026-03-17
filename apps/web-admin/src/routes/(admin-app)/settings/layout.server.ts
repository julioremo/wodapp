import { error } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  if (!locals.userRole || !["admin", "manager"].includes(locals.userRole)) {
    error(403, "You do not have permission to modify gym settings.");
  }

  return {};
};
