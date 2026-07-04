"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { createClient } from "@/utils/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const supabase = createClient();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      router.push('/login');
      return;
    }
    const { data: userProfile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    if (userProfile) {
      setUser(userProfile);
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!user) return;
    
    // Check if balance is sufficient (assuming no physical shipping costs for now, or just basic deduction)
    if (user.balance < totalPrice) {
      setErrorMsg("رصيدك الحالي لا يكفي لإتمام عملية الشراء. يرجى شحن المحفظة أولاً.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");
    
    try {
      // 1. Deduct balance
      const newBalance = user.balance - totalPrice;
      const { error: balanceError } = await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      
      if (balanceError) throw new Error("فشل في تحديث الرصيد");

      // 2. Add Enrollments (for courses)
      const courseItems = items.filter(i => i.type === 'COURSE');
      if (courseItems.length > 0) {
        for (const course of courseItems) {
          // Check if already enrolled
          const { data: existingRecords } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course.id)
            .limit(1);
            
          const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

          if (!existing) {
            // Insert new lifetime enrollment
            const { error: insertError } = await supabase
              .from('enrollments')
              .insert({
                user_id: user.id,
                course_id: course.id
              });
            if (insertError) throw new Error("فشل في الاشتراك في الكورس: " + insertError.message);
          }
        }
      }

      // 3. Add Book Orders (for books/materials)
      const bookItems = items.filter(i => i.type === 'BOOK');
      if (bookItems.length > 0) {
        const bookOrdersToInsert = bookItems.map(book => ({
          user_id: user.id,
          book_id: book.id,
          format: book.format || 'DIGITAL',
          amount: book.price,
          status: book.format === 'PHYSICAL' ? 'PENDING' : 'COMPLETED'
        }));
        
        const { error: bookError } = await supabase.from('book_orders').insert(bookOrdersToInsert);
        if (bookError) throw new Error("فشل في إضافة طلبات الكتب");
      }
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ أثناء الدفع");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0 && !isSuccess) {
    return (
      <main className="pt-32 pb-20 px-container-margin max-w-5xl mx-auto min-h-[calc(100vh-80px)] text-center">
        <h2 className="text-2xl font-bold mb-4 text-on-surface">السلة فارغة</h2>
        <Link href="/courses" className="text-primary hover:underline">تصفح الكورسات</Link>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-20 px-container-margin max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
      
      {!isSuccess ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter animate-in fade-in duration-500">
          
          {/* Left Side: Order Summary & Details */}
          <div className="lg:col-span-7 space-y-gutter">
            <div className="glass-card rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">shopping_cart</span>
                <h2 className="font-headline-md text-headline-md">ملخص الطلب</h2>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10 overflow-hidden">
                        {item.image_url ? (
                          <img className="w-full h-full object-cover" alt={item.title} src={item.image_url}/>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">image</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface line-clamp-1 max-w-[200px] md:max-w-full">{item.title}</h3>
                        <p className="text-sm text-on-surface-variant font-label-caps">
                          {item.type === 'COURSE' ? 'كورس' : `كتاب - ${item.format === 'DIGITAL' ? 'إلكتروني' : 'مطبوع'}`}
                          {item.quantity && item.quantity > 1 ? ` (العدد: ${item.quantity})` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-code-sm text-primary">{item.price * (item.quantity || 1)} EGP</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-on-surface-variant">
                  <span>المجموع الفرعي</span>
                  <span className="font-code-sm">{totalPrice} EGP</span>
                </div>
                <div className="flex justify-between text-primary text-xl font-bold pt-2">
                  <span>الإجمالي الكلي</span>
                  <span className="font-code-sm">{totalPrice} EGP</span>
                </div>
              </div>
            </div>

            {/* Trusted Badge */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-secondary/20 bg-secondary/5">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <p className="text-sm text-on-surface-variant">جميع المعاملات المالية مشفرة وآمنة تماماً وفقاً للمعايير الدولية.</p>
            </div>
          </div>

          {/* Right Side: Wallet & Payment */}
          <div className="lg:col-span-5 space-y-gutter">
            <div className="glass-card rounded-xl p-6 md:p-8 border border-primary/30 shadow-[0_0_15px_rgba(0,210,255,0.1)]">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                <h2 className="font-headline-md text-headline-md">تأكيد الدفع</h2>
              </div>
              
              <div className="space-y-6">
                {/* Wallet Status */}
                <div className="p-6 rounded-xl bg-surface-container-lowest border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">الرصيد المتاح</span>
                    <span className="font-code-sm text-secondary text-lg">{user?.balance || 0} EGP</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full shadow-[0_0_10px_#79ff5b]" style={{ width: `${Math.min(100, ((user?.balance || 0) / (totalPrice || 1)) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">تكلفة الطلب</span>
                    <span className="font-code-sm text-error">{totalPrice} EGP</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-on-surface">الرصيد بعد الدفع</span>
                    <span className={`font-code-sm font-bold ${user?.balance < totalPrice ? 'text-error' : 'text-primary'}`}>
                      {(user?.balance || 0) - totalPrice} EGP
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20 text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errorMsg}
                  </div>
                )}

                {/* Action Button */}
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-primary-container text-on-primary-container font-bold py-5 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      <span className="font-headline-md">جاري معالجة الطلب...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                      <span className="font-headline-md">تأكيد الدفع الآن</span>
                    </>
                  )}
                </button>
                
                <p className="text-center text-xs text-on-surface-variant px-4">
                  بالنقر على تأكيد الدفع، فإنك توافق على <a className="text-primary underline" href="#">شروط الخدمة</a> و <a className="text-primary underline" href="#">سياسة الاسترجاع</a>.
                </p>
              </div>
            </div>

            {/* Crypto/Dev Branding Element */}
            <div className="p-6 glass-card rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="grid grid-cols-6 gap-2 p-2">
                  <div className="h-1 bg-primary w-full"></div>
                  <div className="h-1 bg-primary w-full"></div>
                  <div className="h-1 bg-primary w-full"></div>
                  <div className="h-1 bg-primary w-full"></div>
                  <div className="h-1 bg-primary w-full"></div>
                  <div className="h-1 bg-primary w-full"></div>
                </div>
              </div>
              <div className="relative z-10">
                <span className="font-label-caps text-primary text-[10px] block mb-2 tracking-widest">ENCRYPTION ENGINE</span>
                <div className="font-code-sm text-on-surface-variant text-[12px] opacity-60">
                  SECURE_HANDSHAKE: ACTIVE<br/>
                  PROTOCOL: TLS_1.3_V2<br/>
                  HASH: SHA-512_SECURE
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Success View */
        <div className="max-w-2xl mx-auto text-center space-y-8 py-10 animate-in zoom-in duration-500">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-secondary opacity-20 blur-3xl rounded-full"></div>
            <span className="material-symbols-outlined text-[120px] text-secondary relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-display-lg text-display-lg-mobile text-primary">تمت العملية بنجاح!</h1>
            <p className="text-on-surface-variant text-xl">لقد تم خصم المبلغ بنجاح وإضافة الكورسات إلى حسابك.</p>
          </div>
          
          <div className="glass-card rounded-2xl p-8 border-secondary/30 text-right space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-on-surface-variant font-label-caps">RECEIPT #{Math.floor(Math.random() * 100000)}</span>
              <span className="text-on-surface-variant font-label-caps">{new Date().toLocaleDateString('ar-EG')}</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-white/5 text-secondary">
                <span>تم الدفع بنجاح</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="bg-primary-container text-on-primary-container font-bold px-10 py-4 rounded-xl hover:shadow-[0_0_15px_rgba(0,210,255,0.3)] transition-all">
              الذهاب إلى لوحة التحكم
            </Link>
            <button className="border border-white/20 hover:bg-white/5 text-on-surface font-bold px-10 py-4 rounded-xl transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">download</span>
              تحميل الفاتورة
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
