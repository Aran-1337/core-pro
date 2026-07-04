"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { getPublishedCourses } from "@/services/courseService";
import { Course } from "@/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, items } = useCart();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await getPublishedCourses();
    setCourses(data);
    setLoading(false);
  };

  const isCourseInCart = (id: string) => {
    return items.some(item => item.id === id && item.type === 'COURSE');
  };

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-7xl mx-auto min-h-screen">
      <section className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">كورسات المنصة</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            استكشف أحدث الكورسات البرمجية المصممة لتبسيط المفاهيم المعقدة خطوة بخطوة.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-white/5">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">school</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">لا توجد كورسات متاحة حالياً</h2>
          <p className="text-on-surface-variant">ترقبوا الكورسات القادمة قريباً!</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
          {courses.map(course => (
            <div 
              key={course.id} 
              className="glass-card rounded-2xl overflow-hidden flex flex-col group hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)] transition-all duration-300"
            >
              <div className="relative h-64 overflow-hidden bg-surface-container-highest cursor-pointer">
                <Link href={`/courses/${course.id}`} className="absolute inset-0 z-0">
                  {course.image_url ? (
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={course.title} 
                      src={course.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">play_circle</span>
                    </div>
                  )}
                </Link>
                <div className="absolute top-4 right-4 px-3 py-1 rounded backdrop-blur-md border font-code-sm text-code-sm z-10 bg-primary-container/20 border-primary/30 text-primary">
                  كورس
                </div>
                {course.original_price !== undefined && course.original_price > course.price && (
                  <div className="absolute top-4 left-4 px-2 py-1 rounded backdrop-blur-md border font-bold text-xs z-10 bg-error/20 border-error/30 text-error">
                    خصم {Math.round(((course.original_price - course.price) / course.original_price) * 100)}%
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <Link href={`/courses/${course.id}`}>
                  <h3 className="font-headline-md text-on-surface mb-2 hover:text-primary transition-colors">{course.title}</h3>
                </Link>
                <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{course.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-code-sm text-lg font-bold text-primary">{course.price} EGP</span>
                    {course.original_price !== undefined && course.original_price > course.price && (
                      <span className="font-code-sm text-xs text-on-surface-variant line-through">{course.original_price} EGP</span>
                    )}
                  </div>
                  
                  {isCourseInCart(course.id) ? (
                    <Link href="/cart" className="flex items-center gap-2 text-xs font-bold text-secondary bg-secondary/10 px-3 py-2 rounded-lg hover:bg-secondary/20 transition-colors">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      في السلة
                    </Link>
                  ) : (
                    <button 
                      onClick={() => addToCart({
                        id: course.id,
                        title: course.title,
                        price: course.price,
                        type: 'COURSE',
                        image_url: course.image_url
                      })}
                      className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                      title="أضف للسلة"
                    >
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
