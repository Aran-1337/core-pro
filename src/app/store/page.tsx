"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { getPublishedBooks } from "@/services/storeService";
import { Book } from "@/types";

export default function StorePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Book specific purchase state
  const [bookFormat, setBookFormat] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  
  const { addToCart, items } = useCart();

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    setLoading(true);
    const data = await getPublishedBooks();
    setBooks(data);
    setLoading(false);
  };

  const getPriceToPay = () => {
    return bookFormat === 'PHYSICAL' ? selectedProduct?.price_physical : selectedProduct?.price_digital;
  };

  const isBookInCart = (id: string, format: string) => {
    return items.some(item => item.id === id && item.type === 'BOOK' && item.format === format);
  };

  const handleAddToCart = () => {
    addToCart({
      id: selectedProduct.id,
      title: selectedProduct.title,
      price: getPriceToPay(),
      type: 'BOOK',
      format: bookFormat,
      image_url: selectedProduct.image_url
    });
    setSelectedProduct(null); // Close modal
  };

  return (
    <>
      <main className="pt-32 pb-16 px-container-margin max-w-7xl mx-auto min-h-screen">
        <section className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">متجر الكتب والمراجع</h1>
            <p className="text-on-surface-variant max-w-2xl leading-relaxed">
              اكتشف أفضل المراجع والكتب المصممة خصيصاً لطلاب البرمجة والذكاء الاصطناعي. متوفرة بنسخ مطبوعة وإلكترونية.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-white/5">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">menu_book</span>
            <h2 className="text-xl font-bold text-on-surface mb-2">المتجر فارغ حالياً</h2>
            <p className="text-on-surface-variant">لم يتم نشر أي كتب بعد.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {books.map(book => (
              <div 
                key={book.id} 
                className="glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer group hover:border-secondary/30 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,107,255,0.1)] transition-all duration-300"
                onClick={() => {
                  setSelectedProduct(book);
                  setBookFormat(book.format === 'PHYSICAL' ? 'PHYSICAL' : 'DIGITAL');
                }}
              >
                <div className="relative h-64 overflow-hidden bg-surface-container-highest">
                  {book.image_url ? (
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={book.title} 
                      src={book.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">book</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded backdrop-blur-md border font-code-sm text-code-sm z-10 bg-secondary-container/20 border-secondary/30 text-secondary">
                    كتاب
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-headline-md text-on-surface mb-2 group-hover:text-secondary transition-colors">{book.title}</h3>
                  <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{book.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      {book.original_price && book.original_price > (book.format === 'PHYSICAL' ? book.price_physical : book.price_digital) && (
                        <span className="font-code-sm text-xs text-on-surface-variant line-through mb-1">{book.original_price} EGP</span>
                      )}
                      <span className="font-code-sm text-lg font-bold text-secondary">
                        يبدأ من {book.format === 'PHYSICAL' ? book.price_physical : book.price_digital} EGP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setSelectedProduct(null)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-full md:w-[500px] bg-surface-container-low border-r border-white/10 shadow-2xl p-8 flex flex-col animate-in slide-in-from-left duration-300 z-10 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-on-surface-variant transition-colors" 
                onClick={() => setSelectedProduct(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <span className="px-3 py-1 rounded font-code-sm text-code-sm border bg-secondary/10 border-secondary/20 text-secondary">
                كتاب
              </span>
            </div>
            
            <div className="aspect-video rounded-2xl overflow-hidden mb-8 border border-white/5 bg-surface-container-highest">
              {selectedProduct.image_url ? (
                <img className="w-full h-full object-cover" alt={selectedProduct.title} src={selectedProduct.image_url} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">book</span>
                </div>
              )}
            </div>
            
            <h2 className="font-display-lg text-display-lg-mobile text-on-surface mb-4 leading-tight">{selectedProduct.title}</h2>
            
            <div className="mb-8">
              <h4 className="text-on-surface-variant font-bold text-sm mb-2">الوصف</h4>
              <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {selectedProduct.description}
              </p>
            </div>

            {selectedProduct.features && selectedProduct.features.length > 0 && (
              <div className="mb-8">
                <h4 className="text-on-surface-variant font-bold text-sm mb-3">مميزات الكتاب</h4>
                <ul className="space-y-3">
                  {selectedProduct.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-on-surface">
                      <span className="material-symbols-outlined text-secondary shrink-0 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-body-base leading-relaxed text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Purchase Options */}
            <div className="mb-8 p-4 border border-white/10 rounded-xl bg-surface-container-highest">
              <h4 className="font-bold text-sm text-on-surface mb-4">اختر صيغة الكتاب</h4>
              
              <div className="space-y-3">
                {(selectedProduct.format === 'DIGITAL' || selectedProduct.format === 'BOTH') && (
                  <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${bookFormat === 'DIGITAL' ? 'border-secondary bg-secondary/10' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="format" checked={bookFormat === 'DIGITAL'} onChange={() => setBookFormat('DIGITAL')} className="sr-only" />
                      <span className="material-symbols-outlined text-on-surface-variant">picture_as_pdf</span>
                      <span className="text-sm font-bold text-on-surface">نسخة إلكترونية (PDF)</span>
                    </div>
                    <span className="font-code-sm text-secondary font-bold">{selectedProduct.price_digital} EGP</span>
                  </label>
                )}
                
                {(selectedProduct.format === 'PHYSICAL' || selectedProduct.format === 'BOTH') && (
                  <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${bookFormat === 'PHYSICAL' ? 'border-secondary bg-secondary/10' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="format" checked={bookFormat === 'PHYSICAL'} onChange={() => setBookFormat('PHYSICAL')} className="sr-only" />
                      <span className="material-symbols-outlined text-on-surface-variant">local_shipping</span>
                      <span className="text-sm font-bold text-on-surface">نسخة مطبوعة (توصيل)</span>
                    </div>
                    <span className="font-code-sm text-secondary font-bold">{selectedProduct.price_physical} EGP</span>
                  </label>
                )}
              </div>
            </div>
            
            <div className="mt-auto border-t border-white/10 pt-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-on-surface-variant">السعر</span>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-3">
                    {selectedProduct.original_price && selectedProduct.original_price > getPriceToPay() && (
                      <div className="flex items-center gap-2 bg-error/10 px-2 py-1 rounded-lg">
                        <span className="font-code-sm text-sm text-error line-through opacity-70">{selectedProduct.original_price}</span>
                        <span className="font-bold text-xs text-error">وفر {Math.round(((selectedProduct.original_price - getPriceToPay()) / selectedProduct.original_price) * 100)}%</span>
                      </div>
                    )}
                    <span className="font-code-sm text-3xl font-bold text-secondary">{getPriceToPay()} EGP</span>
                  </div>
                </div>
              </div>
              
              {isBookInCart(selectedProduct.id, bookFormat) ? (
                <Link href="/cart" className="w-full py-4 rounded-xl border border-secondary text-secondary bg-secondary/10 font-bold transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">check_circle</span>
                  موجود في السلة - اذهب للسلة
                </Link>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-xl bg-secondary text-on-secondary font-bold shadow-lg shadow-secondary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                  أضف إلى السلة
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
