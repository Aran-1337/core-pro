"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getUserBookedSessions } from "@/services/liveSessionService";
import { LiveSession } from "@/types";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = "/login";
        return;
      }

      // Fetch User Info
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (userData) setUser(userData);

      // Fetch Enrolled Courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (enrollments) {
        setCourses(enrollments.map((e: any) => ({
          ...e.courses,
          expires_at: e.expires_at
        })));
      }

      // Fetch Ordered Books (If book_orders exists, wrapped in try-catch to avoid crashing if user hasn't run SQL yet)
      try {
        const { data: bookOrders } = await supabase
          .from('book_orders')
          .select('*, books(*)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });
          
        if (bookOrders) setBooks(bookOrders.map(b => ({ ...b.books, format_bought: b.format, status: b.status })));
      } catch (err) {
        // Table might not exist yet
      }

      // Fetch Booked Live Sessions
      try {
        const bookedSessions = await getUserBookedSessions(authUser.id);
        setLiveSessions(bookedSessions);
      } catch (err) {
        // Table might not exist yet
      }

      setLoading(false);
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <main className="pt-32 pb-16 flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 px-container-margin w-full max-w-7xl mx-auto min-h-screen">
      {/* Welcome & Wallet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-stretch mb-12">
        
        {/* User Welcome */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          <span className="font-label-caps text-primary mb-2">مرحباً بك مجدداً، {user?.full_name?.split(' ')[0] || 'طالب'}</span>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">
            جاهز للتحول إلى مهندس محترف؟
          </h1>
          <p className="font-body-base text-on-surface-variant max-w-xl">
            استمر في رحلتك التعليمية اليوم وكن جزءاً من نخبة المبرمجين. رصيدك الحالي يتيح لك الوصول لأحدث الكورسات والكتب المتاحة.
          </p>
        </div>

        {/* Wallet Card (Prominent) */}
        <div className="lg:col-span-4 glass-card rounded-xl p-8 relative overflow-hidden group border-primary/20 border-2">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <span className="material-symbols-outlined text-primary text-4xl">account_balance_wallet</span>
              <span className="font-label-caps text-on-surface-variant">رصيد المحفظة</span>
            </div>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="font-code-sm text-display-lg-mobile md:text-display-lg font-bold text-on-surface">{user?.balance || 0}</span>
                <span className="font-body-base text-on-surface-variant">جنيه</span>
              </div>
            </div>
            
            <Link href="/wallet" className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-lg font-bold font-body-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] neon-glow-green active:scale-95">
              <span className="material-symbols-outlined text-sm">add</span>
              شحن الرصيد
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Section: Quick Links Bento */}
      <div className="mb-section-gap grid grid-cols-2 md:grid-cols-3 gap-gutter">
        <Link href="/store" className="glass-card interactive-card rounded-xl p-6 flex flex-col items-center gap-3 text-center transition-all border border-white/5 hover:border-primary/50">
          <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
          <span className="font-headline-md text-on-surface">المتجر (كورسات وكتب)</span>
        </Link>
        <Link href="/dashboard/recharge" className="glass-card interactive-card rounded-xl p-6 flex flex-col items-center gap-3 text-center transition-all border border-white/5 hover:border-secondary/50">
          <span className="material-symbols-outlined text-secondary text-3xl">payments</span>
          <span className="font-headline-md text-on-surface">طلبات الشحن</span>
        </Link>
        <div className="glass-card interactive-card rounded-xl p-6 flex flex-col items-center gap-3 text-center transition-all border border-white/5 opacity-70 cursor-not-allowed relative overflow-hidden">
          <div className="absolute top-3 right-[-30px] bg-tertiary text-on-tertiary text-[10px] font-bold py-1 px-8 rotate-45">قريباً</div>
          <span className="material-symbols-outlined text-tertiary/50 text-3xl">school</span>
          <span className="font-headline-md text-on-surface/70">الشهادات والتقييمات</span>
        </div>
      </div>

      {/* Section: Learning & Books */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-section-gap">
        
        {/* Continue Learning */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-md text-on-surface border-r-4 border-primary pr-4">كورساتي (استكمل التعلم)</h2>
            <Link href="/store" className="font-label-caps text-primary hover:underline">تصفح المتجر</Link>
          </div>
          
          <div className="space-y-gutter">
            {courses.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-low border border-white/5 rounded-xl text-on-surface-variant">
                لم تشترك في أي كورسات حتى الآن. اذهب إلى المتجر لاكتشاف الكورسات المتاحة.
              </div>
            ) : (
              courses.map((course: any) => {
                return (
                  <Link href={`/courses/${course.id}`} key={course.id} className="glass-card rounded-xl p-6 group cursor-pointer hover:bg-surface-container-high transition-all block border border-white/5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/10 shrink-0 overflow-hidden relative">
                        {course.image_url ? (
                          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-3xl text-primary">play_circle</span>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-body-base font-bold transition-colors text-on-surface group-hover:text-primary">{course.title}</h3>
                          <span className="font-code-sm text-primary">ابدأ الآن</span>
                        </div>
                        <span className="font-label-caps text-on-surface-variant line-clamp-1">{course.description || 'كورس متميز للتعلم'}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* My Books Widget */}
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-md text-on-surface border-r-4 border-secondary pr-4">كتبي والمراجع</h2>
          </div>
          
          <div className="glass-card rounded-xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3 text-secondary font-bold text-sm">
                <span className="material-symbols-outlined">library_books</span>
                المكتبة الخاصة بي
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {books.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  لم تقم بشراء أي كتب بعد.
                </div>
              ) : (
                books.map((book: any, idx) => (
                  <div key={idx} className="flex gap-4 items-center p-3 bg-surface-container-high rounded-lg border border-white/5">
                    <div className="w-12 h-16 bg-surface-container-highest rounded overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                      {book.image_url ? (
                        <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl">book</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm text-on-surface line-clamp-1">{book.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-on-surface-variant">{book.format_bought === 'PHYSICAL' ? 'نسخة مطبوعة' : 'نسخة إلكترونية (PDF)'}</p>
                        {book.format_bought === 'PHYSICAL' && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${book.status === 'SHIPPED' ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'}`}>
                            {book.status === 'SHIPPED' ? 'تم الشحن' : 'جاري التجهيز'}
                          </span>
                        )}
                      </div>
                    </div>
                    {book.format_bought === 'DIGITAL' && book.pdf_file_url && (
                      <a href={book.pdf_file_url} target="_blank" rel="noreferrer" className="p-2 bg-secondary/10 text-secondary rounded hover:bg-secondary hover:text-white transition-colors" title="تحميل أو قراءة">
                        <span className="material-symbols-outlined text-sm">download</span>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Sessions Widget */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline-md text-on-surface border-r-4 border-tertiary pr-4">حصصي المباشرة</h2>
              <Link href="/live-sessions" className="font-label-caps text-tertiary hover:underline">المزيد من الحصص</Link>
            </div>
            
            <div className="glass-card rounded-xl overflow-hidden border border-white/5">
              <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3 text-tertiary font-bold text-sm">
                  <span className="material-symbols-outlined">sensors</span>
                  البث المباشر القادم
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {liveSessions.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant text-sm">
                    لم تشترك في أي حصة مباشرة بعد.
                  </div>
                ) : (
                  liveSessions.map((booking: any, idx) => {
                    const session = booking.live_sessions;
                    if (!session) return null;
                    
                    const sessionTime = new Date(session.session_date).getTime();
                    const nowTime = new Date().getTime();
                    const isLive = nowTime >= sessionTime && nowTime <= sessionTime + (2 * 60 * 60 * 1000); // Live for 2 hours
                    const isPast = nowTime > sessionTime + (2 * 60 * 60 * 1000);
                    
                    return (
                      <div key={idx} className="flex flex-col gap-3 p-4 bg-surface-container-high rounded-lg border border-white/5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-on-surface">{session.title}</h4>
                            <p className="text-xs text-on-surface-variant mt-1">م. {session.instructor_name}</p>
                          </div>
                          {isLive && (
                            <span className="flex items-center gap-1 bg-green-500/20 text-green-500 text-[10px] px-2 py-1 rounded font-bold animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> مباشر الآن
                            </span>
                          )}
                          {!isLive && !isPast && (
                            <span className="bg-tertiary/20 text-tertiary text-[10px] px-2 py-1 rounded font-bold">قادمة</span>
                          )}
                          {isPast && (
                            <span className="bg-surface-container-highest text-on-surface-variant text-[10px] px-2 py-1 rounded font-bold">منتهية</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                          <span className="text-xs text-primary font-code-sm" dir="ltr">
                            {new Date(session.session_date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          
                          {isLive ? (
                            <a href={session.zoom_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold transition-colors">
                              دخول البث
                            </a>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant">الرابط يظهر وقت البث</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
    </main>
  );
}
