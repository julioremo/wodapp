import type { SupabaseClient } from "@supabase/supabase-js";
import { addMinutes } from "date-fns";

export async function enforcePenalty(
  supabase: SupabaseClient,
  profileId: string,
  locationId: string,
  penalty: any,
  infractionIds: string[]
) {
  if (penalty.type === "credit_deduction") {
    const { error } = await supabase.rpc("deduct_membership_credit", {
      p_profile_id: profileId,
      p_location_id: locationId,
      p_amount: 1
    });
    if (error) throw new Error("Failed to deduct class credit.");
  } else if (penalty.type === "booking_delay") {
    const { error } = await supabase.rpc("increment_booking_delay", {
      p_profile_id: profileId,
      p_location_id: locationId,
      p_minutes: penalty.delay_minutes
    });
    if (error) throw new Error("Failed to apply booking delay.");
  } else if (penalty.type === "fee") {
    const { error } = await supabase.from("charges").insert({
      profile_id: profileId,
      location_id: locationId,
      amount: penalty.amount,
      description: "Late cancellation penalty",
      status: "pending"
    });
    if (error) throw new Error("Failed to queue penalty fee.");
  }

  const { error: resolveError } = await supabase
    .from("infractions")
    .update({ status: "penalty_applied" })
    .in("id", infractionIds);

  if (resolveError) throw new Error("Failed to resolve applied infractions.");
}
