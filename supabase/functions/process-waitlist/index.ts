import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || payload.type !== "INSERT") {
      return new Response("Not an insert event", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("class_type, start_time, location:locations(name)")
      .eq("id", record.class_id)
      .single();

    if (classError || !classData) throw new Error("Class not found");

    const className = classData.class_type;
    const startTime = new Date(classData.start_time).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (record.type === "waitlist_promoted") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("push_token")
        .eq("id", record.profile_id)
        .single();

      if (profile?.push_token) {
        const message =
          `You are in! You have been promoted from the waitlist for ${className} at ${startTime}.`;
        await sendPushNotification(
          profile.push_token,
          "Waitlist Promotion",
          message,
        );
      }
    } else if (record.type === "spot_broadcasted") {
      const { data: waitlistedBookings } = await supabase
        .from("bookings")
        .select("profile:profiles!bookings_user_id_fkey(push_token)")
        .eq("class_id", record.class_id)
        .eq("status", "waitlist");

      const tokens = waitlistedBookings
        ?.map((b: any) => b.profile?.push_token)
        .filter(Boolean) || [];

      if (tokens.length > 0) {
        const message =
          `A spot just opened up for ${className} at ${startTime}. First come, first served!`;
        await sendPushBroadcast(tokens, "Spot Available", message);
      }
    }

    await supabase
      .from("notification_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", record.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function sendPushNotification(
  token: string,
  title: string,
  body: string,
) {
  console.log(`Sending to ${token}: ${title} - ${body}`);
  // Insert actual Expo/FCM/APNS logic here
}

async function sendPushBroadcast(
  tokens: string[],
  title: string,
  body: string,
) {
  console.log(`Broadcasting to ${tokens.length} devices: ${title} - ${body}`);
  // Insert actual Expo/FCM/APNS logic here
}
