import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (
    { params, locals: { supabase } },
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) error(401, "Unauthorized");

    const category = params.category.toLowerCase();
    const validCategories = ["weight", "distance", "skill"];
    if (!validCategories.includes(category)) error(404, "Category not found");

    // 1. Fetch the taxonomy for this category
    const { data: movements, error: movError } = await supabase
        .from("movements")
        .select("id, name, slug, measurement_type")
        .eq("category", category)
        .order("name", { ascending: true });

    if (movError || !movements) throw error(500, "Failed to load movements");

    // 2. Fetch all user records for these movements
    const movementIds = movements.map((m) => m.id);
    const { data: records, error: recError } = await supabase
        .from("benchmarks")
        .select("movement_id, score, estimated_1rm")
        .eq("profile_id", user.id)
        .in("movement_id", movementIds);

    if (recError) throw error(500, "Failed to load records");

    // 3. Calculate PRs based on measurement type
    const prMap = new Map();

    records?.forEach((record) => {
        const mov = movements.find((m) => m.id === record.movement_id);
        if (!mov) return;

        const currentPr = prMap.get(mov.id);
        // Use the 1RM for weights, otherwise the raw score
        const compareValue = mov.measurement_type === "weight"
            ? record.estimated_1rm
            : record.score;

        if (currentPr === undefined) {
            prMap.set(mov.id, compareValue);
        } else {
            // Time is the only metric where a lower score is a PR
            const isTime = mov.measurement_type === "time";
            if (isTime && compareValue < currentPr) {
                prMap.set(mov.id, compareValue);
            }
            if (!isTime && compareValue > currentPr) {
                prMap.set(mov.id, compareValue);
            }
        }
    });

    const movementsWithPRs = movements.map((m) => ({
        ...m,
        pr: prMap.get(m.id) ?? null,
    }));

    return {
        category,
        movements: movementsWithPRs,
    };
};
