import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 0; // Dynamic fetch on load

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: sysData } = await supabase.from('site_settings').select('value').eq('key', 'system_settings').single();
  const settings = sysData?.value || {};

  // Custom configuration with fallbacks
  const siteName = settings.site_name || 'CORE';
  const title = settings.maintenance_title || 'صيانة وتحديث المنصة';
  const description = settings.maintenance_description || `نعمل حالياً على تحسين وتحديث منصة ${siteName} لنقدم لكم تجربة تعليمية متميزة. سنعود للعمل مجدداً خلال وقت قصير جداً!`;
  const supportTitle = settings.maintenance_support_title || 'هل تحتاج إلى مساعدة؟';
  const supportDesc = settings.maintenance_support_desc || 'إذا كان لديك أي استفسار عاجل بشأن الكورسات أو الحساب الخاص بك، يرجى التواصل مع الدعم الفني مباشرة.';
  const whatsappNumber = settings.whatsapp || '+201012345678';
  
  // Format WhatsApp Link
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '');
  const waLink = `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}`;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-background">
      {/* Dynamic ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[150px] animate-pulse"></div>

      <div className="max-w-2xl w-full text-center relative z-10 space-y-8 py-12">
        {/* Animated Icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-surface-container-high border border-white/10 shadow-[0_0_50px_rgba(0,210,255,0.15)] mx-auto animate-bounce duration-1000">
          <span className="material-symbols-outlined text-5xl text-primary">
            build
          </span>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary"></span>
          </span>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-error/10 border border-error/20 rounded-lg">
            <span className="font-label-caps text-label-caps text-error tracking-widest uppercase text-xs">
              وضع الصيانة نشط
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
            {title}
          </h1>
          <p className="text-on-surface-variant max-w-lg mx-auto font-body-base leading-relaxed">
            {description}
          </p>
        </div>

        {/* Info card */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-surface-container-low max-w-md mx-auto space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-on-surface flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-secondary text-sm">support_agent</span>
            {supportTitle}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {supportDesc}
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500/10 hover:bg-green-500 hover:text-white text-green-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-green-500/20"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              WhatsApp الدعم
            </a>
            <Link
              href="/contact"
              className="px-4 py-2 bg-surface-container-high hover:bg-white/5 text-on-surface rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              وسائل الاتصال
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-on-surface-variant opacity-50">
          شكراً لتفهمكم وصبركم الجميل. فريق عمل {siteName}.
        </p>
      </div>
    </main>
  );
}
