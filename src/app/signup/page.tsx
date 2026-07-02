"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setSuccessMsg("تم تسجيل الحساب بنجاح! حسابك الآن قيد المراجعة من قبل الإدارة.");
    setLoading(false);
    
    // Redirect after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  };

  return (
    <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-container-margin py-section-gap min-h-[calc(100vh-80px)] mt-20 mx-auto">
      {/* Right Column: Registration Form */}
      <section className="order-1 lg:order-2 flex flex-col items-center lg:items-start space-y-8">
        <header className="w-full text-right space-y-2">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">
            CORE
          </h1>
          <p className="font-body-base text-on-surface-variant max-w-md">
            انضم إلى جيل مهندسي المستقبل. ابدأ رحلتك التعليمية في البرمجة والذكاء الاصطناعي اليوم.
          </p>
        </header>

        <div className="glass-card w-full max-w-lg p-8 rounded-xl shadow-2xl relative overflow-hidden bg-surface-container/60 backdrop-blur-2xl">
          {/* Form Decoration */}
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/30 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/30 rounded-bl-xl"></div>
          
          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              
              {/* Name Field */}
              <div className="group">
                <label className="block font-label-caps text-primary mb-2">الاسم</label>
                <div className="relative bg-[#05070a] rounded-lg border border-white/10 transition-all duration-300 focus-within:border-b-primary focus-within:border-b-2 focus-within:shadow-[0_4px_12px_-4px_rgba(0,210,255,0.3)]">
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">person</span>
                  <input 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-on-surface font-body-base py-3 pr-11 pl-4 placeholder:text-on-surface-variant/30 text-right" 
                    placeholder="أدخل اسمك الثلاثي" 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Phone Field */}
              <div className="group">
                <label className="block font-label-caps text-primary mb-2">رقم الموبايل</label>
                <div className="relative bg-[#05070a] rounded-lg border border-white/10 transition-all duration-300 focus-within:border-b-primary focus-within:border-b-2 focus-within:shadow-[0_4px_12px_-4px_rgba(0,210,255,0.3)]">
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">smartphone</span>
                  <input 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-on-surface font-code-sm py-3 pr-11 pl-4 text-right placeholder:text-on-surface-variant/30" 
                    dir="ltr" 
                    placeholder="01XXXXXXXXX" 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Email Field */}
              <div className="group">
                <label className="block font-label-caps text-primary mb-2">البريد الإلكتروني</label>
                <div className="relative bg-[#05070a] rounded-lg border border-white/10 transition-all duration-300 focus-within:border-b-primary focus-within:border-b-2 focus-within:shadow-[0_4px_12px_-4px_rgba(0,210,255,0.3)]">
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">mail</span>
                  <input 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-on-surface font-body-base py-3 pr-11 pl-4 placeholder:text-on-surface-variant/30 text-right" 
                    placeholder="example@email.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="group">
                <label className="block font-label-caps text-primary mb-2">كلمة المرور</label>
                <div className="relative bg-[#05070a] rounded-lg border border-white/10 transition-all duration-300 focus-within:border-b-primary focus-within:border-b-2 focus-within:shadow-[0_4px_12px_-4px_rgba(0,210,255,0.3)]">
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                  <input 
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-on-surface font-body-base py-3 pr-11 pl-4 placeholder:text-on-surface-variant/30 text-right" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-sm text-center font-bold">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-secondary/10 border border-secondary/20 text-secondary p-3 rounded-lg text-sm text-center font-bold">
                {successMsg}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary font-headline-md py-4 rounded-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(0,210,255,0.3)] disabled:opacity-50"
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
            </button>
            

            <p className="text-center font-body-base text-on-surface-variant">
              لديك حساب بالفعل؟ <Link href="/login" className="text-primary hover:underline transition-all">سجل دخولك هنا</Link>
            </p>
          </form>
        </div>
      </section>

      {/* Left Column: Illustration & Tech Branding */}
      <section className="order-2 lg:order-1 hidden lg:flex flex-col items-center justify-center relative min-h-[600px]">
        {/* ... (Illustration remains exactly the same, stripped for brevity if needed but I'll keep it) */}
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 text-primary-fixed/30 font-code-sm rotate-12">class Student {"{"} constructor() {"{"} ... {"}"} {"}"}</div>
          <div className="absolute bottom-20 right-10 text-secondary-fixed/30 font-code-sm -rotate-6">while(learning) {"{"} code(); improve(); {"}"}</div>
          <div className="absolute top-1/2 left-0 text-tertiary-fixed/30 font-code-sm -rotate-90 text-2xl font-bold opacity-10">BINARY MASTERY</div>
        </div>
        
        {/* Main Illustration Container */}
        <div className="relative w-full aspect-square max-w-xl group">
          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute top-1/3 left-1/4 w-1/2 h-1/2 bg-secondary/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          {/* Main Image */}
          <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden glass-card border border-white/10 group-hover:border-primary/40 transition-all duration-700">
            <img 
              className="w-full h-full object-cover" 
              alt="Student Registration" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCN-em__IO3jUMjJeJRQdjtnNDx3uPG8Qx0ca8LkTtmk0Jie15sWDeV86yHpi5HjWkYgzI5QZAfXjSsVpkUmgGXiTtREmmXXmjVtWXOwotIhSvljJVNN0VQXeCOq7cLsAhe5GFs-GQBwvamfUhpt6D7LmbMtMgBPDOW08PuWlSjXDNegCR_SeGWsiiEU1fHpDcAY68PhGzGY2AreYYyCK6oiuCvFM4_KWAT42HXfbydLr5OoIHrzFAv4hmuD2OoURGsrCi2z0SZ6XU"
            />
            {/* Floating Tech Chips */}
            <div className="absolute top-8 left-8 flex flex-col gap-2 scale-90 md:scale-100">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-code-sm backdrop-blur-md animate-pulse">AI_READY</span>
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full border border-secondary/20 font-code-sm backdrop-blur-md animate-pulse" style={{ animationDelay: '1.5s' }}>PYTHON_DEV</span>
            </div>
            
            {/* Bottom Branding Info */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background/80 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-primary-container p-1 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-primary-fixed">بيئة تعليمية ذكية</h3>
                  <p className="text-body-base text-on-surface-variant">محاكاة برمجية حقيقية لكل طالب</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
