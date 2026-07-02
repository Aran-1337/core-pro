import { createClient } from "@/utils/supabase/client";
import { LiveSession, SessionBooking } from "@/types";

/**
 * Fetches all published live sessions for students.
 */
export async function getPublishedLiveSessions(): Promise<LiveSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('is_published', true)
    .order('session_date', { ascending: true });
    
  if (error) {
    console.error("Error fetching live sessions:", error);
    return [];
  }
  return data as LiveSession[];
}

/**
 * Fetches all live sessions for the admin panel.
 */
export async function getAllLiveSessionsAdmin(): Promise<LiveSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .order('session_date', { ascending: false });
    
  if (error) {
    console.error("Error fetching admin live sessions:", error);
    return [];
  }
  return data as LiveSession[];
}

/**
 * Fetches all bookings for a specific session.
 */
export async function getSessionBookingsAdmin(sessionId: string): Promise<SessionBooking[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_bookings')
    .select('*, users(*)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching session bookings:", error);
    return [];
  }
  return data as SessionBooking[];
}

/**
 * Fetches all sessions booked by a specific user.
 */
export async function getUserBookedSessions(userId: string): Promise<any[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('session_bookings')
    .select('*, live_sessions(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching user booked sessions:", error);
    return [];
  }
  return data || [];
}

/**
 * Fetches the upcoming live sessions (for admin or generic display).
 */
export async function getUpcomingSessions(limit: number = 3): Promise<LiveSession[]> {
  const supabase = createClient();
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .gte('session_date', now)
    .order('session_date', { ascending: true })
    .limit(limit);
    
  if (error) {
    console.error("Error fetching upcoming sessions:", error);
    return [];
  }
  return data as LiveSession[];
}
