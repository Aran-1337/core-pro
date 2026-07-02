"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = 'personal' | 'courses' | 'products' | 'lessons' | 'history';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/login");
        return;
      }

      // 1. Fetch User
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setUser(userData);

      // 2. Fetch Enrollments
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('user_id', authUser.id);
      setEnrollments(enrolls || []);

      // 3. Fetch Book Orders
      const { data: bookOrders } = await supabase
        .from('book_orders')
        .select('*, books(*)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      setOrders(bookOrders || []);

      // 4. Fetch Session Bookings
      const { data: sessionBookings } = await supabase
        .from('session_bookings')
        .select('*, live_sessions(*)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      setBookings(sessionBookings || []);

      // 5. Fetch Wallet History
      const { data: walletReqs } = await supabase
        .from('wallet_requests')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      setWalletHistory(walletReqs || []);

      setLoading(false);
    };

    fetchProfileData();
  }, [router, supabase]);

  const getTabClass = (tab: Tab) => {
    return activeTab === tab 
      ? 'flex items-center gap-3 p-3 rounded-lg bg-primary-container/10 text-primary border-r-4 border-primary transition-all duration-300'
      : 'flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-white/5 transition-all duration-300 w-full text-right';
  };

  if (loading) {
    return (
      <main className="pt-32 pb-16 px-container-margin max-w-7xl mx-auto min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-7xl mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3">
          <div className="glass-card rounded-xl p-4 sticky top-24">
            <div className="flex flex-col gap-2">
              <button className={getTabClass('personal')} onClick={() => setActiveTab('personal')}>
                <span className="material-symbols-outlined">person</span>
                <span className="font-body-base text-body-base">المعلومات الشخصية</span>
              </button>
              <button className={getTabClass('courses')} onClick={() => setActiveTab('courses')}>
                <span className="material-symbols-outlined">school</span>
                <span className="font-body-base text-body-base">الكورسات المشترك بها</span>
              </button>
              <button className={getTabClass('products')} onClick={() => setActiveTab('products')}>
                <span className="material-symbols-outlined">shopping_bag</span>
                <span className="font-body-base text-body-base">المنتجات المشتراة</span>
              </button>
              <button className={getTabClass('lessons')} onClick={() => setActiveTab('lessons')}>
                <span className="material-symbols-outlined">event_available</span>
                <span className="font-body-base text-body-base">الحصص المحجوزة</span>
              </button>
              <button className={getTabClass('history')} onClick={() => setActiveTab('history')}>
                <span className="material-symbols-outlined">history</span>
                <span className="font-body-base text-body-base">سجل المعاملات</span>
              </button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="p-4 rounded-lg bg-surface-container-lowest border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-label-caps font-label-caps text-on-surface-variant">رصيد المحفظة</span>
                  <span className="material-symbols-outlined text-secondary text-sm">payments</span>
                </div>
                <div className="text-headline-md font-display-lg text-primary">{user?.balance || 0} <span className="text-sm">ج.م</span></div>
              </div>
              <Link href="/wallet" className="block text-center w-full mt-4 py-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-sm font-bold hover:bg-secondary/20 transition-colors">
                شحن المحفظة
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="lg:col-span-9">
          
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="h-10 bg-surface-container-lowest flex justify-between items-center px-4 border-b border-white/5">
                  <span className="text-code-sm font-code-sm text-on-surface-variant">بيانات الحساب</span>
                  <Link href="/settings" className="text-xs text-primary hover:underline">تعديل البيانات</Link>
                </div>
                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="relative group shrink-0">
                      <div className="w-32 h-32 rounded-xl bg-surface-container-highest border-2 border-primary-container/30 overflow-hidden flex items-center justify-center">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-6xl text-on-surface-variant">person</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-1">
                        <label className="text-label-caps font-label-caps text-on-surface-variant">الاسم الكامل</label>
                        <div className="p-3 rounded bg-surface-container-lowest border border-white/5 font-body-base">{user?.full_name || "غير محدد"}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-caps font-label-caps text-on-surface-variant">البريد الإلكتروني</label>
                        <div className="p-3 rounded bg-surface-container-lowest border border-white/5 font-body-base" dir="ltr">{user?.email || "غير محدد"}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-caps font-label-caps text-on-surface-variant">المستوى الدراسي</label>
                        <div className="p-3 rounded bg-surface-container-lowest border border-white/5 font-body-base">{user?.education_level || "غير محدد"}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-caps font-label-caps text-on-surface-variant">تاريخ الانضمام</label>
                        <div className="p-3 rounded bg-surface-container-lowest border border-white/5 font-body-base">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }) : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-xl border-r-4 border-primary">
                  <div className="text-on-surface-variant text-label-caps font-label-caps mb-2">الكورسات المشترك بها</div>
                  <div className="text-headline-md font-display-lg text-primary">{enrollments.length} <span className="text-sm">كورس</span></div>
                </div>
                <div className="glass-card p-6 rounded-xl border-r-4 border-secondary">
                  <div className="text-on-surface-variant text-label-caps font-label-caps mb-2">الملازم المشتراة</div>
                  <div className="text-headline-md font-display-lg text-secondary">{orders.length} <span className="text-sm">ملزمة</span></div>
                </div>
                <div className="glass-card p-6 rounded-xl border-r-4 border-tertiary">
                  <div className="text-on-surface-variant text-label-caps font-label-caps mb-2">الحصص المباشرة</div>
                  <div className="text-headline-md font-display-lg text-tertiary">{bookings.length} <span className="text-sm">حصة</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Enrolled Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-headline-md font-display-lg text-primary">الكورسات الحالية</h2>
                <span className="text-label-caps font-label-caps bg-primary/10 text-primary px-3 py-1 rounded-full">{enrollments.length} كورسات نشطة</span>
              </div>
              
              {enrollments.length === 0 ? (
                <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">school</span>
                  <p className="font-body-base mb-4">لم تشترك في أي كورس بعد.</p>
                  <Link href="/courses" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold">تصفح الكورسات</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrollments.map((en: any) => (
                    <div key={en.id} className="glass-card rounded-xl overflow-hidden group hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] hover:border-primary/30 transition-all duration-500">
                      <div className="h-40 relative bg-surface-container-highest">
                        {en.courses?.image_url ? (
                           <img className="w-full h-full object-cover" alt={en.courses.title} src={en.courses.image_url}/>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <span className="material-symbols-outlined text-4xl text-on-surface-variant">image</span>
                           </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
                      </div>
                      <div className="p-6 space-y-4">
                        <h3 className="font-headline-md text-on-surface">{en.courses?.title}</h3>
                        <Link href={`/courses/${en.course_id}`} className="block text-center w-full py-3 bg-primary text-on-primary font-bold rounded-lg transition-transform hover:scale-[0.98]">
                          الدخول للكورس
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Purchased Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-headline-md font-display-lg text-primary">المنتجات المشتراة</h2>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-surface-container-lowest border-b border-white/5">
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">المنتج</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">التاريخ</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">الحالة</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">السعر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-on-surface-variant">لا توجد منتجات مشتراة.</td>
                        </tr>
                      ) : (
                        orders.map((order: any) => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-primary">menu_book</span>
                                </div>
                                <div>
                                  <div className="font-body-base text-on-surface">{order.books?.title}</div>
                                  <div className="text-xs text-on-surface-variant">{order.format === 'DIGITAL' ? 'نسخة رقمية (PDF)' : 'نسخة مطبوعة'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-body-base font-code-sm">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="p-4">
                              <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">{order.status === 'PENDING' ? 'قيد التجهيز' : 'مكتمل'}</span>
                            </td>
                            <td className="p-4 font-code-sm text-primary">{order.amount} ج.م</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Booked Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-headline-md font-display-lg text-primary">الحصص المباشرة المحجوزة</h2>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-surface-container-lowest border-b border-white/5">
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">الحصة</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">الموعد</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">المدرب</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">رابط زووم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-on-surface-variant">لم تقم بحجز أي حصص.</td>
                        </tr>
                      ) : (
                        bookings.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-on-surface">{booking.live_sessions?.title}</div>
                              <div className="text-xs text-on-surface-variant">{booking.live_sessions?.session_type === 'PRIVATE' ? 'حصة خاصة' : 'مراجعة'}</div>
                            </td>
                            <td className="p-4">
                              <div>{new Date(booking.live_sessions?.session_date).toLocaleDateString('ar-EG')}</div>
                              <div className="text-xs text-primary">{new Date(booking.live_sessions?.session_date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td className="p-4">{booking.live_sessions?.instructor_name}</td>
                            <td className="p-4">
                              {(() => {
                                const sessionTime = new Date(booking.live_sessions?.session_date).getTime();
                                const nowTime = new Date().getTime();
                                const isTimeArrived = nowTime >= sessionTime;
                                
                                if (!booking.live_sessions?.zoom_link) {
                                  return <span className="text-xs text-on-surface-variant">لم يحدد بعد</span>;
                                }
                                
                                if (isTimeArrived) {
                                  return (
                                    <a href={booking.live_sessions.zoom_link} target="_blank" rel="noreferrer" className="px-3 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors inline-block">دخول للقاعة</a>
                                  );
                                }
                                
                                return <span className="text-xs text-on-surface-variant">الرابط يظهر وقت البث</span>;
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-headline-md font-display-lg text-primary">سجل شحن المحفظة</h2>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-surface-container-lowest border-b border-white/5">
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">رقم العملية</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">التاريخ</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">المبلغ</th>
                        <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {walletHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-on-surface-variant">لا توجد سجلات شحن سابقة.</td>
                        </tr>
                      ) : (
                        walletHistory.map((req: any) => (
                          <tr key={req.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-code-sm text-xs text-on-surface-variant" dir="ltr">{req.id.split('-')[0]}</td>
                            <td className="p-4 text-body-base font-code-sm">{new Date(req.created_at).toLocaleString('ar-EG')}</td>
                            <td className="p-4 font-code-sm text-primary">+{req.amount} ج.م</td>
                            <td className="p-4">
                              {req.status === 'APPROVED' ? (
                                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">تم الشحن</span>
                              ) : req.status === 'REJECTED' ? (
                                <span className="px-3 py-1 rounded-full bg-error/10 text-error text-xs font-bold">مرفوض</span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold">قيد المراجعة</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </section>
      </div>
    </main>
  );
}
