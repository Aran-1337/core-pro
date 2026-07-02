"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pricingType, setPricingType] = useState('ONE_TIME');
  const [price, setPrice] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [features, setFeatures] = useState<string[]>(['وصول للمحتوى الخاص بالكورس']);

  const handleAddFeature = () => setFeatures([...features, '']);
  const handleRemoveFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));
  const handleFeatureChange = (index: number, val: string) => {
    const newFeatures = [...features];
    newFeatures[index] = val;
    setFeatures(newFeatures);
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setTitle('');
    setDesc('');
    setPricingType('ONE_TIME');
    setPrice('');
    setOriginalPrice('');
    setFeatures(['وصول للمحتوى الخاص بالكورس', 'دعم فني مباشر مع المهندس']);
    setIsPublished(false);
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setTitle(course.title || '');
    setDesc(course.description || '');
    setPricingType(course.pricing_type || 'ONE_TIME');
    setPrice(course.price?.toString() || '');
    setOriginalPrice(course.original_price?.toString() || '');
    setFeatures(course.features && course.features.length > 0 ? course.features : ['وصول للمحتوى الخاص بالكورس']);
    setIsPublished(course.is_published || false);
    setImageFile(null);
    setImagePreview(course.image_url || '');
    setIsModalOpen(true);
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let imageUrl = imagePreview;

      // Upload image if a new file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('courses').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('courses').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const courseData = {
        title,
        description: desc,
        pricing_type: pricingType,
        price: parseFloat(price || '0'),
        original_price: parseFloat(originalPrice) || null,
        features: features.filter(f => f.trim() !== ''),
        is_published: isPublished,
        image_url: imageUrl
      };

      if (editingCourse) {
        await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
      } else {
        await supabase.from('courses').insert(courseData);
      }

      setIsModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
    setIsSaving(false);
  };

  const deleteCourse = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الكورس وجميع بياناته؟")) {
      await supabase.from('courses').delete().eq('id', id);
      fetchCourses();
    }
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">إدارة الكورسات</h1>
          <p className="text-on-surface-variant text-sm">أضف، عدّل، أو احذف محتوى الكورسات، وتحكم في أسعارها ونوع الاشتراك.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للوحة التحكم
          </Link>
          <button 
            onClick={openAddModal}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            إضافة كورس جديد
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-2xl overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 bg-surface-container-low flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="ابحث عن كورس..." 
              className="w-full bg-surface-container-highest border border-white/10 rounded-lg pr-10 pl-4 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-label-caps">الكورس</th>
                <th className="px-6 py-4 font-label-caps">الحالة</th>
                <th className="px-6 py-4 font-label-caps">نظام الدفع والسعر</th>
                <th className="px-6 py-4 font-label-caps">الطلاب / التقييم</th>
                <th className="px-6 py-4 font-label-caps text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    جاري تحميل الكورسات...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    لا يوجد أي كورسات مضافة حالياً.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-dashed border-white/20 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {course.image_url ? (
                            <img src={course.image_url} className="w-full h-full object-cover" alt="Thumbnail" />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">image</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface">{course.title}</h3>
                          <p className="text-xs text-on-surface-variant">{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.is_published ? (
                        <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold border border-secondary/20">منشور</span>
                      ) : (
                        <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold border border-white/10">مسودة</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-code-sm text-primary font-bold">
                          {course.price == 0 ? 'مجاني' : `${course.price} EGP`}
                        </span>
                        <span className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">
                            {course.pricing_type === 'SUBSCRIPTION' ? 'event_repeat' : 'shopping_cart'}
                          </span>
                          {course.pricing_type === 'SUBSCRIPTION' ? 'اشتراك شهري' : 'دفع مرة واحدة'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-code-sm">-- طالب</div>
                        <div className="flex items-center gap-1 text-secondary">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold text-xs">--</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/courses/${course.id}`}
                          className="px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors flex items-center gap-1 font-bold text-xs" title="إدارة المحتوى"
                        >
                          <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                          إدارة المنهج
                        </Link>
                        <button 
                          onClick={() => openEditModal(course)}
                          className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors" title="تعديل بيانات الكورس"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => deleteCourse(course.id)}
                          className="p-2 hover:bg-error/20 text-error rounded-lg transition-colors" title="حذف الكورس"
                        >
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

      {/* Unified Add/Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl rounded-2xl p-6 md:p-8 border border-primary/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-bold text-2xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingCourse ? 'edit' : 'menu_book'}</span>
              {editingCourse ? 'تعديل بيانات الكورس' : 'إضافة كورس جديد'}
            </h3>
            
            <form onSubmit={saveCourse} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">عنوان الكورس</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: دورة تطوير الويب..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">وصف أو إحصائيات (مثل: ٢٤ درس)</label>
                  <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="٢٤ درس • ٤٥ ساعة" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                </div>
              </div>

              {/* Pricing Settings (Crucial for User's Request) */}
              <div className="bg-surface-container-low border border-white/5 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">payments</span>
                    نظام التسعير والاشتراك
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm font-bold text-on-surface-variant">حالة النشر:</span>
                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="rounded border-white/10 bg-surface-container-highest text-primary" />
                    <span className="text-sm text-primary">{isPublished ? 'منشور للطلاب' : 'مسودة'}</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <label className={`relative cursor-pointer group rounded-xl border p-4 flex flex-col items-center justify-center gap-3 transition-all ${pricingType === 'ONE_TIME' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="pricingType" className="sr-only" checked={pricingType === 'ONE_TIME'} onChange={() => setPricingType('ONE_TIME')} />
                    <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                    <span className="font-bold">دفع مرة واحدة (محفظة)</span>
                    <span className="text-xs text-on-surface-variant text-center">الطالب يمتلك الكورس مدى الحياة بمجرد شرائه</span>
                  </label>

                  <label className={`relative cursor-pointer group rounded-xl border p-4 flex flex-col items-center justify-center gap-3 transition-all ${pricingType === 'SUBSCRIPTION' ? 'border-secondary bg-secondary/10' : 'border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="pricingType" className="sr-only" checked={pricingType === 'SUBSCRIPTION'} onChange={() => setPricingType('SUBSCRIPTION')} />
                    <span className="material-symbols-outlined text-3xl">event_repeat</span>
                    <span className="font-bold">اشتراك شهري (متجدد)</span>
                    <span className="text-xs text-on-surface-variant text-center">الطالب يدفع شهرياً لاستمرار الوصول للكورس والحصص</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">
                      {pricingType === 'ONE_TIME' ? 'سعر الكورس بعد الخصم (EGP)' : 'سعر الاشتراك الشهري (EGP)'}
                    </label>
                    <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-lg font-code-sm text-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">
                      السعر الأصلي قبل الخصم (اختياري)
                    </label>
                    <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="السعر قبل الخصم" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-lg font-code-sm line-through text-on-surface-variant" />
                  </div>
                </div>
              </div>

              {/* Course Features */}
              <div className="bg-surface-container-low border border-white/5 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">verified</span>
                    مميزات الكورس (تظهر للطالب)
                  </h4>
                  <button type="button" onClick={handleAddFeature} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-sm">add</span>
                    إضافة ميزة
                  </button>
                </div>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text" 
                        value={feature} 
                        onChange={e => handleFeatureChange(index, e.target.value)} 
                        placeholder="مثال: شهادة إتمام معتمدة" 
                        className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-2 focus:border-primary focus:outline-none text-on-surface text-sm" 
                      />
                      {features.length > 1 && (
                        <button type="button" onClick={() => handleRemoveFeature(index)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">صورة الغلاف</label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }} />
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary/50 transition-colors cursor-pointer bg-surface-container-highest overflow-hidden relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 hover:opacity-30 transition-opacity" />
                  ) : null}
                  <span className="material-symbols-outlined text-4xl mb-2 relative z-10">add_photo_alternate</span>
                  <span className="font-bold relative z-10">{imagePreview ? 'تغيير الصورة' : 'اضغط لرفع صورة'}</span>
                  <span className="text-xs mt-1 relative z-10">PNG, JPG حتى 5MB</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg font-bold text-on-surface hover:bg-white/5 transition-colors">
                  إلغاء
                </button>
                <button type="submit" disabled={isSaving} className="px-6 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)] disabled:opacity-50">
                  {isSaving ? 'جاري الحفظ...' : (editingCourse ? 'حفظ التعديلات' : 'حفظ وإنشاء الكورس')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
