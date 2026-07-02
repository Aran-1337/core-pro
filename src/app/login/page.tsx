"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { trackUserLocation } from "@/app/actions/track";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      if (error.message.includes("Email not confirmed")) {
        setErrorMsg("يرجى تأكيد بريدك الإلكتروني أولاً (راجع صندوق الوارد).");
      } else if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
      return;
    }

    // Check user role (admin or student) in public.users
    const { data: userData } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', data.user.id)
      .single();

    // Track User IP and Country
    await trackUserLocation();

    if (userData?.role === 'ADMIN') {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="relative z-10 w-full max-w-[480px] px-container-margin py-section-gap mx-auto mt-20">
      {/* Brand Identity */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="mb-6 p-4 rounded-xl bg-surface-container-high border border-white/5 shadow-xl">
          <span className="material-symbols-outlined text-primary-container text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
        </div>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-2">CORE</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">STUDENT GATEWAY</p>
      </div>

      {/* Login Card */}
      <div className="glass-card p-8 md:p-10 rounded-xl shadow-2xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-1">
        {/* Decorative Tech Corner */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary-container/30 rounded-tr-xl"></div>
        
        <header className="mb-8">
          <h2 className="font-headline-md text-headline-md text-on-surface">تسجيل دخول الطالب</h2>
          <div className="w-12 h-1 bg-primary-container mt-2"></div>
        </header>

        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Username/Email */}
          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">alternate_email</span>
              البريد الإلكتروني أو اسم المستخدم
            </label>
            <div className="bg-[#05070a] border border-white/10 rounded-lg flex items-center px-4 transition-all focus-within:border-b-primary focus-within:border-b-2 focus-within:shadow-[0_4px_12px_-2px_rgba(0,210,255,0.2)] group">
              <input 
                className="bg-transparent border-none outline-none w-full py-4 text-on-surface focus:ring-0 placeholder:text-on-surface-variant/30 text-right font-code-sm" 
                placeholder="student@core.com" 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              كلمة المرور
            </label>
            <div className="bg-[#05070a] border border-white/10 rounded-lg flex items-center px-4 transition-all focus-within:border-b-primary focus-within:border-b-2 focus-within:shadow-[0_4px_12px_-2px_rgba(0,210,255,0.2)] group">
              <input 
                className="bg-transparent border-none outline-none w-full py-4 text-on-surface focus:ring-0 placeholder:text-on-surface-variant/30 text-right font-code-sm" 
                placeholder="core123" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                className="text-on-surface-variant hover:text-primary transition-colors" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-sm text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button 
            disabled={loading}
            className="w-full bg-primary-container text-on-primary py-4 rounded-lg font-display-lg text-[18px] font-bold shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:shadow-[0_0_25px_rgba(0,210,255,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8 group disabled:opacity-50" 
            type="submit"
          >
            <span>{loading ? 'جاري الدخول...' : 'دخول إلى المنصة'}</span>
            {!loading && <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">login</span>}
          </button>
        </form>
      </div>

      {/* System Footer */}
      <footer className="mt-12 text-center">
        <p className="font-label-caps text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] mb-4">
          Secure Student Gateway v1.0.0 // Protected by Tactical Firewall
        </p>
      </footer>
    </main>
  );
}
