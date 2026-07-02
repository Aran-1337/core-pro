"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AdminCurriculumPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);

  // Modals state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleOrder, setModuleOrder] = useState("");

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonOrder, setLessonOrder] = useState("");
  const [lessonVideoId, setLessonVideoId] = useState("");
  const [lessonIsLocked, setLessonIsLocked] = useState(true);
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonAttachmentTitle, setLessonAttachmentTitle] = useState("");
  const [lessonAttachmentUrl, setLessonAttachmentUrl] = useState("");
  const [lessonAttachmentFile, setLessonAttachmentFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch course details
    const { data: cData } = await supabase.from('courses').select('id, title').eq('id', params.id).single();
    if (cData) setCourse(cData);

    // Fetch curriculum
    const { data: mData } = await supabase
      .from('course_modules')
      .select('*, course_lessons(*)')
      .eq('course_id', params.id)
      .order('order_index', { ascending: true });

    if (mData) {
      // Sort lessons inside modules
      const sorted = mData.map((m: any) => ({
        ...m,
        course_lessons: m.course_lessons?.sort((a:any, b:any) => a.order_index - b.order_index) || []
      }));
      setModules(sorted);
    }
    
    setLoading(false);
  };

  // --- Module Actions ---
  const openAddModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    setModuleOrder((modules.length + 1).toString());
    setIsModuleModalOpen(true);
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleOrder(mod.order_index.toString());
    setIsModuleModalOpen(true);
  };

  const saveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data = {
      course_id: params.id,
      title: moduleTitle,
      order_index: parseInt(moduleOrder) || 0
    };
    
    let err = null;
    if (editingModule) {
      const { error } = await supabase.from('course_modules').update(data).eq('id', editingModule.id);
      err = error;
    } else {
      const { error } = await supabase.from('course_modules').insert(data);
      err = error;
    }
    
    if (err) {
      alert("Error saving module: " + err.message);
    } else {
      setIsModuleModalOpen(false);
      fetchData();
    }
    setIsSaving(false);
  };

  const deleteModule = async (id: string) => {
    if (confirm("تحذير: سيتم حذف هذه الوحدة وجميع الدروس الموجودة بداخلها! هل أنت متأكد؟")) {
      await supabase.from('course_modules').delete().eq('id', id);
      fetchData();
    }
  };

  // --- Lesson Actions ---
  const openAddLesson = (modId: string) => {
    setEditingLesson(null);
    setSelectedModuleId(modId);
    setLessonTitle("");
    setLessonDuration("0");
    const mod = modules.find(m => m.id === modId);
    setLessonOrder(((mod?.course_lessons?.length || 0) + 1).toString());
    setLessonVideoId("");
    setLessonIsLocked(true);
    setLessonDescription("");
    setLessonAttachmentTitle("");
    setLessonAttachmentUrl("");
    setLessonAttachmentFile(null);
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (lesson: any, modId: string) => {
    setEditingLesson(lesson);
    setSelectedModuleId(modId);
    setLessonTitle(lesson.title);
    setLessonDuration(lesson ? lesson.duration_minutes?.toString() : '');
    setLessonOrder(lesson ? lesson.order_index?.toString() : '');
    setLessonVideoId(lesson ? (lesson.video_url || '') : '');
    setLessonIsLocked(lesson ? lesson.is_locked : true);
    setLessonDescription(lesson ? (lesson.description || '') : '');
    setLessonAttachmentTitle(lesson ? (lesson.attachment_title || '') : '');
    setLessonAttachmentUrl(lesson ? (lesson.attachment_url || '') : '');
    setLessonAttachmentFile(null);
    setIsLessonModalOpen(true);
  };

  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Extract YouTube ID if it's a URL
    let finalVideoId = lessonVideoId;
    if (lessonVideoId.includes('youtube.com') || lessonVideoId.includes('youtu.be')) {
      try {
        const url = new URL(
          lessonVideoId.startsWith('http') ? lessonVideoId : `https://${lessonVideoId}`
        );
        if (url.hostname.includes('youtube.com')) {
          finalVideoId = url.searchParams.get('v') || lessonVideoId;
        } else if (url.hostname.includes('youtu.be')) {
          finalVideoId = url.pathname.slice(1) || lessonVideoId;
        }
      } catch (e) {
        // Not a valid URL, treat as ID
      }
    }

    let finalAttachmentUrl = lessonAttachmentUrl;
    if (lessonAttachmentFile) {
      const fileExt = lessonAttachmentFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('course_materials').upload(fileName, lessonAttachmentFile);
      if (uploadError) {
        alert("فشل رفع الملف: " + uploadError.message);
        setIsSaving(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('course_materials').getPublicUrl(fileName);
      finalAttachmentUrl = publicUrl;
    }

    const data = {
      module_id: selectedModuleId,
      title: lessonTitle,
      duration_minutes: parseInt(lessonDuration) || 0,
      order_index: parseInt(lessonOrder) || 0,
      video_url: finalVideoId,
      is_locked: lessonIsLocked,
      description: lessonDescription,
      attachment_title: lessonAttachmentTitle,
      attachment_url: finalAttachmentUrl
    };
    
    let err = null;
    if (editingLesson) {
      const { error } = await supabase.from('course_lessons').update(data).eq('id', editingLesson.id);
      err = error;
    } else {
      const { error } = await supabase.from('course_lessons').insert(data);
      err = error;
    }
    
    if (err) {
      alert("Error saving lesson: " + err.message);
    } else {
      setIsLessonModalOpen(false);
      fetchData();
    }
    setIsSaving(false);
  };

  const deleteLesson = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الدرس؟")) {
      await supabase.from('course_lessons').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2 flex items-center gap-2">
            إدارة المنهج:
            <span className="text-primary">{course?.title || 'جاري التحميل...'}</span>
          </h1>
          <p className="text-on-surface-variant text-sm">أضف وحدات (Modules) ودروس (Lessons)، وضع معرفات فيديو يوتيوب (YouTube Video IDs).</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/courses" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للكورسات
          </Link>
          <button 
            onClick={openAddModule}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            إضافة وحدة جديدة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : modules.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center border border-white/5">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">account_tree</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">المنهج فارغ حالياً</h2>
          <p className="text-on-surface-variant mb-6">ابدأ بإضافة "وحدة" أولاً، ثم يمكنك إضافة الدروس بداخلها.</p>
          <button onClick={openAddModule} className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold">
            إضافة الوحدة الأولى
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module.id} className="glass-card rounded-2xl overflow-hidden border border-white/5">
              {/* Module Header */}
              <div className="bg-surface-container-low p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {module.order_index}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-lg">{module.title}</h3>
                    <p className="text-xs text-on-surface-variant">{module.course_lessons?.length || 0} دروس في هذه الوحدة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openAddLesson(module.id)}
                    className="px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    إضافة درس
                  </button>
                  <button onClick={() => openEditModule(module)} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="تعديل الوحدة">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => deleteModule(module.id)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors" title="حذف الوحدة">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>

              {/* Lessons List */}
              <div className="p-4 md:p-6 space-y-3 bg-background/50">
                {!module.course_lessons || module.course_lessons.length === 0 ? (
                  <div className="text-sm text-on-surface-variant p-4 text-center italic border border-dashed border-white/10 rounded-lg">
                    لا توجد دروس هنا. أضف درسك الأول.
                  </div>
                ) : (
                  module.course_lessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-surface-container-highest border border-white/5 group hover:border-white/20 transition-colors gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-on-surface-variant font-code-sm text-xs w-6">{lesson.order_index}-</span>
                        <div className={`p-1.5 rounded-full ${lesson.is_locked ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                          <span className="material-symbols-outlined text-sm">{lesson.is_locked ? 'lock' : 'lock_open'}</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-on-surface">{lesson.title}</div>
                          <div className="text-xs text-on-surface-variant font-code-sm flex gap-2 mt-1">
                            <span>{lesson.duration_minutes} min</span>
                            {lesson.video_url && <span>• Video ID: {lesson.video_url}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditLesson(lesson, module.id)} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors bg-white/5 rounded">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors bg-white/5 rounded">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Module Modal --- */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-primary/20 shadow-2xl relative">
            <h3 className="font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingModule ? 'edit' : 'add'}</span>
              {editingModule ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
            </h3>
            <form onSubmit={saveModule} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">عنوان الوحدة</label>
                <input required type="text" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} placeholder="مثال: أساسيات بايثون" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">رقم الترتيب (للعرض)</label>
                <input required type="number" value={moduleOrder} onChange={e => setModuleOrder(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setIsModuleModalOpen(false)} className="flex-1 py-3 rounded-lg font-bold bg-surface-container-high hover:bg-white/5 transition-colors">إلغاء</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-lg font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Lesson Modal --- */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-secondary/20 shadow-2xl relative">
            <h3 className="font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">{editingLesson ? 'edit' : 'play_lesson'}</span>
              {editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
            </h3>
            <form onSubmit={saveLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">عنوان الدرس</label>
                <input required type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="مثال: المتغيرات Data Types" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">مدة الدرس (دقائق)</label>
                  <input required type="number" value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">رقم الترتيب</label>
                  <input required type="number" value={lessonOrder} onChange={e => setLessonOrder(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2">
                  <span className="text-secondary">#</span> معرف الفيديو (YouTube Video ID)
                </label>
                <input type="text" dir="ltr" value={lessonVideoId} onChange={e => setLessonVideoId(e.target.value)} placeholder="e.g. dQw4w9WgXcQ" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-secondary focus:outline-none text-on-surface font-code-sm" />
                <p className="text-xs text-on-surface-variant mt-1">ضع الـ ID الخاص بفيديو اليوتيوب (الغير مدرج). مثال: إذا كان الرابط youtube.com/watch?v=dQw4w9WgXcQ فالـ ID هو dQw4w9WgXcQ</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2">
                  <span className="text-primary">#</span> وصف الدرس أو الملاحظات (اختياري)
                </label>
                <textarea 
                  value={lessonDescription} 
                  onChange={e => setLessonDescription(e.target.value)} 
                  placeholder="اكتب هنا تفاصيل الدرس، ملاحظات هامة للطلاب، أو أي نص ترغب بظهوره أسفل الفيديو..." 
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface min-h-[100px] resize-y" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border border-white/5 bg-surface-container-low p-4 rounded-xl">
                <div className="col-span-2">
                  <h4 className="font-bold text-sm text-on-surface flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-secondary text-base">attachment</span>
                    مرفقات الدرس (اختياري)
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2">اسم المرفق (مثال: امتحان الدرس الأول)</label>
                  <input type="text" value={lessonAttachmentTitle} onChange={e => setLessonAttachmentTitle(e.target.value)} placeholder="اسم الملف أو الامتحان..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 focus:border-primary focus:outline-none text-on-surface text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2">رابط خارجي (Google Drive)</label>
                  <input type="url" dir="ltr" value={lessonAttachmentUrl} onChange={e => setLessonAttachmentUrl(e.target.value)} placeholder="https://..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-3 py-2 focus:border-primary focus:outline-none text-on-surface text-sm font-code-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant mb-2">أو رفع ملف مباشر للمنصة (PDF، Word، صور...)</label>
                  <input type="file" onChange={e => setLessonAttachmentFile(e.target.files?.[0] || null)} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 border border-white/5 p-1 rounded-lg bg-surface-container-highest" />
                  {lessonAttachmentFile && <p className="text-xs text-primary mt-2">سيتم رفع: {lessonAttachmentFile.name}</p>}
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-on-surface">حالة قفل الدرس (Lock)</h4>
                  <p className="text-xs text-on-surface-variant">الدرس المقفول يظهر فقط للمشتركين. الدرس المفتوح متاح للجميع كعينة مجانية.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={lessonIsLocked} onChange={e => setLessonIsLocked(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-primary/20 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error"></div>
                  <span className="mr-3 text-sm font-bold text-on-surface w-12 text-center">
                    {lessonIsLocked ? 'مقفول' : 'مفتوح'}
                  </span>
                </label>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-3 rounded-lg font-bold bg-surface-container-high hover:bg-white/5 transition-colors">إلغاء</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-lg font-bold bg-secondary text-on-secondary hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,107,255,0.2)]">حفظ الدرس</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
