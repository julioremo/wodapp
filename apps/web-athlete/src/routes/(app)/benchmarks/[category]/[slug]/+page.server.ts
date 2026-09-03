import { error } from "@sveltejs/kit";
import type { UserPreferences } from "@wodapp/core";
import { calculateAge } from "@wodapp/core";
import type { PageServerLoad } from "./$types";
import type { Peer, StandardsSet } from "./distribution.types";

export const load: PageServerLoad = async ({ params, parent, locals: { supabase } }) => {
  const { profile, user, activeLocation } = await parent();
  if (!user) error(401, "Unauthorized");
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
    .select("*")
    .eq("profile_id", user.id)
    .eq("movement_id", movement.id)
    .order("date", { ascending: true });

  const peersPromise = activeLocation
    ? supabase
        .from("memberships")
        .select(`
            profile_id,
            profile:profiles (
                id, display_name, birthdate, gender, weight, avatar_url, preferences,
                benchmarks!inner (
                    id, score, reps, estimated_1rm, notes, date
                )
            )
        `)
        .eq("status", "active")
        .eq("location_id", activeLocation.id)
        .eq("profiles.benchmarks.movement_id", movement.id)
        .then(({ data, error }) => {
          if (error || !data) return { data, error };
          // Mask identities on the server before the browser ever sees them
          const peers = data.map((membership) => {
            const profile = membership.profile;

            // Default to true if the preference doesn't exist yet
            const prefs = profile?.preferences as UserPreferences | null;
            const isPublic = prefs?.privacy?.show_on_leaderboard ?? true;

            if (!isPublic && profile) {
              profile.display_name = null;
              profile.avatar_url = null;
              // TODO: wipe demographic data so they can't be guessed?
              // profile.gender = null;
              // profile.birthdate = null;
            }

            return membership;
          });

          return { data: peers, error };
        })
    : Promise.resolve({ data: null, error: null });

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

  type BracketRow = { min_age: number; max_age: number };
  const isUserAgeBracket = (row: BracketRow) => row.min_age <= userAge && row.max_age >= userAge;
  const isOpenBracket = (row: BracketRow) =>
    row.min_age === openMinAge && row.max_age === openMaxAge;

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

  const flattenedPeers: Peer[] = peers
    ? peers
        .filter((peer) => peer.profile !== null)
        .map((peer) => {
          const p = peer.profile;

          // Calculate age from birthdate
          let age: number | undefined;
          if (p.birthdate) {
            const birthDateObj = new Date(p.birthdate);
            const today = new Date();
            age = today.getFullYear() - birthDateObj.getFullYear();
            const m = today.getMonth() - birthDateObj.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
              age--;
            }
          }

          return {
            ...p,
            age,
            display_name: p.display_name ?? undefined,
            avatar_url: p.avatar_url ?? undefined,
            gender: p.gender ?? undefined,
            weight: p.weight ?? undefined
          };
        })
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
