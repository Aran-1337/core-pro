"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Book } from "@/types";
import { getAllBooksAdmin } from "@/services/storeService";

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'DIGITAL' | 'PHYSICAL' | 'BOTH'>('BOTH');
  const [priceDigital, setPriceDigital] = useState('');
  const [pricePhysical, setPricePhysical] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLink, setPdfLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalPrice, setOriginalPrice] = useState('');
  const [features, setFeatures] = useState<string[]>(['نسخة عالية الجودة']);

  const handleAddFeature = () => setFeatures([...features, '']);
  const handleRemoveFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));
  const handleFeatureChange = (index: number, val: string) => {
    const newFeatures = [...features];
    newFeatures[index] = val;
    setFeatures(newFeatures);
  };

  const supabase = createClient();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const data = await getAllBooksAdmin();
    setBooks(data);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFormat('BOTH');
    setPriceDigital('');
    setPricePhysical('');
    setOriginalPrice('');
    setFeatures(['نسخة عالية الجودة']);
    setIsPublished(false);
    setCoverFile(null);
    setPdfFile(null);
    setPdfLink('');
    setEditingBook(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (book: any) => {
    resetForm();
    setEditingBook(book);
    setTitle(book.title);
    setDescription(book.description || '');
    setFormat(book.format || 'BOTH');
    setPriceDigital(book.price_digital || '');
    setPricePhysical(book.price_physical || '');
    setOriginalPrice(book.original_price?.toString() || '');
    setFeatures(book.features && book.features.length > 0 ? book.features : ['نسخة عالية الجودة']);
    setIsPublished(book.is_published);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من مسح هذا الكتاب نهائياً؟")) return;
    
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (!error) {
      setBooks(books.filter(b => b.id !== id));
    } else {
      alert("حدث خطأ أثناء المسح");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = editingBook?.image_url;
      let pdfUrl = editingBook?.pdf_file_url;
      
      if (pdfLink && pdfLink.trim() !== '') {
        pdfUrl = pdfLink.trim();
      }

      // 1. Upload Cover
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `cover_${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('books').upload(fileName, coverFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // 2. Upload PDF (if DIGITAL/BOTH and a file is selected)
      if (pdfFile && (format === 'DIGITAL' || format === 'BOTH')) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `pdf_${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('books').upload(fileName, pdfFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(fileName);
        pdfUrl = publicUrl;
      }

      const bookData = {
        title,
        description,
        format,
        price_digital: (format === 'DIGITAL' || format === 'BOTH') ? parseFloat(priceDigital) : null,
        price_physical: (format === 'PHYSICAL' || format === 'BOTH') ? parseFloat(pricePhysical) : null,
        original_price: parseFloat(originalPrice) || null,
        features: features.filter(f => f.trim() !== ''),
        is_published: isPublished,
        image_url: imageUrl,
        pdf_file_url: pdfUrl
      };

      if (editingBook) {
        const { error } = await supabase.from('books').update(bookData).eq('id', editingBook.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert(bookData);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    }
    
    setIsSubmitting(false);
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">إدارة الكتب (Bookstore)</h1>
          <p className="text-on-surface-variant text-sm">إضافة وتعديل الكتب بنوعيها (الإلكترونية PDF والمطبوعة) وعرضها في المتجر.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للوحة التحكم
          </Link>
          <button onClick={openAddModal} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <span className="material-symbols-outlined text-sm">add</span>
            إضافة كتاب جديد
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">menu_book</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">لا توجد كتب حالياً</h2>
          <p className="text-on-surface-variant mb-6">قم بإضافة كتابك الأول لكي يظهر للطلاب في المتجر.</p>
          <button onClick={openAddModal} className="px-6 py-3 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-all">إضافة كتاب الآن</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="glass-card rounded-xl overflow-hidden border border-white/5 flex flex-col relative group">
              <div className="h-48 overflow-hidden bg-surface-container-highest relative">
                {book.image_url ? (
                  <img src={book.image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">book</span>
                  </div>
                )}
                
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded shadow-md backdrop-blur-md ${book.is_published ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-surface-container-highest/80 text-on-surface-variant border border-white/10'}`}>
                    {book.is_published ? 'منشور' : 'مسودة'}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold rounded shadow-md backdrop-blur-md bg-primary-container/80 text-primary-container-on border border-primary/20">
                    {book.format === 'BOTH' ? 'مطبوع و PDF' : book.format === 'DIGITAL' ? 'PDF فقط' : 'مطبوع فقط'}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-on-surface mb-2 line-clamp-1">{book.title}</h3>
                
                <div className="flex flex-col gap-1 mb-4 mt-auto">
                  {(book.format === 'DIGITAL' || book.format === 'BOTH') && (
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">نسخة الـ PDF:</span>
                      <span className="font-code-sm font-bold text-primary">{book.price_digital} EGP</span>
                    </div>
                  )}
                  {(book.format === 'PHYSICAL' || book.format === 'BOTH') && (
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">النسخة المطبوعة:</span>
                      <span className="font-code-sm font-bold text-primary">{book.price_physical} EGP</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button onClick={() => openEditModal(book)} className="flex-1 py-2 bg-surface-container-high text-on-surface hover:bg-white/10 rounded-lg text-sm font-bold transition-colors">
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(book.id)} className="p-2 bg-error/10 text-error hover:bg-error hover:text-white rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-headline-md text-xl text-on-surface">
                {editingBook ? 'تعديل بيانات الكتاب' : 'إضافة كتاب جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              <form id="bookForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">اسم الكتاب</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">وصف الكتاب (تفاصيل المحتوى)</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"></textarea>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-surface-container-highest/50">
                  <label className="block text-sm font-bold text-on-surface mb-3">الصيغ المتاحة للبيع</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="format" checked={format === 'BOTH'} onChange={() => setFormat('BOTH')} />
                      <span className="text-sm">مطبوع وإلكتروني (PDF)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="format" checked={format === 'DIGITAL'} onChange={() => setFormat('DIGITAL')} />
                      <span className="text-sm">إلكتروني فقط (PDF)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="format" checked={format === 'PHYSICAL'} onChange={() => setFormat('PHYSICAL')} />
                      <span className="text-sm">مطبوع فقط</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(format === 'DIGITAL' || format === 'BOTH') && (
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2">سعر نسخة الـ PDF (EGP)</label>
                      <input type="number" required value={priceDigital} onChange={e => setPriceDigital(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none font-code-sm text-primary" />
                    </div>
                  )}
                  {(format === 'PHYSICAL' || format === 'BOTH') && (
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2">سعر النسخة المطبوعة (EGP)</label>
                      <input type="number" required value={pricePhysical} onChange={e => setPricePhysical(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none font-code-sm text-primary" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">السعر قبل الخصم (اختياري)</label>
                    <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none font-code-sm line-through text-on-surface-variant" placeholder="السعر الأصلي" />
                  </div>
                </div>

                {/* Features Section */}
                <div className="p-4 rounded-xl border border-white/5 bg-surface-container-highest/30">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-on-surface">مميزات الكتاب (تظهر للطالب)</label>
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
                          placeholder="مثال: يغطي جميع أساسيات البرمجة" 
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">صورة الغلاف (Image)</label>
                    <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    {editingBook?.image_url && !coverFile && <p className="text-xs text-secondary mt-2">تم رفع صورة مسبقاً</p>}
                  </div>
                  
                  {(format === 'DIGITAL' || format === 'BOTH') && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-on-surface-variant mb-2">رفع ملف الكتاب (PDF)</label>
                        <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-grow"></div>
                        <span className="text-xs text-on-surface-variant font-bold">أو</span>
                        <div className="h-px bg-white/10 flex-grow"></div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-on-surface-variant mb-2">رابط خارجي (Google Drive الخ)</label>
                        <input type="url" value={pdfLink} onChange={e => setPdfLink(e.target.value)} placeholder="https://..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none text-on-surface" dir="ltr" />
                      </div>
                      {editingBook?.pdf_file_url && !pdfFile && !pdfLink && <p className="text-xs text-secondary mt-2">تم ربط ملف مسبقاً</p>}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-5 h-5 accent-primary" />
                  <div>
                    <div className="font-bold text-on-surface text-sm">نشر الكتاب في المتجر</div>
                    <div className="text-xs text-on-surface-variant">عند تفعيل هذا الخيار، سيتمكن الطلاب من رؤية الكتاب وشرائه.</div>
                  </div>
                </label>

              </form>
            </div>

            <div className="p-6 border-t border-white/5 bg-surface-container-low shrink-0 flex gap-3">
              <button 
                type="submit" 
                form="bookForm"
                disabled={isSubmitting}
                className="flex-1 bg-primary text-on-primary-container py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)] disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحفظ والرفع...' : 'حفظ الكتاب'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </main>
  );
}
