import { fail, error } from '@sveltejs/kit';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

export const load = async ({ url, parent, locals: { supabase } }) => {
    const { activeLocation } = await parent();

    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday

    if (!activeLocation) {
        return { classes: [], weekStart };
    }

    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

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

    return { classes, weekStart };
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