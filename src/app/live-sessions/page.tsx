"use client";

import { useState, useEffect } from "react";
import { getPublishedLiveSessions } from "@/services/liveSessionService";
import { LiveSession } from "@/types";
import { createClient } from "@/utils/supabase/client";

type Tab = 'PRIVATE' | 'REVIEW';

export default function LiveSessionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('PRIVATE');
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [userBookedSessionIds, setUserBookedSessionIds] = useState<string[]>([]);
  const [sessionBookingCounts, setSessionBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    let userData = null;
    if (authUser) {
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      userData = data;
      setUser(userData);
    }

    const data = await getPublishedLiveSessions();
    setSessions(data);

    if (data.length > 0) {
      // 1. Fetch booking counts for these sessions
      const { data: counts } = await supabase
        .from('session_bookings')
        .select('session_id')
        .in('session_id', data.map(s => s.id));
      
      const countMap: Record<string, number> = {};
      if (counts) {
        counts.forEach((b: any) => {
          countMap[b.session_id] = (countMap[b.session_id] || 0) + 1;
        });
      }
      setSessionBookingCounts(countMap);

      // 2. Check which sessions current logged in user has booked
      if (authUser) {
        const { data: userBookings } = await supabase
          .from('session_bookings')
          .select('session_id')
          .eq('user_id', authUser.id);
        
        if (userBookings) {
          setUserBookedSessionIds(userBookings.map((b: any) => b.session_id));
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBooking = async (session: LiveSession) => {
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً لحجز الحصة.");
      return;
    }

    // Safety checks before booking
    const currentBookedCount = sessionBookingCounts[session.id] || 0;
    if (currentBookedCount >= session.max_seats) {
      alert("عذراً، هذه الحصة اكتملت مقاعدها بالفعل.");
      return;
    }

    if (userBookedSessionIds.includes(session.id)) {
      alert("لقد قمت بحجز هذه الحصة مسبقاً.");
      return;
    }
    
    if (user.balance < session.price) {
      alert("رصيد محفظتك غير كافٍ. يرجى الشحن والمحاولة مرة أخرى.");
      return;
    }

    if (confirm(`تأكيد خصم ${session.price} جنيه لحجز مقعد في حصة: ${session.title}؟`)) {
      // 1. Create booking
      const { error: bookingError } = await supabase.from('session_bookings').insert({
        user_id: user.id,
        session_id: session.id,
        amount: session.price
      });

      if (bookingError) {
        if (bookingError.code === '23505') {
          alert("لقد قمت بحجز هذه الحصة مسبقاً.");
        } else {
          alert("حدث خطأ أثناء الحجز.");
        }
        return;
      }

      // 2. Deduct balance
      const newBalance = user.balance - session.price;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (balanceError) {
        alert("حدث خطأ في تحديث الرصيد.");
        return;
      }

      setUser({ ...user, balance: newBalance });
      setUserBookedSessionIds(prev => [...prev, session.id]);
      setSessionBookingCounts(prev => ({
        ...prev,
        [session.id]: (prev[session.id] || 0) + 1
      }));
      alert("تم الحجز بنجاح! ستجد تفاصيل الحصة ورابط زووم في لوحة التحكم قريباً.");
    }
  };

  const filteredSessions = sessions.filter(s => s.session_type === activeTab);

  return (
    <main className="pt-32 pb-section-gap px-container-margin max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="relative mb-12 text-right">
        <div className="inline-block px-3 py-1 mb-4 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Live Operations</span>
        </div>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">حصص البث المباشر</h1>
        <p className="text-on-surface-variant max-w-2xl font-body-base leading-relaxed">
          تفاعل مباشرة مع نخبة مهندسي البرمجيات. اطرح أسئلتك، وشارك في حل التحديات البرمجية في الوقت الفعلي.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-8 border-b border-white/5 mb-12 overflow-x-auto overflow-y-hidden hide-scrollbar">
        <button 
          className={activeTab === 'PRIVATE' ? 'tab-active py-4 font-headline-md whitespace-nowrap transition-all duration-300 relative text-primary after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:shadow-[0_0_10px_#00d2ff]' : 'text-on-surface-variant hover:text-on-surface py-4 font-headline-md whitespace-nowrap transition-all duration-300'}
          onClick={() => setActiveTab('PRIVATE')}
        >
          حصص زووم خاصة
        </button>
        <button 
          className={activeTab === 'REVIEW' ? 'tab-active py-4 font-headline-md whitespace-nowrap transition-all duration-300 relative text-primary after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:shadow-[0_0_10px_#00d2ff]' : 'text-on-surface-variant hover:text-on-surface py-4 font-headline-md whitespace-nowrap transition-all duration-300'}
          onClick={() => setActiveTab('REVIEW')}
        >
          حصص المراجعة
        </button>
      </div>

      {/* Lessons Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-white/5">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">videocam_off</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">لا توجد حصص حالياً</h2>
          <p className="text-on-surface-variant">ترقبوا الحصص القادمة قريباً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-in fade-in duration-300">
          {filteredSessions.map(session => {
            const currentBookings = sessionBookingCounts[session.id] || 0;
            const seatsLeft = Math.max(0, session.max_seats - currentBookings);
            const isFull = seatsLeft === 0;
            const hasBooked = userBookedSessionIds.includes(session.id);

            return (
              <div key={session.id} className="glass-card rounded-xl p-6 relative overflow-hidden flex flex-col h-full group hover:shadow-[0_10px_30px_-10px_rgba(0,210,255,0.15)] hover:border-primary/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-md border flex items-center gap-2 ${
                    isFull 
                      ? 'bg-error/10 text-error border-error/20' 
                      : seatsLeft < 5 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-secondary/10 text-secondary border-secondary/20'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{isFull ? 'block' : 'group'}</span>
                    <span className="font-label-caps text-label-caps text-xs">
                      {isFull ? 'مكتملة العدد' : seatsLeft < 5 ? `متبقي ${seatsLeft} مقاعد فقط!` : `متاح ${seatsLeft} من ${session.max_seats}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-code-sm text-code-sm text-primary">LVL: {session.level}</span>
                  </div>
                </div>
                
                <h3 className="font-headline-md text-on-surface mb-2">{session.title}</h3>
                {session.description && <p className="text-sm text-on-surface-variant mb-4">{session.description}</p>}
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-surface-container-highest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <span className="text-on-surface-variant font-body-base">{session.instructor_name}</span>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    <span className="font-body-base">{new Date(session.session_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <span className="font-body-base">{new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="text-right">
                    <span className="font-label-caps text-label-caps text-on-surface-variant block">سعر الحصة</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-code-sm text-display-lg-mobile text-primary">{session.price}</span>
                      <span className="text-on-surface-variant font-body-base">EGP</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleBooking(session)}
                    disabled={isFull || hasBooked}
                    className={`font-label-caps text-label-caps px-6 py-3 rounded-lg transition-all active:scale-95 ${
                      hasBooked 
                        ? 'bg-green-500/20 text-green-500 cursor-not-allowed border border-green-500/20 shadow-none'
                        : isFull 
                          ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed shadow-none'
                          : 'bg-primary text-on-primary hover:brightness-110 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                    }`}
                  >
                    {hasBooked ? 'تم الحجز' : isFull ? 'مكتمل العدد' : 'احجز الآن'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
