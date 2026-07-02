import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Extract IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp;
  
  // Localhost fallback
  const isLocal = !ip || ip.includes('::1') || ip.includes('localhost') || ip === '127.0.0.1';
  if (isLocal) {
    ip = ''; 
  }

  let country = isLocal ? 'تطوير محلي (Local)' : 'غير متوفر';
  let finalIp = isLocal ? 'Localhost (تطوير)' : (ip || 'غير متوفر');

  try {
    // Server-side fetch bypasses client-side AdBlockers and Incognito restrictions
    if (!isLocal) {
      const res = await fetch(`http://ip-api.com/json/${ip}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          country = data.country || 'غير متوفر';
          finalIp = data.query || finalIp;
        }
      }
    }
  } catch (e) {
    console.error('IP fetch error:', e);
  }

  return NextResponse.json({ ip: finalIp, country });
}
// Force Next.js to recompile this file
