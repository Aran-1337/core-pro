"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function CourseWatchPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId");
  
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseData();
  }, [params.id, lessonIdParam]);

  const fetchCourseData = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    
    // Fetch course
    const { data: cData } = await supabase.from('courses').select('*').eq('id', params.id).single();
    if (!cData) {
      router.push('/courses');
      return;
    }
    setCourse(cData);

    // Fetch modules and lessons
    const { data: mData } = await supabase
      .from('course_modules')
      .select('*, course_lessons(*)')
      .eq('course_id', params.id)
      .order('sort_order', { ascending: true });

    if (mData) {
      // Sort lessons inside modules
      mData.forEach(m => {
        if (m.course_lessons) {
          m.course_lessons.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        }
      });
      setModules(mData);

      // Find current lesson
      let selectedLesson = null;
      let selectedModuleId = null;

      if (lessonIdParam) {
        for (const m of mData) {
          const l = m.course_lessons?.find((x: any) => x.id === lessonIdParam);
          if (l) {
            selectedLesson = l;
            selectedModuleId = m.id;
            break;
          }
        }
      }

      // If no lesson specified, pick the first lesson of the first module
      if (!selectedLesson && mData.length > 0 && mData[0].course_lessons?.length > 0) {
        selectedLesson = mData[0].course_lessons[0];
        selectedModuleId = mData[0].id;
      }

      // Authorization Check
      if (selectedLesson && selectedLesson.is_locked) {
        // Need to check if user is enrolled or admin
        if (!authData?.user) {
          router.push(`/courses/${params.id}`); // Redirect to course details
          return;
        }

        const { data: userProfile } = await supabase.from('users').select('role').eq('id', authData.user.id).single();
        const isAdmin = userProfile?.role === 'ADMIN';

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('course_id', params.id)
          .single();

        if (!isAdmin) {
          if (!enrollment) {
            router.push(`/courses/${params.id}`); // Not authorized
            return;
          }
          
          if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
            // Subscription expired
            router.push(`/courses/${params.id}?expired=true`);
            return;
          }
        }
      }

      setCurrentLesson(selectedLesson);
      if (selectedModuleId) setOpenModule(selectedModuleId);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <main className="pt-24 pb-0 flex flex-col lg:flex-row min-h-screen">
      
      {/* Video Area (Main) */}
      <section className="flex-1 flex flex-col border-r border-white/5 order-1">
        <div className="w-full bg-black aspect-video relative flex items-center justify-center">
          {currentLesson?.video_url ? (
            <iframe 
              src={currentLesson.video_url} 
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl mb-4 block">videocam_off</span>
              <p>لا يوجد فيديو متاح لهذا الدرس.</p>
            </div>
          )}
        </div>
        
        <div className="p-6 md:p-10 overflow-y-auto">
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
            <Link href={`/courses/${course.id}`} className="hover:underline">{course.title}</Link>
            <span className="material-symbols-outlined text-xs">chevron_left</span>
            <span className="text-on-surface-variant">{currentLesson?.title}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-6">{currentLesson?.title || 'جاري التحميل...'}</h1>
          
          <div className="prose prose-invert max-w-none text-on-surface-variant">
            {currentLesson?.content ? (
              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
            ) : (
              <p>لا يوجد تفاصيل إضافية لهذا الدرس.</p>
            )}
          </div>
        </div>
      </section>

      {/* Sidebar (Playlist) */}
      <aside className="w-full lg:w-96 bg-surface-container-low flex flex-col order-2 lg:order-1 border-t lg:border-t-0 border-white/5 h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] lg:sticky lg:top-24 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-surface-container-lowest">
          <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            محتوى الكورس
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {modules.map((module, mIndex) => (
            <div key={module.id} className="border border-white/5 rounded-lg overflow-hidden bg-surface-container-highest">
              <button 
                className="w-full p-4 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
                onClick={() => setOpenModule(openModule === module.id ? null : module.id)}
              >
                <div className="text-right">
                  <div className="text-xs text-on-surface-variant mb-1">وحدة {mIndex + 1}</div>
                  <div className="font-bold text-on-surface text-sm">{module.title}</div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  {openModule === module.id ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              
              <div className={`divide-y divide-white/5 ${openModule === module.id ? 'block' : 'hidden'}`}>
                {module.course_lessons?.map((lesson: any) => {
                  const isActive = currentLesson?.id === lesson.id;
                  // If we are in the player, we assume the user has access to at least free lessons
                  // If they hit a locked lesson and are not enrolled, they will be redirected to course details by the useEffect
                  return (
                    <Link 
                      href={`/courses/${course.id}/watch?lessonId=${lesson.id}`}
                      key={lesson.id} 
                      className={`flex items-start gap-3 p-3 transition-colors ${isActive ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-white/5 border-r-2 border-transparent'}`}
                    >
                      <span className={`material-symbols-outlined text-sm mt-0.5 ${isActive ? 'text-primary' : (lesson.is_locked ? 'text-on-surface-variant' : 'text-primary/70')}`}>
                        {lesson.is_locked ? 'lock' : 'play_circle'}
                      </span>
                      <div>
                        <div className={`text-sm font-medium ${isActive ? 'text-primary font-bold' : 'text-on-surface'}`}>{lesson.title}</div>
                        <div className="text-xs text-on-surface-variant mt-1">{lesson.duration_minutes} دقيقة</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

    </main>
  );
}
