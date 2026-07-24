import { error } from "@sveltejs/kit";
import { calculateAge } from "@wodapp/core";
import type { PageServerLoad } from "./$types";
import type { StandardsSet } from "./distribution.types";

export const load: PageServerLoad = async ({ params, parent, locals: { supabase } }) => {
  const { profile, user, activeLocation } = await parent();

  const { category, slug } = params;

  const userAge = profile?.birthdate ? calculateAge(profile.birthdate) : 18;

  const userGender = profile?.gender || "male";
  const otherGender = userGender === "male" ? "female" : "male";

  // 1. Fetch the movement
  const { data: movement, error: movError } = await supabase
    .from("movements")
    .select("id, name, category, measurement_type, description")
    .eq("slug", slug)
    .eq("category", category)
    .single();

  if (movError || !movement) throw error(404, "Movement not found");

  // 2. Fetch movement standards
  const openMinAge = 18;
  const openMaxAge = 39;

  const userFilter = `and(min_age.lte.${userAge},max_age.gte.${userAge},min_bodyweight_kg.lte.${profile.weight},or(max_bodyweight_kg.gte.${profile.weight},max_bodyweight_kg.is.null))`;

  const generalFilter = `and(min_age.eq.${openMinAge},max_age.eq.${openMaxAge},min_bodyweight_kg.lte.${profile.weight},or(max_bodyweight_kg.gte.${profile.weight},max_bodyweight_kg.is.null))`;

  const { data: movement_standards, error: standardsError } = await supabase
    .from("movement_standards")
    .select("*")
    .eq("movement_id", movement.id)
    .or(`${userFilter},${generalFilter}`);

  if (standardsError) throw error(500, "Failed to load standards");

  const isUserAgeBracket = (row) => row.min_age <= userAge && row.max_age >= userAge;
  const isOpenBracket = (row) => row.min_age === openMinAge && row.max_age === openMaxAge;

  const standardsSelection: {
    ageWeightAdjusted: StandardsSet, 
    general: StandardsSet
  } = {
    ageWeightAdjusted: {
      myGender: movement_standards?.find((s) => s.gender === userGender && isUserAgeBracket(s)) || null,
      otherGender: movement_standards?.find((s) => s.gender === otherGender && isUserAgeBracket(s)) || null
    },
    general: {
      myGender: movement_standards?.find((s) => s.gender === userGender && isOpenBracket(s)) || null,
      otherGender: movement_standards?.find((s) => s.gender === otherGender && isOpenBracket(s)) || null
    }
  };

  // TODO: if existing, add general's world record to adjusted

  // 2. Fetch the chronological history
  const { data: history, error: histError } = await supabase
    .from("benchmarks")
    .select("id, score, reps, estimated_1rm, notes, date")
    .eq("profile_id", user.id)
    .eq("movement_id", movement.id)
    .order("date", { ascending: true });

  if (histError) throw error(500, "Failed to load history");

  // 3. Fetch peer benchmarks
  if (!activeLocation) throw error(500, "Failed to load active location");

  const { data: peers, error: peersError } = await supabase
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
    .eq("profiles.benchmarks.movement_id", movement.id);

  if (peersError) throw error(500, "Failed to load peers");

  const flattenedPeers = peers.filter((peer) => peer.profile !== null).map((peer) => peer.profile);

  return {
    movement,
    standardsSelection,
    history: history ?? [],
    peers: flattenedPeers,
    profile,
    user
  };
};
