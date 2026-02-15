import { fail, error } from '@sveltejs/kit';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

export const load = async ({ url, parent, locals: { supabase } }) => {
    const { activeLocation } = await parent();

    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });

    if (!activeLocation) {
        return { classes: [], weekStart };
    }

    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

    const date = url.searchParams.get('date') || new Date().toISOString();
    const filterType = url.searchParams.get('type'); // 'wod', 'open_gym', etc.

    let query = supabase
        .from('classes')
        .select('...')
        .eq('date', date);

    // Apply Filter Server-Side
    if (filterType) {
        query = query.eq('type', filterType);
    }

    const { data: classes, error: dbError } = await supabase
        .from('classes')
        .select(`
            *,
            coach:profiles (id, full_name, avatar_url),
            bookings (
                id,
                profile_id,
                status,
                profile:profiles (avatar_url)
            )
        `)
        .eq('location_id', activeLocation.id)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time', { ascending: true });

    if (dbError) {
        console.error("Error fetching classes:", dbError);
        throw error(500, 'Could not fetch schedule.');
    }

    // 2. Fetch Metadata for Filters (Lightweight queries)
  
    // A. Get unique types from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: rawTypes } = await supabase
        .from('classes')
        .select('class_type')
        //.gte('date', sixMonthsAgo.toISOString());

    // Deduplicate and Sort
    // Result: ['Conditioning', 'Open Gym', 'Weightlifting', 'WOD']
    const allClassTypes = [...new Set(rawTypes?.map(r => r.class_type))].sort();

    // B. Get Time Boundaries for the current view
    // (Simplification: We can just use hardcoded gym hours like 06:00 to 22:00 
    // or calculate min/max from the fetched 'classes' array)
    // Let's assume standard Gym Hours for the slider bounds:
    const bounds = { min: 360, max: 1440 }; // 06:00 to 22:00 in minutes

    return { 
        classes, 
        weekStart,
        filterOptions: {
            allClassTypes,
            bounds
        }
     };
};

export const actions = {
  toggleBooking: async ({ request, locals }) => {
    const formData = await request.formData();
    const classId = formData.get('classId');
    const actionType = formData.get('actionType'); // 'book' or 'cancel'

    if (!locals.user) return fail(401, { error: "Unauthorized" });

    if (actionType === 'book') {
        // 1. Create Booking
        const { error } = await locals.supabase
            .from('bookings')
            .insert({ 
                class_id: classId, 
                profile_id: locals.user.id,
                status: 'confirmed' 
            });

        if (error) {
            console.error("Booking Error:", error);
            // Handle unique violation (already booked) gracefully
            if (error.code === '23505') return { success: true }; 
            return fail(500, { error: "Could not book class." });
        }
    } else {
        // 2. Cancel Booking
        const { error } = await locals.supabase
            .from('bookings')
            .delete()
            .match({ 
                class_id: classId, 
                profile_id: locals.user.id 
            });

        if (error) return fail(500, { error: "Could not cancel booking." });
    }

    return { success: true };
  }
};