"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { createClient } from "@/utils/supabase/client";

export default function NavBar() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { items } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const isAdminRoute = pathname.startsWith("/admin");

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    const supabase = createClient();

    const handleSession = async (session: any) => {
      setIsLoggedIn(!!session);
      if (session) {
        // Parse User Agent for Browser and Device
        const ua = navigator.userAgent;
        let browser = "غير معروف";
        let device = "Desktop";

        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
        else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
        else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";

        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
          device = "Mobile/Tablet";
        }

        // Fetch IP silently via internal API (Bypasses Adblockers & Incognito restrictions)
        let ip = null;
        let country = null;
        try {
          const res = await fetch('/api/track');
          if (res.ok) {
            const ipData = await res.json();
            ip = ipData.ip;
            country = ipData.country;
          }
        } catch(e) {}

        // Safe fetch and update
        const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        
        if (data) {
          // Check if account is suspended
          if (data.status === 'SUSPENDED') {
            await supabase.auth.signOut();
            window.location.href = '/login?error=suspended';
            return;
          }

          // Check if IP is blocked
          const blockedIps = Array.isArray(data.blocked_ips) ? data.blocked_ips : [];
          if (ip && blockedIps.includes(ip)) {
            await supabase.auth.signOut();
            window.location.href = '/login?error=ip_blocked';
            return;
          }

          // Update tracking info and session history
          const updatePayload: any = {};
          if (browser !== "غير معروف") updatePayload.browser = browser;
          if (device) updatePayload.device = device;
          if (ip) updatePayload.last_ip = ip;
          if (country) updatePayload.country = country;
          
          // Manage login_sessions
          const currentSessions = Array.isArray(data.login_sessions) ? data.login_sessions : [];
          const sessionIdentifier = `${ip}-${browser}-${device}`;
          const sessionExists = currentSessions.find((s: any) => `${s.ip}-${s.browser}-${s.device}` === sessionIdentifier);
          
          if (!sessionExists && ip) {
            updatePayload.login_sessions = [
              ...currentSessions,
              { ip, country, browser, device, timestamp: new Date().toISOString() }
            ];
          }
          
          if (Object.keys(updatePayload).length > 0) {
            // We ignore errors because columns might not exist yet
            supabase.from('users').update(updatePayload).eq('id', session.user.id).then();
          }
        }

        let currentAvatar = data?.avatar_url;
        let isUserAdmin = false;

        if (data?.role === 'ADMIN') {
          setIsAdmin(true);
          isUserAdmin = true;
        } else {
          setIsAdmin(false);
        }

        // If admin has no personal avatar, try to use the instructor profile avatar
        if (isUserAdmin && !currentAvatar) {
          const { data: profileData } = await supabase.from('site_settings').select('value').eq('key', 'instructor_profile').single();
          if (profileData && profileData.value && profileData.value.avatar_url) {
            currentAvatar = profileData.value.avatar_url;
          }
        }

        if (currentAvatar) {
          setAvatarUrl(currentAvatar);
        } else {
          setAvatarUrl("");
        }
      } else {
        setIsAdmin(false);
        setAvatarUrl("");
      }
      setIsLoadingAuth(false);
    };
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-surface-container/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,210,255,0.1)]">
      <div className="flex flex-row-reverse justify-between items-center px-container-margin w-full max-w-7xl mx-auto h-20">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display-lg text-display-lg-mobile md:text-display-lg font-bold text-primary">
            CORE
          </Link>
        </div>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex flex-row-reverse items-center gap-8">
          {isAdminRoute ? (
            <>
              <Link href="/admin" className="font-body-base text-on-surface-variant hover:text-on-surface transition-colors">
                الرئيسية
              </Link>
              <Link href="/admin/students" className="font-body-base text-on-surface-variant hover:text-on-surface transition-colors">
                الطلاب
              </Link>
              <Link href="/" className="font-body-base text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                معاينة الموقع
              </Link>
            </>
          ) : (
            <>
              {isLoggedIn && (
                <Link href={isAdmin ? "/admin" : "/dashboard"} className="font-body-base text-on-surface-variant hover:text-on-surface transition-colors">
                  {isAdmin ? "لوحة الإدارة" : "الرئيسية"}
                </Link>
              )}
              <Link href="/courses" className="font-body-base text-on-surface-variant hover:text-on-surface transition-colors">
                الكورسات
              </Link>
              <Link href="/store" className="font-body-base text-on-surface-variant hover:text-on-surface transition-colors">
                المتجر
              </Link>
              <Link href="/live-sessions" className="font-body-base text-on-surface-variant hover:text-on-surface transition-colors">
                حصص مباشرة
              </Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          
          {isLoadingAuth ? (
            <div className="w-24 h-10 bg-white/5 rounded-lg animate-pulse"></div>
          ) : !isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/login" className="font-body-base text-on-surface hover:text-primary transition-colors">
                تسجيل الدخول
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-bold hover:brightness-110 transition-all text-sm">
                حساب جديد
              </Link>
            </div>
          ) : (
            <>
              {!isAdminRoute && !isAdmin && (
                <>
                  <Link href="/cart" className="relative p-2 rounded-full hover:bg-white/5 transition-all text-on-surface hover:text-primary">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {items.length > 0 && (
                      <span className="absolute 0 top-0 right-0 w-4 h-4 bg-error text-on-error flex items-center justify-center rounded-full text-[10px] font-bold">
                        {items.length}
                      </span>
                    )}
                  </Link>
                  <Link href="/wallet" className="p-2 rounded-full hover:bg-white/5 transition-all text-primary">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </Link>
                </>
              )}
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 focus:outline-none focus:border-primary transition-all flex items-center justify-center bg-surface-container-highest"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-12 left-0 w-48 bg-surface-container-high border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col z-50 mt-2">
                    {isAdminRoute ? (
                      <Link 
                        href="/admin/settings" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-2 text-right hover:bg-white/5 transition-colors font-body-base flex items-center justify-end gap-3 text-on-surface"
                      >
                        إعدادات حساب الإدارة
                        <span className="material-symbols-outlined text-sm">manage_accounts</span>
                      </Link>
                    ) : (
                      <>
                        <Link 
                          href="/profile" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="px-4 py-2 text-right hover:bg-white/5 transition-colors font-body-base flex items-center justify-end gap-3 text-on-surface"
                        >
                          الملف الشخصي
                          <span className="material-symbols-outlined text-sm">person</span>
                        </Link>
                        <Link 
                          href="/settings" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="px-4 py-2 text-right hover:bg-white/5 transition-colors font-body-base flex items-center justify-end gap-3 text-on-surface"
                        >
                          الإعدادات
                          <span className="material-symbols-outlined text-sm">settings</span>
                        </Link>
                      </>
                    )}
                    <div className="h-px bg-white/5 my-1 w-full"></div>
                    <button 
                      onClick={handleLogout}
                      className="px-4 py-2 text-right hover:bg-error/10 transition-colors font-body-base flex items-center justify-end gap-3 text-error w-full"
                    >
                      تسجيل الخروج
                      <span className="material-symbols-outlined text-sm">logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
