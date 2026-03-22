create trigger waitlist_notifications_trigger
  after insert on public.notification_events
  for each row
  execute function supabase_functions.http_request(
    'https://dcocwpokwurfothfjcws.supabase.co/functions/v1/process-waitlist',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '1000'
  );