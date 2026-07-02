"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import SecurePlayer from "@/app/components/SecurePlayer";

export default function StudentLearnPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // 1. Check Authentication & User Profile
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      router.push('/login');
      return;
    }
    
    // Get user details for the watermark
    const { data: userProfile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    if (userProfile) setUser(userProfile);

    // 2. Check Enrollment (Admin can also view)
    if (userProfile?.role !== 'ADMIN') {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', authData.user.id)
        .eq('course_id', params.id)
        .single();
      
      if (!enrollData) {
        // Not enrolled, redirect to course page
        router.push(`/courses/${params.id}`);
        return;
      }
    }

    // 3. Fetch Course Details
    const { data: cData } = await supabase.from('courses').select('id, title').eq('id', params.id).single();
    if (cData) setCourse(cData);

    // 4. Fetch Curriculum (Modules & Lessons)
    const { data: mData } = await supabase
      .from('course_modules')
      .select('*, course_lessons(*)')
      .eq('course_id', params.id)
      .order('order_index', { ascending: true });

    if (mData) {
      const sorted = mData.map((m: any) => ({
        ...m,
        course_lessons: m.course_lessons?.sort((a:any, b:any) => a.order_index - b.order_index) || []
      }));
      setModules(sorted);

      // Set initial open module and active lesson
      if (sorted.length > 0) {
        setOpenModule(sorted[0].id);
        if (sorted[0].course_lessons?.length > 0) {
          setActiveLesson(sorted[0].course_lessons[0]);
        }
      }
    }

    setLoading(false);
  };

  const toggleModule = (id: string) => {
    setOpenModule(openModule === id ? null : id);
  };

  const playLesson = (lesson: any, moduleId: string) => {
    setActiveLesson(lesson);
    setOpenModule(moduleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-background flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-white/5 bg-surface-container-low py-4 px-6 flex justify-between items-center sticky top-20 z-40 backdrop-blur-md">
        <div>
          <Link href={`/courses/${params.id}`} className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة لصفحة الكورس
          </Link>
          <h1 className="font-headline-md text-on-surface text-lg truncate max-w-xl">
            {course?.title}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress bar could go here */}
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-on-surface">{user?.full_name}</div>
            <div className="text-xs text-on-surface-variant">طالب</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.full_name?.charAt(0) || 'ش'}
          </div>
        </div>
      </header>

      {/* Main Content (Player & Sidebar) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1920px] mx-auto w-full">
        
        {/* Main Video Area (Left side in LTR, Right side in RTL - we use standard flex so it stays right naturally in RTL) */}
        <main className="flex-1 flex flex-col h-full border-l border-white/5 bg-background">
          {activeLesson ? (
            <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col overflow-y-auto">
              
              {/* Secure Video Player */}
              <div className="mb-6 mx-auto w-full max-w-5xl">
                {activeLesson.video_url ? (
                  <SecurePlayer 
                    videoId={activeLesson.video_url} 
                    studentName={user?.full_name || 'طالب مجهول'} 
                    studentPhoneOrEmail={user?.phone || user?.email || 'لا يوجد بريد'} 
                  />
                ) : (
                  <div className="aspect-video bg-surface-container-highest rounded-2xl flex flex-col items-center justify-center border border-dashed border-white/20">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">videocam_off</span>
                    <p className="text-on-surface-variant font-bold">لا يوجد فيديو متاح لهذا الدرس حالياً.</p>
                  </div>
                )}
              </div>
              
              {/* Lesson Details */}
              <div className="max-w-5xl mx-auto w-full glass-card p-6 rounded-2xl border border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-on-surface">{activeLesson.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-on-surface-variant bg-surface-container-highest px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {activeLesson.duration_minutes} دقيقة
                    </span>
                  </div>
                </div>
                {/* Description or attachments could be added here in the future */}
                <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {activeLesson.description || `هذا الدرس هو جزء من المنهج التعليمي الخاص بكورس ${course?.title}. يرجى الانتباه للمحتوى وتدوين الملاحظات. محتوى الفيديو محمي وتم طباعة بياناتك عليه (علامة مائية).`}
                </p>

                {activeLesson.attachment_url && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <a 
                      href={activeLesson.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/10 hover:bg-secondary text-secondary hover:text-on-secondary rounded-xl font-bold transition-all"
                    >
                      <span className="material-symbols-outlined">download</span>
                      {activeLesson.attachment_title || 'تحميل المرفقات'}
                    </a>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl opacity-20 mb-4">play_circle</span>
              <p className="font-bold text-lg">اختر درساً من القائمة للبدء</p>
            </div>
          )}
        </main>

        {/* Sidebar / Curriculum (Right side in LTR, Left side in RTL) */}
        <aside className="w-full lg:w-96 flex-shrink-0 h-full flex flex-col bg-surface-container-lowest overflow-y-auto border-t lg:border-t-0 border-white/5">
          <div className="p-6 border-b border-white/5 bg-surface-container-low sticky top-0 z-10">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
              محتويات الكورس
            </h3>
          </div>
          
          <div className="flex-1">
            {modules.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                لا توجد وحدات أو دروس مضافة بعد.
              </div>
            ) : (
              modules.map((module, mIndex) => (
                <div key={module.id} className="border-b border-white/5">
                  {/* Module Accordion Header */}
                  <button 
                    onClick={() => toggleModule(module.id)}
                    className={`w-full p-4 flex items-center justify-between transition-colors ${openModule === module.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3 text-right">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${openModule === module.id ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                        {mIndex + 1}
                      </span>
                      <div>
                        <h4 className={`font-bold text-sm ${openModule === module.id ? 'text-primary' : 'text-on-surface'}`}>
                          {module.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {module.course_lessons?.length || 0} دروس
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {openModule === module.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  
                  {/* Lessons List */}
                  {openModule === module.id && (
                    <div className="bg-background py-2">
                      {module.course_lessons?.length === 0 ? (
                        <div className="px-6 py-3 text-xs text-on-surface-variant italic text-center">
                          لا توجد دروس حالياً
                        </div>
                      ) : (
                        module.course_lessons?.map((lesson: any) => (
                          <button
                            key={lesson.id}
                            onClick={() => playLesson(lesson, module.id)}
                            className={`w-full text-right px-6 py-3 flex items-center justify-between group transition-colors ${activeLesson?.id === lesson.id ? 'bg-white/10 relative' : 'hover:bg-white/5'}`}
                          >
                            {/* Active Indicator Line */}
                            {activeLesson?.id === lesson.id && (
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-sm ${activeLesson?.id === lesson.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                                {activeLesson?.id === lesson.id ? 'play_circle' : (lesson.video_url ? 'ondemand_video' : 'article')}
                              </span>
                              <span className={`text-sm ${activeLesson?.id === lesson.id ? 'text-white font-bold' : 'text-on-surface-variant group-hover:text-white transition-colors'}`}>
                                {lesson.title}
                              </span>
                            </div>
                            <span className="text-xs text-on-surface-variant font-code-sm">
                              {lesson.duration_minutes}m
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
        
      </div>
    </div>
  );
}
