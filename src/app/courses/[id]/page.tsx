"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useCart } from "@/app/context/CartContext";
import ReviewsSection from "@/app/components/ReviewsSection";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [openModule, setOpenModule] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [instructor, setInstructor] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  const { addToCart, items } = useCart();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch course
    const { data: cData } = await supabase.from('courses').select('*').eq('id', params.id).single();
    if (cData) setCourse(cData);

    // Fetch instructor profile from site_settings
    const { data: iData } = await supabase.from('site_settings').select('value').eq('key', 'instructor_profile').single();
    if (iData && iData.value) {
      setInstructor(iData.value);
    } else {
      // Fallback
      const { data: fallbackData } = await supabase.from('users').select('full_name, bio').eq('role', 'ADMIN').limit(1).single();
      if (fallbackData) setInstructor({ name: fallbackData.full_name, bio: fallbackData.bio });
    }

    // Fetch modules & lessons
    try {
      const { data: mData } = await supabase
        .from('course_modules')
        .select('*, course_lessons(*)')
        .eq('course_id', params.id)
        .order('order_index', { ascending: true });
      if (mData) {
        // sort lessons
        const sortedModules = mData.map((m: any) => ({
          ...m,
          course_lessons: m.course_lessons?.sort((a:any, b:any) => a.order_index - b.order_index) || []
        }));
        setModules(sortedModules);
        if (sortedModules.length > 0) setOpenModule(sortedModules[0].id);
      }
    } catch (e) {}

    // Check enrollment
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      setUser(userData.user);
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('id, expires_at')
        .eq('user_id', userData.user.id)
        .eq('course_id', params.id)
        .single();
          
          if (enrollData) {
            setIsEnrolled(true);
          }
    }

    setLoading(false);
  };

  const toggleModule = (id: string) => {
    setOpenModule(openModule === id ? null : id);
  };

  const isCourseInCart = () => {
    return items.some(item => item.id === params.id && item.type === 'COURSE');
  };

  const handleAction = () => {
    if (isEnrolled) {
      router.push(`/courses/${params.id}/learn`);
      return;
    }
    
    if (!isCourseInCart()) {
      addToCart({
        id: course.id,
        title: course.title,
        price: course.price,
        type: 'COURSE',
        image_url: course.image_url
      });
    }
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
        <h1 className="text-2xl font-bold text-error mb-4">الكورس غير موجود</h1>
        <Link href="/courses" className="text-primary hover:underline">العودة للمتجر</Link>
      </div>
    );
  }

  return (
    <main className="pb-20 w-full min-h-screen">
      {/* Hero Section / Course Banner */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-surface-container-high z-0">
          {course.image_url && (
            <img src={course.image_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20 z-10"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-container-margin h-full flex flex-col justify-end pb-12 pt-24">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded text-label-caps font-code-sm border border-primary/20">
              {course.pricing_type === 'ONE_TIME' ? 'دفع مرة واحدة' : 'اشتراك شهري'}
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4 max-w-3xl leading-tight">
            {course.title}
          </h1>
          <div className="flex items-center gap-6 text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              <span className="font-body-base">طلبة الدفعة الحالية</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <span className="font-body-base">محتوى متجدد</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-container-margin grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-12">
        {/* Main Content Area (8 Columns) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Instructor Card */}
          <div className="glass-card p-8 rounded-xl flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-primary/20 bg-surface-container-highest flex items-center justify-center">
              {instructor?.avatar_url ? (
                 <img src={instructor.avatar_url} alt={instructor?.name || 'المحاضر'} className="w-full h-full object-cover" />
              ) : (
                 <span className="material-symbols-outlined text-primary text-4xl">person</span>
              )}
            </div>
            <div>
              <h3 className="font-headline-md text-primary mb-2">{instructor?.name || 'المحاضر'}</h3>
              <p className="text-on-surface-variant font-body-base leading-relaxed whitespace-pre-wrap mb-4">
                {instructor?.title && <span className="block font-bold text-on-surface mb-1">{instructor.title}</span>}
                {instructor?.bio || 'خبير برمجيات متخصص.'}
              </p>
              {(instructor?.facebook || instructor?.youtube) && (
                <div className="flex gap-3">
                  {instructor?.facebook && (
                    <a href={instructor.facebook} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02Z"/></svg>
                    </a>
                  )}
                  {instructor?.youtube && (
                    <a href={instructor.youtube} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-error transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Course Description */}
          <section>
            <h2 className="font-headline-md text-on-surface mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              عن هذا الكورس
            </h2>
            <p className="text-on-surface-variant font-body-base leading-relaxed text-lg whitespace-pre-wrap">
              {course.description || 'لا يوجد وصف متاح.'}
            </p>
          </section>

          {/* Curriculum Accordion */}
          <section>
            <h2 className="font-headline-md text-on-surface mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              منهج الكورس
            </h2>
            <div className="space-y-4">
              
              {modules.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-low rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">construction</span>
                  <p className="text-on-surface-variant font-bold">جاري إضافة المنهج والدروس قريباً...</p>
                </div>
              ) : (
                modules.map((module, mIndex) => (
                  <div key={module.id} className={`glass-card rounded-xl overflow-hidden ${openModule === module.id ? 'border-primary/20' : 'border-white/5'}`}>
                    <button 
                      className={`w-full p-6 flex justify-between items-center transition-all ${openModule === module.id ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-code-sm text-primary">{(mIndex + 1).toString().padStart(2, '0')}</span>
                        <span className="font-headline-md text-on-surface">{module.title}</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">
                        {openModule === module.id ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    <div className={`px-6 pb-6 space-y-3 pt-4 ${openModule === module.id ? 'block' : 'hidden'}`}>
                      {module.course_lessons?.map((lesson: any) => {
                        const canWatch = !lesson.is_locked || isEnrolled;
                        return (
                          <div key={lesson.id} className={`flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-white/5 group transition-colors ${canWatch ? 'hover:border-primary/50 cursor-pointer' : 'hover:border-white/20'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-sm ${!canWatch ? 'text-error' : 'text-primary'}`}>
                                {!canWatch ? 'lock' : 'play_circle'}
                              </span>
                              {canWatch ? (
                                <Link href={`/courses/${course.id}/watch?lessonId=${lesson.id}`} className="font-body-base text-on-surface group-hover:text-primary transition-colors">
                                  {lesson.title}
                                </Link>
                              ) : (
                                <span className="font-body-base text-on-surface group-hover:text-primary transition-colors">{lesson.title}</span>
                              )}
                            </div>
                            <span className="font-code-sm text-on-surface-variant">{lesson.duration_minutes} د</span>
                          </div>
                        );
                      })}
                      {(!module.course_lessons || module.course_lessons.length === 0) && (
                        <div className="text-sm text-on-surface-variant italic p-2">لا توجد دروس في هذه الوحدة حتى الآن.</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar (4 Columns) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            
            {/* Pricing Card */}
            <div className="glass-card p-8 rounded-2xl shadow-[0_0_15px_rgba(0,210,255,0.15)] border border-primary/40 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 blur-3xl rounded-full"></div>
              <div className="mb-6">
                <span className="text-label-caps font-code-sm text-primary bg-primary/10 px-3 py-1 rounded-full">سعر خاص لفترة محدودة</span>
              </div>
              <div className="flex items-baseline gap-2 mb-8 flex-wrap">
                <span className="font-code-sm text-display-lg text-primary">{course.price == 0 ? 'مجاني' : course.price}</span>
                {course.price > 0 && <span className="font-body-base text-on-surface-variant">جنية مصري</span>}
                {course.original_price && course.original_price > course.price && (
                  <div className="flex items-center gap-2 mr-auto bg-error/10 px-3 py-1 rounded-full">
                     <span className="font-code-sm text-lg text-error line-through opacity-70">{course.original_price}</span>
                     <span className="text-xs font-bold text-error">وفر {Math.round(((course.original_price - course.price) / course.original_price) * 100)}%</span>
                  </div>
                )}
              </div>
              
              <ul className="space-y-4 mb-10">
                {course.features && course.features.length > 0 ? (
                  course.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-on-surface">
                      <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-body-base leading-relaxed">{feature}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-3 text-on-surface">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-body-base">وصول للمحتوى الخاص بالكورس</span>
                    </li>
                    <li className="flex items-center gap-3 text-on-surface">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-body-base">شهادة إتمام معتمدة (قريباً)</span>
                    </li>
                    <li className="flex items-center gap-3 text-on-surface">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-body-base">دعم فني مباشر مع المهندس</span>
                    </li>
                  </>
                )}
              </ul>
              
              <button 
                onClick={handleAction}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all shadow-[0_0_20px_rgba(111,255,233,0.3)] flex items-center justify-center gap-2 mt-auto"
              >
                <span className="material-symbols-outlined">
                  {isCourseInCart() ? 'shopping_cart_checkout' : (isEnrolled ? 'play_circle' : 'account_balance_wallet')}
                </span>
                {isCourseInCart() ? 'إتمام الدفع' : (isEnrolled ? 'متابعة الكورس' : 'الاشتراك الآن')}
              </button>
            </div>

            {/* Tech Terminal Info */}
            <div className="bg-surface-container-lowest rounded-xl border border-white/5 p-6 font-code-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="space-y-2 text-primary/80" dir="ltr">
                <p className="text-right" dir="rtl">&gt; $ status: registration_open</p>
                <p className="text-right" dir="rtl">&gt; $ students_enrolled: 1245</p>
                <p className="text-right" dir="rtl">&gt; $ next_live_session: Saturday 8PM</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Reviews Section */}
      <ReviewsSection />
    </main>
  );
}
