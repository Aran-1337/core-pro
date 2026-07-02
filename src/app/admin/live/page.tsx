"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { LiveSession } from "@/types";
import { getAllLiveSessionsAdmin } from "@/services/liveSessionService";

export default function AdminLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Add/Edit session modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('0');
  const [maxSeats, setMaxSeats] = useState('50');
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL'>('ALL');
  const [zoomLink, setZoomLink] = useState('');
  const [sessionType, setSessionType] = useState<'PRIVATE' | 'REVIEW'>('PRIVATE');
  const [isPublished, setIsPublished] = useState(false);

  // Bookings detail modal
  const [bookingsModalSession, setBookingsModalSession] = useState<LiveSession | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Zoom link quick-send modal
  const [zoomModalSession, setZoomModalSession] = useState<LiveSession | null>(null);
  const [zoomLinkInput, setZoomLinkInput] = useState('');
  const [isSendingZoom, setIsSendingZoom] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const data = await getAllLiveSessionsAdmin();
    setSessions(data);

    // Fetch booking counts for all sessions
    if (data.length > 0) {
      const { data: counts } = await supabase
        .from('session_bookings')
        .select('session_id')
        .in('session_id', data.map(s => s.id));

      if (counts) {
        const countMap: Record<string, number> = {};
        counts.forEach((b: any) => {
          countMap[b.session_id] = (countMap[b.session_id] || 0) + 1;
        });
        setBookingCounts(countMap);
      }
    }

    setLoading(false);
  };

  const openAddModal = () => {
    setEditingSession(null);
    setTitle(''); setDescription(''); setInstructor('');
    setDate(''); setTime(''); setPrice('0'); setMaxSeats('50');
    setLevel('ALL'); setZoomLink(''); setSessionType('PRIVATE'); setIsPublished(false);
    setIsModalOpen(true);
  };

  const openEditModal = (session: LiveSession) => {
    setEditingSession(session);
    setTitle(session.title);
    setDescription(session.description || '');
    setInstructor(session.instructor_name);
    const d = new Date(session.session_date);
    setDate(d.toISOString().split('T')[0]);
    setTime(d.toTimeString().slice(0, 5));
    setPrice(String(session.price));
    setMaxSeats(String(session.max_seats));
    setLevel(session.level as any);
    setZoomLink(session.zoom_link || '');
    setSessionType(session.session_type as any);
    setIsPublished(session.is_published);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const timeStr = time.length === 5 ? `${time}:00` : time;
      const sessionDateTime = new Date(`${date}T${timeStr}`).toISOString();
      const payload = {
        title, description,
        instructor_name: instructor,
        session_date: sessionDateTime,
        price: parseFloat(price) || 0,
        max_seats: parseInt(maxSeats) || 0,
        level, zoom_link: zoomLink,
        session_type: sessionType,
        is_published: isPublished,
      };

      let error;
      if (editingSession) {
        ({ error } = await supabase.from('live_sessions').update(payload).eq('id', editingSession.id));
      } else {
        ({ error } = await supabase.from('live_sessions').insert(payload));
      }

      if (error) { alert(`حدث خطأ: ${error.message}`); }
      else { setIsModalOpen(false); fetchSessions(); alert(editingSession ? 'تم التعديل!' : 'تمت الإضافة!'); }
    } catch (err: any) { alert(`خطأ: ${err.message}`); }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    await supabase.from('live_sessions').update({ is_published: !currentStatus }).eq('id', id);
    fetchSessions();
  };

  const deleteSession = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف الحصة؟')) {
      await supabase.from('live_sessions').delete().eq('id', id);
      fetchSessions();
    }
  };

  // Open bookings detail modal
  const openBookingsModal = async (session: LiveSession) => {
    setBookingsModalSession(session);
    setBookingsLoading(true);
    const { data } = await supabase
      .from('session_bookings')
      .select('*, users(full_name, phone, email)')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false });
    setBookings(data || []);
    setBookingsLoading(false);
  };

  // Open zoom quick-send modal
  const openZoomModal = (session: LiveSession) => {
    setZoomModalSession(session);
    setZoomLinkInput(session.zoom_link || '');
  };

  // Save zoom link and "push" it to students (saves to session record)
  const sendZoomLink = async () => {
    if (!zoomModalSession) return;
    setIsSendingZoom(true);
    const { error } = await supabase
      .from('live_sessions')
      .update({ zoom_link: zoomLinkInput })
      .eq('id', zoomModalSession.id);

    if (error) {
      alert(`حدث خطأ: ${error.message}`);
    } else {
      alert(`✅ تم حفظ الرابط! سيظهر للطلاب المحجوزين تلقائياً عند حلول موعد الحصة.`);
      setZoomModalSession(null);
      fetchSessions();
    }
    setIsSendingZoom(false);
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">إدارة الحصص المباشرة</h1>
          <p className="text-on-surface-variant text-sm">جدولة الحصص القادمة وإرسال روابط الدخول للطلاب.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            لوحة التحكم
          </Link>
          <button onClick={openAddModal} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)]">
            <span className="material-symbols-outlined text-sm">add</span>
            جدولة حصة جديدة
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-surface-container-low border-b border-white/5 text-on-surface-variant text-sm">
              <tr>
                <th className="px-6 py-4 font-bold">الحصة</th>
                <th className="px-6 py-4 font-bold">الموعد</th>
                <th className="px-6 py-4 font-bold">النوع/المستوى</th>
                <th className="px-6 py-4 font-bold">السعر</th>
                <th className="px-6 py-4 font-bold text-center">الحجوزات</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-on-surface-variant">جاري التحميل...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-on-surface-variant">لا توجد حصص مجدولة.</td></tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">{session.title}</div>
                      <div className="text-xs text-on-surface-variant">م. {session.instructor_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{new Date(session.session_date).toLocaleDateString('ar-EG')}</div>
                      <div className="text-xs text-primary">{new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{session.session_type === 'PRIVATE' ? 'خاصة' : 'مراجعة'}</div>
                      <div className="text-xs text-on-surface-variant">{session.level}</div>
                    </td>
                    <td className="px-6 py-4 font-code-sm text-primary">{session.price} EGP</td>

                    {/* Bookings Count — clickable */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openBookingsModal(session)}
                        className="inline-flex flex-col items-center gap-1 group"
                        title="عرض قائمة الطلاب"
                      >
                        <span className="text-lg font-bold text-secondary group-hover:text-primary transition-colors">
                          {bookingCounts[session.id] || 0}
                        </span>
                        <span className="text-[10px] text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">group</span>
                          طالب
                        </span>
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublish(session.id, session.is_published)}
                        className={`px-3 py-1 text-xs font-bold rounded-full ${session.is_published ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-surface-container-highest text-on-surface-variant border border-white/10'}`}
                      >
                        {session.is_published ? 'منشورة' : 'مسودة'}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* Send Zoom Link button */}
                        <button
                          onClick={() => openZoomModal(session)}
                          className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                          title="إرسال رابط الزووم"
                        >
                          <span className="material-symbols-outlined text-sm">videocam</span>
                        </button>
                        <button onClick={() => openEditModal(session)} className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors" title="تعديل">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => deleteSession(session.id)} className="p-2 hover:bg-error/20 text-error rounded-lg transition-colors" title="حذف">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ BOOKINGS DETAIL MODAL ============ */}
      {bookingsModalSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl rounded-2xl p-6 md:p-8 border border-secondary/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setBookingsModalSession(null)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-6">
              <h3 className="font-bold text-xl text-on-surface">الطلاب المحجوزون</h3>
              <p className="text-sm text-on-surface-variant mt-1">{bookingsModalSession.title}</p>
            </div>

            {/* Summary bar */}
            <div className="flex items-center gap-4 p-4 bg-secondary/5 border border-secondary/20 rounded-xl mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">group</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{bookingCounts[bookingsModalSession.id] || 0}</div>
                <div className="text-xs text-on-surface-variant">طالب محجوز من أصل {bookingsModalSession.max_seats} مقعد</div>
              </div>
              <div className="mr-auto">
                <button
                  onClick={() => { setBookingsModalSession(null); openZoomModal(bookingsModalSession); }}
                  className="px-4 py-2 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  إرسال رابط الزووم
                </button>
              </div>
            </div>

            {/* Students list */}
            {bookingsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">person_off</span>
                لم يقم أي طالب بالحجز بعد.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking: any, idx) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface text-sm">{booking.users?.full_name || 'غير معروف'}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5" dir="ltr">{booking.users?.phone || booking.users?.email || '—'}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-code-sm text-primary">{booking.amount} EGP</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">{new Date(booking.created_at).toLocaleDateString('ar-EG')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ ZOOM LINK MODAL ============ */}
      {zoomModalSession && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 md:p-8 border border-green-500/30 shadow-2xl relative">
            <button onClick={() => setZoomModalSession(null)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
                <span className="material-symbols-outlined">videocam</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-on-surface">إرسال رابط الزووم</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{zoomModalSession.title}</p>
              </div>
            </div>

            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl mb-6 text-sm text-on-surface-variant leading-relaxed">
              <span className="material-symbols-outlined text-green-500 text-sm align-text-bottom ml-1">info</span>
              عند الحفظ، سيظهر هذا الرابط تلقائياً لجميع الطلاب المحجوزين في لوحة تحكمهم ومن صفحة الملف الشخصي، وذلك فقط عند حلول موعد الحصة.
            </div>

            <div className="mb-2">
              <label className="block text-sm font-bold text-on-surface-variant mb-2">رابط زووم الحصة</label>
              <input
                type="url"
                dir="ltr"
                value={zoomLinkInput}
                onChange={e => setZoomLinkInput(e.target.value)}
                className="w-full bg-surface-container-highest border border-white/10 focus:border-green-500 focus:outline-none rounded-lg px-4 py-3 text-on-surface text-left transition-colors"
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <p className="text-[11px] text-on-surface-variant mb-6">
              عدد الطلاب المحجوزين: <span className="text-secondary font-bold">{bookingCounts[zoomModalSession.id] || 0} طالب</span>
            </p>

            <button
              onClick={sendZoomLink}
              disabled={isSendingZoom || !zoomLinkInput}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">send</span>
              {isSendingZoom ? 'جاري الحفظ...' : 'حفظ وإتاحة الرابط للطلاب'}
            </button>
          </div>
        </div>
      )}

      {/* ============ ADD / EDIT SESSION MODAL ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl rounded-2xl p-6 md:p-8 border border-primary/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-bold text-2xl text-on-surface mb-6">
              {editingSession ? 'تعديل الحصة' : 'جدولة حصة جديدة'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">عنوان الحصة</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">وصف الحصة (اختياري)</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">المدرب</label>
                <input required type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">التاريخ</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">الوقت</label>
                  <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">السعر (EGP)</label>
                  <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">عدد المقاعد</label>
                  <input required type="number" value={maxSeats} onChange={e => setMaxSeats(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">رابط زووم (يمكن إضافته لاحقاً)</label>
                <input type="url" value={zoomLink} onChange={e => setZoomLink(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface text-left" dir="ltr" placeholder="https://zoom.us/j/..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">نوع الحصة</label>
                  <select value={sessionType} onChange={e => setSessionType(e.target.value as any)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface">
                    <option value="PRIVATE">مجموعة خاصة</option>
                    <option value="REVIEW">مراجعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">المستوى</label>
                  <select value={level} onChange={e => setLevel(e.target.value as any)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface">
                    <option value="ALL">الكل</option>
                    <option value="BEGINNER">مبتدئ</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">متقدم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">حالة النشر</label>
                  <select value={isPublished ? 'true' : 'false'} onChange={e => setIsPublished(e.target.value === 'true')} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface">
                    <option value="false">مسودة</option>
                    <option value="true">منشورة</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 mt-6 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,210,255,0.3)]">
                {editingSession ? 'حفظ التعديلات' : 'حفظ الحصة'}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
