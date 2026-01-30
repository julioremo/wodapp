import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
  const today = new Date().toISOString();

  // 1. Fetch "Problem Classes" (Tasks)
  // Logic: Future classes where coach OR workout is null
  const { data: tasks } = await locals.supabase
    .from('classes')
    .select('*, workout:workouts(title), coach:profiles(full_name)')
    .eq('location_id', locals.location.id)
    .gt('start_time', today)
    .or('coach_id.is.null,workout_id.is.null') // Supabase specific syntax
    .order('start_time', { ascending: true })
    .limit(5);

  // 2. Fetch Weekly Schedule (Calendar)
  // For MVP, we just grab "This Week". Later we can parse ?week=... from URL
  const startOfWeek = new Date(); // Calculate real Monday here if desired
  startOfWeek.setHours(0,0,0,0);
  
  const { data: schedule } = await locals.supabase
    .from('classes')
    .select('*, workout:workouts(title), coach:profiles(full_name)')
    .eq('location_id', locals.location.id)
    .gte('start_time', startOfWeek.toISOString())
    .order('start_time', { ascending: true });

  return { tasks: tasks ?? [], schedule: schedule ?? [] };
};

export const actions = {
  delete: async ({ request }) => {
    const formData = await request.formData();
    const classId = formData.get('classId') as string;

    if (!classId) return fail(400, { error: 'Class ID missing' });

    const { error } = await locals.supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) return fail(500, { error: error.message });

    return { success: true };
  }
};