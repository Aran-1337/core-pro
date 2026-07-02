"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  
  const [studentName, setStudentName] = useState("");
  const [studentRole, setStudentRole] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingReview(null);
    setStudentName("");
    setStudentRole("");
    setReviewText("");
    setRating("5");
    setImageUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (review: any) => {
    setEditingReview(review);
    setStudentName(review.student_name);
    setStudentRole(review.student_role || "");
    setReviewText(review.review_text);
    setRating(review.rating?.toString() || "5");
    setImageUrl(review.image_url || "");
    setIsModalOpen(true);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الرأي؟")) return;
    await supabase.from('student_reviews').delete().eq('id', id);
    fetchReviews();
  };

  const saveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const data = {
      student_name: studentName,
      student_role: studentRole,
      review_text: reviewText,
      rating: parseInt(rating),
      image_url: imageUrl || null
    };

    let err = null;
    if (editingReview) {
      const { error } = await supabase.from('student_reviews').update(data).eq('id', editingReview.id);
      err = error;
    } else {
      const { error } = await supabase.from('student_reviews').insert(data);
      err = error;
    }

    if (err) {
      alert("حدث خطأ أثناء الحفظ: " + err.message);
    } else {
      setIsModalOpen(false);
      fetchReviews();
    }
    setIsSaving(false);
  };

  return (
    <main className="pt-24 pb-16 px-container-margin max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display-md text-on-surface mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">reviews</span>
            آراء الطلاب
          </h1>
          <p className="text-on-surface-variant">أضف وعدل آراء الطلاب التي تظهر في الصفحة الرئيسية.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm">
            لوحة التحكم
          </Link>
          <button onClick={openAddModal} className="px-4 py-2 bg-primary text-on-primary-container rounded-lg font-bold hover:brightness-110 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            إضافة رأي جديد
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-xl border border-white/5 text-on-surface-variant">
          لا توجد آراء طلاب مضافة حتى الآن.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface-container-low rounded-xl p-6 border border-white/5 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden border border-white/10 shrink-0">
                  {review.image_url ? (
                    <img src={review.image_url} alt={review.student_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                      {review.student_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface leading-tight">{review.student_name}</h3>
                  {review.student_role && (
                    <p className="text-xs text-on-surface-variant mt-1">{review.student_role}</p>
                  )}
                </div>
              </div>
              
              <div className="flex text-amber-400 mb-3 text-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined ${i < review.rating ? 'fill-current' : 'text-surface-container-highest'}`} style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                ))}
              </div>
              
              <p className="text-sm text-on-surface-variant italic mb-6 flex-grow whitespace-pre-line">
                "{review.review_text}"
              </p>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-auto">
                <button onClick={() => openEditModal(review)} className="px-3 py-1.5 bg-surface-container-high rounded text-sm text-on-surface hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">edit</span> تعديل
                </button>
                <button onClick={() => deleteReview(review.id)} className="px-3 py-1.5 bg-surface-container-high rounded text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">delete</span> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit Review */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingReview ? 'edit' : 'add_circle'}</span>
              {editingReview ? 'تعديل الرأي' : 'إضافة رأي جديد'}
            </h2>
            
            <form onSubmit={saveReview} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">اسم الطالب *</label>
                <input required type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">الوصف / التخصص (اختياري)</label>
                <input type="text" value={studentRole} onChange={e => setStudentRole(e.target.value)} placeholder="مثال: مهندس برمجيات، طالب جامعي..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">التقييم من 5 *</label>
                <select value={rating} onChange={e => setRating(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface">
                  <option value="5">5 نجوم</option>
                  <option value="4">4 نجوم</option>
                  <option value="3">3 نجوم</option>
                  <option value="2">نجمتين</option>
                  <option value="1">نجمة واحدة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">نص الرأي *</label>
                <textarea required value={reviewText} onChange={e => setReviewText(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface min-h-[100px] resize-y" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">رابط صورة الطالب (اختياري)</label>
                <input type="url" dir="ltr" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface font-code-sm" />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button type="submit" disabled={isSaving} className="flex-1 bg-primary text-on-primary-container py-3 rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50">
                  {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
