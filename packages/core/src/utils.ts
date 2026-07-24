import { differenceInYears, parseISO } from "date-fns";

/**
 * Calculates a person's age in full years based on their birthdate.
 * @param birthdate - The birthdate as a Date object or an ISO string (e.g., "1990-05-15")
 * @returns The age in years
 */
export function calculateAge(birthdate: string | Date): number {
  const birthDateObj = typeof birthdate === "string" ? parseISO(birthdate) : birthdate;
  const today = new Date();

  return differenceInYears(today, birthDateObj);
}
