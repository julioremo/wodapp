import { fail, redirect } from '@sveltejs/kit';

type ClassInsert = {
  location_id: string;
  coach_id: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
};

export const load = async ({ locals }) => {
  
  const { data: coaches } = await locals.supabase
    .from('memberships')
    .select('profile:profiles(id, full_name)')
    .eq('location_id', locals.location.id)
    .in('role', ['coach', 'manager']);

  return { coaches: coaches?.map(c => c.profile) ?? [] };
};

export const actions = {
  default: async ({ request, locals }) => {
    // 1. Security Check
    if (!locals.user || !locals.location) {
        return fail(401, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    
    // Extract Fields
    const startTimeStr = formData.get('startTime') as string;
    const duration = parseInt(formData.get('duration') as string);
    const capacity = parseInt(formData.get('capacity') as string);
    const coachId = formData.get('coachId') as string || null;
    const isRecurring = formData.get('isRecurring') === 'on';
    const selectedDays = formData.getAll('days') as string[];
    const startDateStr = formData.get('startDate') as string;
    const recurUntilStr = formData.get('recurUntil') as string;

    // 2. Determine the full date range to check for collisions
    const checkStart = new Date(startDateStr);
    let checkEnd = new Date(startDateStr);
    
    if (isRecurring && recurUntilStr) {
      checkEnd = new Date(recurUntilStr);
      // Add one day to ensure we cover the full end date in DB queries
      checkEnd.setDate(checkEnd.getDate() + 1);
    } else {
      checkEnd.setDate(checkEnd.getDate() + 1); 
    }

    // 3. Fetch EXISTING classes in this range to prevent duplicates
    const { data: existingClasses } = await locals.supabase
      .from('classes')
      .select('start_time')
      .eq('location_id', locals.location.id)
      .gte('start_time', checkStart.toISOString())
      .lte('start_time', checkEnd.toISOString());

    // Create a Set for fast lookup: "2023-10-27T09:00:00.000Z"
    const existingTimes = new Set(existingClasses?.map(c => new Date(c.start_time).toISOString()));

    // 4. Generate Candidates
    const classesToInsert: ClassInsert[] =[];
    let skippedCount = 0;
    
    // Helper to add if not exists
    const tryAddClass = (dateObj: Date) => {
        // Construct the full timestamp
        const startDateTime = new Date(`${dateObj.toISOString().split('T')[0]}T${startTimeStr}`);
        const isoString = startDateTime.toISOString();

        // THE CHECK: Does this exact time already exist?
        if (existingTimes.has(isoString)) {
            skippedCount++;
            return; // Skip this one
        }

        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
        
        classesToInsert.push({
            location_id: locals.location.id,
            coach_id: coachId,
            start_time: isoString,
            end_time: endDateTime.toISOString(),
            capacity
        });
    };

    if (!isRecurring) {
        // Single Case
        const singleDate = new Date(startDateStr);
        tryAddClass(singleDate);
    } else {
        // Recur Case
        let cursor = new Date(startDateStr);
        const until = new Date(recurUntilStr);
        
        while (cursor <= until && classesToInsert.length < 365) {
            if (selectedDays.includes(cursor.getDay().toString())) {
                tryAddClass(cursor);
            }
            cursor.setDate(cursor.getDate() + 1);
        }
    }

    // 5. Validation & Insertion
    if (classesToInsert.length === 0) {
        if (skippedCount > 0) {
             return fail(400, { error: `No new classes created. All ${skippedCount} dates were duplicates.` });
        }
        return fail(400, { error: "No dates selected for generation." });
    }

    const { error } = await locals.supabase
      .from('classes')
      .insert(classesToInsert);

    if (error) return fail(500, { error: error.message });

    // Success! Redirect.
    // Ideally we'd show a toast message here, but for now redirect is fine.
    throw redirect(303, `/schedule`);
  }
};