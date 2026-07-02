import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="pt-32 pb-section-gap max-w-7xl mx-auto px-container-margin min-h-[calc(100vh-80px)]">
      
      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-section-gap items-center animate-in fade-in duration-700">
        <div className="md:col-span-4 relative group">
          <div className="absolute -inset-1 bg-primary-container/20 rounded-xl blur-xl group-hover:bg-primary-container/40 transition duration-500"></div>
          <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/30 glass-card">
            <img 
              className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" 
              alt="Instructor Portrait" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvNNK1u_blXNx-qoMBtoSBXGH3ldO838ELIMe5oBFkC9X2-eQO-PK33ydDROrRJqrxrT6YTWQnb9uGT7M83q8s3JTvUSv5LFbEaib_VYu2UnHMtSIsYUNbTldmjlBWaxjFGftU46pSUwtN9bn7mDV0wcCG96ysOTKs_7jKHzPCIcv7Aq9u66vu5KxsisUQjHZKhlqvqwTA_VDWKP9Xiw0tJAOXA35XmcGuIb7-qlERXy9lA_IoF9QU4HDtHswLNM8gZuN-zfN32WQ"
            />
          </div>
        </div>
        
        <div className="md:col-span-8 flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-code-sm text-code-sm">المدير والمؤسس</span>
            </div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">م. أحمد السيوفي</h1>
            <p className="font-headline-md text-headline-md text-primary drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">Lead Software Engineer & Educator</p>
          </div>
          
          <p className="font-body-base text-body-base text-on-surface-variant max-w-2xl leading-relaxed">
            مؤسس منصة CORE التعليمية ومطور برمجيات بخبرة تزيد عن 8 سنوات. أؤمن بأن البرمجة هي لغة المستقبل، وهدفي هو تبسيط هذه اللغة ونقلها لجيل جديد من المبرمجين الشباب قادر على المنافسة محلياً وعالمياً.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary-container text-on-primary font-bold px-8 py-3 rounded-lg flex items-center gap-2 hover:scale-95 transition-transform">
              <span className="material-symbols-outlined">mail</span>
              تواصل مع المحاضر
            </button>
            <button className="border border-primary/30 text-primary font-bold px-8 py-3 rounded-lg hover:bg-primary/5 transition-all">
              السيرة الذاتية (CV)
            </button>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-section-gap animate-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center group hover:border-primary/50 transition-all border border-white/5">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">إجمالي الطلاب</span>
          <span className="font-display-lg text-display-lg-mobile text-primary drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">+١٥,٠٠٠</span>
          <div className="w-12 h-1 bg-primary/20 mt-4 rounded-full group-hover:w-24 transition-all duration-500"></div>
        </div>
        <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center group hover:border-primary/50 transition-all border border-white/5">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">كورسات مقيمة</span>
          <span className="font-display-lg text-display-lg-mobile text-primary drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">٢٤ كورس</span>
          <div className="w-12 h-1 bg-primary/20 mt-4 rounded-full group-hover:w-24 transition-all duration-500"></div>
        </div>
        <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center group hover:border-primary/50 transition-all border border-white/5">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">سنوات الخبرة</span>
          <span className="font-display-lg text-display-lg-mobile text-primary drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">٨ سنوات</span>
          <div className="w-12 h-1 bg-primary/20 mt-4 rounded-full group-hover:w-24 transition-all duration-500"></div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="mb-section-gap animate-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">كورسات المحاضر</h2>
            <p className="text-on-surface-variant font-body-base text-body-base">أحدث الدورات التدريبية المتاحة حالياً</p>
          </div>
          <Link href="/courses" className="text-primary font-body-base text-body-base flex items-center gap-1 hover:underline">
            عرض الكل
            <span className="material-symbols-outlined">chevron_left</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Course Card 1 */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col group hover:shadow-[0_0_30px_rgba(0,210,255,0.15)] transition-all border border-white/5">
            <div className="h-48 overflow-hidden relative">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Course" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq_Pym4tv-PEZUZhWC1XhX9MlC3HMK1_QYfBSIdvQv4WWXLNfNUwcccC8iADpJAPQtE5qWb1FpSW7QdbgRnsi6YUBdWFSdSgDhDfoULnWrvir6_QrHTi1ZnmEZIqVqUccFBYAqLocWI40ScuPFqozUMX0VjCygNR_2FDq8Lo8c3577N_pKLouvskQzhF1dPIC8AaC6xY8EFIoRnA-e2F_hAybTqXbuL5kylTtKvJl58vd1-OdnT10ZiekjGI_nJGb9zLMxJoEYXTo"/>
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="font-code-sm text-code-sm text-secondary">LEVEL: PRO</span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">أساسيات بايثون للمهندسين الصغار</h3>
              <p className="font-body-base text-body-base text-on-surface-variant mb-6 line-clamp-2">تعلم لغة العصر من الصفر وحتى بناء أول نموذج ذكاء اصطناعي خاص بك.</p>
              <div className="mt-auto flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">السعر</span>
                  <span className="font-code-sm text-[20px] text-primary">١,٢٥٠ EGP</span>
                </div>
                <button className="p-3 rounded-lg bg-white/5 hover:bg-primary/20 text-primary transition-colors">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Course Card 2 */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col group hover:shadow-[0_0_30px_rgba(0,210,255,0.15)] transition-all border border-white/5">
            <div className="h-48 overflow-hidden relative">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Course" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyP13IaNLUqYPOz2HGBLS_Zp5x_odCzYegWoADOdC9vtuvg15g9hoeftoZelat7tHH3EFCo2SZqwf_Ab-eI5didJWFr6dZDSW9fQMCk06_o0xpIpHBKoCKi1UvGdMG2UkIDEPpHpztxdmhYp0Z2pPn5fPCiWOwZ5annDiEeWCwPAAyF6hMSppXPt0JTzcOv3P9fSTtVd2j8J8LN9h-CpRyjQrA0aurXZvcL2kxR7msN5M3UKdJgP7nO2g9lZA10hxe5FKBa7eyyr4"/>
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="font-code-sm text-code-sm text-primary">LEVEL: MID</span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">تطوير المواقع التفاعلية بـ React</h3>
              <p className="font-body-base text-body-base text-on-surface-variant mb-6 line-clamp-2">بناء واجهات مستخدم احترافية باستخدام أحدث التقنيات العالمية في تطوير الويب.</p>
              <div className="mt-auto flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">السعر</span>
                  <span className="font-code-sm text-[20px] text-primary">٩٥٠ EGP</span>
                </div>
                <button className="p-3 rounded-lg bg-white/5 hover:bg-primary/20 text-primary transition-colors">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Course Card 3 */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col group hover:shadow-[0_0_30px_rgba(0,210,255,0.15)] transition-all border border-white/5">
            <div className="h-48 overflow-hidden relative">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Course" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA54udzYAoqI06TBtV16_R4_j8Eodd1Tm5r_Orbtoa3oysLYL779pbcfQ1ThAR_wLo5M2mcp2OfFh-FNBz_W40Ut3_qkDVSe-0-txpsEwxG8pfEYoaBBSh6BBuItkfx8RrTPsW3B51sUikhIyc5jCi9mJT_wVDEf0IgkgbVhODIWeCxbOEjVMGb_jYfLa8b5_BfBvEEKlGMlXhvd3ouGx34XVIvIpkB4q6RcWEcU5iR08FAQxVvDbIJIT5LuOI5hbHleBljK4M__uE"/>
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="font-code-sm text-code-sm text-error">LEVEL: HARD</span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">التعلم العميق: بناء العقول الصناعية</h3>
              <p className="font-body-base text-body-base text-on-surface-variant mb-6 line-clamp-2">انتقل لمستوى المحترفين وتعلم كيف تفكر الآلة وكيف تبني شبكات عصبية معقدة.</p>
              <div className="mt-auto flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">السعر</span>
                  <span className="font-code-sm text-[20px] text-primary">١,٨٠٠ EGP</span>
                </div>
                <button className="p-3 rounded-lg bg-white/5 hover:bg-primary/20 text-primary transition-colors">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
        <div className="lg:col-span-4">
          <div className="glass-card p-8 rounded-xl sticky top-28 border border-white/5">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6">تقييمات الطلاب</h2>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-display-lg text-display-lg text-primary drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">٤.٩</span>
              <div>
                <div className="flex text-secondary mb-1">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                </div>
                <span className="font-body-base text-body-base text-on-surface-variant">من إجمالي ٣,٤٢٠ تقييم</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-code-sm text-code-sm w-4">٥</span>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[90%]"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-code-sm text-code-sm w-4">٤</span>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[7%]"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-code-sm text-code-sm w-4">٣</span>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[2%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8 space-y-6">
          {/* Review 1 */}
          <div className="glass-card p-6 rounded-xl border-r-4 border-r-primary border-y border-l border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">م.ع</div>
                <div>
                  <h4 className="font-body-base font-bold text-on-surface">محمد علي</h4>
                  <p className="text-[12px] text-on-surface-variant">منذ يومين</p>
                </div>
              </div>
              <div className="flex text-secondary scale-75 origin-left">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <p className="font-body-base text-body-base text-on-surface-variant">بجد أحسن كورس برمجة أخدته في حياتي. البشمهندس بيشرح المعلومة بشكل مبسط جداً وفي نفس الوقت بيخلينا نطبق عملي على طول.</p>
          </div>
          
          {/* Review 2 */}
          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">س.ك</div>
                <div>
                  <h4 className="font-body-base font-bold text-on-surface">سارة كمال</h4>
                  <p className="text-[12px] text-on-surface-variant">منذ أسبوع</p>
                </div>
              </div>
              <div className="flex text-secondary scale-75 origin-left">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
            <p className="font-body-base text-body-base text-on-surface-variant">المحتوى دسم جداً ومفيد. الماتريال اللي بتنزل مع الكورس بتساعدني كتير في المذاكرة لوحدي بعد الحصة.</p>
          </div>
          
          <button className="w-full py-4 border border-white/10 rounded-xl text-on-surface-variant font-body-base hover:bg-white/5 transition-all">
            تحميل المزيد من التقييمات
          </button>
        </div>
      </section>
    </main>
  );
}
