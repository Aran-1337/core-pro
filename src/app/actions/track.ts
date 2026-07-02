"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function trackUserLocation() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const headerStore = await headers();
    const forwardedFor = headerStore.get('x-forwarded-for');
    let ip = forwardedFor ? forwardedFor.split(',')[0] : 'Localhost';
    let country = headerStore.get('x-vercel-ip-country') || 'Unknown';

    // If localhost, try to fetch from ipapi.co
    if (ip === 'Localhost' || ip === '::1' || ip === '127.0.0.1') {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.ip) ip = data.ip;
        if (data.country_name) country = data.country_name;
      } catch (e) {
        // ignore
      }
    }

    await supabase.from('users').update({ last_ip: ip, country: country }).eq('id', user.id);
  } catch (err) {
    console.error("Failed to track location:", err);
  }
}
