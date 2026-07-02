"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { LiveSession } from "@/types";
import { getAllLiveSessionsAdmin } from "@/services/liveSessionService";

export default function AdminLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const data = await getAllLiveSessionsAdmin();
    setSessions(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    
    try {
      // Ensure time has seconds for consistent parsing
      const timeStr = time.length === 5 ? `${time}:00` : time;
      const sessionDateTime = new Date(`${date}T${timeStr}`).toISOString();

      const { error } = await supabase.from('live_sessions').insert({
        title,
        description,
        instructor_name: instructor,
        session_date: sessionDateTime,
        price: parseFloat(price) || 0,
        max_seats: parseInt(maxSeats) || 0,
        level,
        zoom_link: zoomLink,
        session_type: sessionType,
        is_published: isPublished
      });

      if (error) {
        alert(`حدث خطأ أثناء الحفظ: ${error.message}`);
        console.error('Supabase error:', error);
      } else {
        setIsModalOpen(false);
        fetchSessions();
        alert('تمت إضافة الحصة بنجاح!');
      }
    } catch (err: any) {
      alert(`خطأ في التنسيق: ${err.message}`);
      console.error('Parsing error:', err);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    await supabase.from('live_sessions').update({ is_published: !currentStatus }).eq('id', id);
    fetchSessions();
  };

  const deleteSession = async (id: string) => {
    if(confirm('هل أنت متأكد من حذف الحصة؟')) {
      const supabase = createClient();
      await supabase.from('live_sessions').delete().eq('id', id);
      fetchSessions();
    }
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">إدارة الحصص المباشرة</h1>
          <p className="text-on-surface-variant text-sm">جدولة الحصص القادمة والبدء في البث المباشر للطلاب.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للوحة التحكم
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            جدولة حصة جديدة
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-surface-container-low border-b border-white/5 text-on-surface-variant text-sm">
              <tr>
                <th className="px-6 py-4 font-bold">الحصة</th>
                <th className="px-6 py-4 font-bold">الموعد</th>
                <th className="px-6 py-4 font-bold">النوع/المستوى</th>
                <th className="px-6 py-4 font-bold">السعر</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-on-surface-variant">جاري التحميل...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-on-surface-variant">لا توجد حصص مجدولة.</td>
                </tr>
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
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => togglePublish(session.id, session.is_published)}
                        className={`px-3 py-1 text-xs font-bold rounded-full ${session.is_published ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-surface-container-highest text-on-surface-variant border border-white/10'}`}
                      >
                        {session.is_published ? 'منشورة' : 'مسودة'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl rounded-2xl p-6 md:p-8 border border-primary/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-bold text-2xl text-on-surface mb-6">جدولة حصة جديدة</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">عنوان الحصة</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface" />
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
                <label className="block text-sm font-bold text-on-surface-variant mb-2">رابط زووم (اختياري)</label>
                <input type="url" value={zoomLink} onChange={e => setZoomLink(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface text-left" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">نوع الحصة</label>
                  <select value={sessionType} onChange={e => setSessionType(e.target.value as any)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface">
                    <option value="PRIVATE">مجموعة خاصة</option>
                    <option value="REVIEW">مراجعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">حالة النشر</label>
                  <select value={isPublished ? 'true' : 'false'} onChange={e => setIsPublished(e.target.value === 'true')} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface">
                    <option value="false">مسودة</option>
                    <option value="true">منشورة (متاحة للطلاب)</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 mt-6 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all">
                حفظ الحصة
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
