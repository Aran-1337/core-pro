import Link from "next/link";
import Image from "next/image";
import ReviewsSection from "./components/ReviewsSection";

export default function LandingPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="container mx-auto px-container-margin relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-container">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-caps">أول منصة برمجية لطلاب الثانوية في مصر</span>
            </div>
            
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg leading-tight text-on-surface">
              احترف <span className="text-primary-container">البرمجة</span> والذكاء الاصطناعي في المرحلة الثانوية
            </h1>
            
            <p className="font-body-base text-on-surface-variant max-w-xl lg:ml-0 lg:mr-auto">
              نحن لا نعلمك فقط كيف تكتب الكود، بل نعدك لتكون مهندس برمجيات محترف قبل دخول الجامعة. مناهج تطبيقية مصممة خصيصاً لعقلية طالب الثانوية المبدع.
            </p>
            
            <div className="flex flex-col sm:flex-row-reverse gap-4 justify-center lg:justify-start">
              <Link href="/login" className="px-8 py-4 bg-primary-container text-on-primary-container rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform neon-glow">
                ابدأ رحلتك الآن
                <span className="material-symbols-outlined">rocket_launch</span>
              </Link>
              <Link href="/courses" className="px-8 py-4 bg-transparent border border-white/10 text-on-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                استكشف الكورسات
                <span className="material-symbols-outlined">menu_book</span>
              </Link>
            </div>
          </div>
          
          {/* Terminal Mockup */}
          <div className="hidden lg:block">
            <div className="glass-card rounded-2xl p-4 overflow-hidden relative group">
              <div className="terminal-header h-8 flex items-center border-b border-white/5 mb-4 relative">
                <div className="flex gap-2 absolute left-0">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
              </div>
              <div className="font-code-sm space-y-2 text-primary/80" dir="ltr">
                <p className="text-secondary text-right" dir="rtl"># نرحب بك في ثانوية المبرمج</p>
                <p><span className="text-on-tertiary-container">class</span> <span className="text-primary-container">EgyptianStudent</span>:</p>
                <p className="ml-4"> <span className="text-on-tertiary-container">def</span> <span className="text-primary-container">__init__</span>(self):</p>
                <p className="ml-8">self.level = <span className="text-secondary-container">"Thanaweya_Amma"</span></p>
                <p className="ml-8">self.skill = <span className="text-secondary-container">"AI_Mastery"</span></p>
                <p className="ml-4"> <span className="text-on-tertiary-container">def</span> <span className="text-primary-container">solve_future</span>(self):</p>
                <p className="ml-8"> <span className="text-on-tertiary-container">return</span> <span className="text-secondary-container">"Success Loading..."</span></p>
                
                <div className="mt-8 pt-4 border-t border-white/5 flex flex-row-reverse justify-between items-center" dir="rtl">
                  <span className="text-on-surface-variant italic">// اكتشف مستقبلك البرمجي هنا</span>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 bg-primary-container rounded-full animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-section-gap bg-surface-container-low">
        <div className="container mx-auto px-container-margin">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">لماذا تختار ثانوية المبرمج؟</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
              </div>
              <h3 className="font-headline-md text-on-surface mb-4">تعليم تطبيقي</h3>
              <p className="font-body-base text-on-surface-variant">
                نتجاوز النظريات الجافة لنصل بك إلى بناء تطبيقات ومواقع حقيقية من أول يوم دراسي.
              </p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl text-center border-primary/20">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">precision_manufacturing</span>
              </div>
              <h3 className="font-headline-md text-on-surface mb-4">تجهيز للمستقبل</h3>
              <p className="font-body-base text-on-surface-variant">
                مناهجنا مصممة لتواكب متطلبات سوق العمل العالمي والذكاء الاصطناعي الحديث.
              </p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-tertiary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-tertiary-container text-4xl">rebase_edit</span>
              </div>
              <h3 className="font-headline-md text-on-surface mb-4">مشاريع حقيقية</h3>
              <p className="font-body-base text-on-surface-variant">
                ستتخرج من المنصة ولديك معرض أعمال (Portfolio) يضم مشاريع برمجية قمت ببنائها بنفسك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Reviews */}
      <ReviewsSection />

      {/* Final CTA */}
      <section className="py-section-gap relative overflow-hidden">
        <div className="container mx-auto px-container-margin relative z-10">
          <div className="glass-card p-12 rounded-3xl text-center max-w-4xl mx-auto border-primary/30">
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-6">جاهز لتبدأ رحلتك البرمجية؟</h2>
            <p className="font-body-base text-on-surface-variant mb-10 max-w-2xl mx-auto">
              انضم الآن إلى آلاف الطلاب الذين قرروا تغيير مستقبلهم من اليوم. احصل على أول كورس مجاناً عند التسجيل.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="px-12 py-4 bg-primary-container text-on-primary-container rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,210,255,0.3)]">
                سجل الآن مجاناً
              </Link>
              <button className="px-12 py-4 bg-white/5 border border-white/10 text-on-surface rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
                تحدث مع مستشار تعليمي
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
