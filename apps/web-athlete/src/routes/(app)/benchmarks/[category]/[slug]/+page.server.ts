import { error } from "@sveltejs/kit";
import { calculateAge } from "@wodapp/core";
import type { PageServerLoad } from "./$types";
import type { StandardsSet } from "./distribution.types";

export const load: PageServerLoad = async ({ params, parent, locals: { supabase } }) => {
  const { profile, user, activeLocation } = await parent();
  const { category, slug } = params;

  // 1. Fetch the movement (critical data)
  const { data: movement, error: movError } = await supabase
    .from("movements")
    .select("id, name, category, measurement_type, description")
    .eq("slug", slug)
    .eq("category", category)
    .single();

  if (movError || !movement) throw error(404, "Movement not found");

  // variables for subsequent queries
  const userAge = profile?.birthdate ? calculateAge(profile.birthdate) : 18;
  const userGender = profile?.gender || "male";
  const otherGender = userGender === "male" ? "female" : "male";
  const userWeight = profile?.weight ?? 0;
  const openMinAge = 18;
  const openMaxAge = 39;

  // 2. Fetch movement standards (non-critical data)
  const userFilter = `and(min_age.lte.${userAge},max_age.gte.${userAge},min_bodyweight_kg.lte.${userWeight},or(max_bodyweight_kg.gte.${userWeight},max_bodyweight_kg.is.null))`;
  const generalFilter = `and(min_age.eq.${openMinAge},max_age.eq.${openMaxAge},min_bodyweight_kg.lte.${userWeight},or(max_bodyweight_kg.gte.${userWeight},max_bodyweight_kg.is.null))`;

  const standardsPromise = supabase
    .from("movement_standards")
    .select("*")
    .eq("movement_id", movement.id)
    .or(`${userFilter},${generalFilter}`);

  const historyPromise = supabase
    .from("benchmarks")
    .select("id, score, reps, estimated_1rm, notes, date")
    .eq("profile_id", user.id)
    .eq("movement_id", movement.id)
    .order("date", { ascending: true });

  const peersPromise = activeLocation
    ? supabase
        .from("memberships")
        .select(`
            profile_id,
            profile:profiles (
                id, display_name, birthdate, gender, avatar_url, emoji,
                benchmarks!inner (
                    id, score, reps, estimated_1rm, notes, date
                )
            )
        `)
        .eq("status", "active")
        .eq("location_id", activeLocation.id)
        .eq("profiles.benchmarks.movement_id", movement.id)
    : Promise.resolve({ data: null, error: null }); // Safe fallback if no location

  // Execute them all simultaneously
  const [
    { data: movement_standards, error: standardsError },
    { data: history, error: histError },
    { data: peers, error: peersError }
  ] = await Promise.all([standardsPromise, historyPromise, peersPromise]);

  // 3. Handle errors (Log, don't crash)
  if (standardsError) console.error("Standards fetch failed:", standardsError.message);
  if (histError) console.error("History fetch failed:", histError.message);
  if (peersError) console.error("Peers fetch failed:", peersError.message);

  const isUserAgeBracket = (row) => row.min_age <= userAge && row.max_age >= userAge;
  const isOpenBracket = (row) => row.min_age === openMinAge && row.max_age === openMaxAge;

  const standardsSelection: {
    ageWeightAdjusted: StandardsSet;
    general: StandardsSet;
  } = {
    ageWeightAdjusted: {
      myGender:
        movement_standards?.find((s) => s.gender === userGender && isUserAgeBracket(s)) || null,
      otherGender:
        movement_standards?.find((s) => s.gender === otherGender && isUserAgeBracket(s)) || null
    },
    general: {
      myGender:
        movement_standards?.find((s) => s.gender === userGender && isOpenBracket(s)) || null,
      otherGender:
        movement_standards?.find((s) => s.gender === otherGender && isOpenBracket(s)) || null
    }
  };
  // TODO: if existing, add general's world record to adjusted

  const flattenedPeers = peers
    ? peers.filter((peer) => peer.profile !== null).map((peer) => peer.profile)
    : [];

  return {
    movement,
    standardsSelection,
    history: history ?? [],
    peers: flattenedPeers,
    profile,
    user,
    userAge
  };
};
