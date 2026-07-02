"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useCart } from "@/app/context/CartContext";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Shipping details for physical books
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const hasPhysicalItems = items.some(item => item.type === 'BOOK' && item.format === 'PHYSICAL');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        setUser(userData);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      alert("يجب تسجيل الدخول لإتمام عملية الشراء.");
      router.push('/login');
      return;
    }

    if (hasPhysicalItems && (!shippingAddress || !contactPhone)) {
      alert("يرجى ملء بيانات عنوان التوصيل ورقم الهاتف للنسخ المطبوعة.");
      return;
    }

    // Refresh user balance to ensure they still have enough
    const { data: latestUser } = await supabase.from('users').select('balance').eq('id', user.id).single();
    if (!latestUser || Number(latestUser.balance) < totalPrice) {
      alert("رصيد المحفظة الحالي غير كافٍ لإتمام عملية الشراء. الرجاء شحن الرصيد.");
      router.push('/wallet');
      return;
    }

    if (!confirm(`سيتم خصم ${totalPrice} EGP من محفظتك. هل أنت متأكد؟`)) return;

    setIsProcessing(true);

    try {
      // 1. Deduct Balance securely via RPC
      const { data: deductionSuccess, error: balanceErr } = await supabase.rpc('deduct_user_balance', { 
        deduction_amount: totalPrice 
      });
        
      if (balanceErr) throw balanceErr;
      if (!deductionSuccess) {
        alert("فشلت عملية الخصم: تأكد من أن رصيدك كافٍ.");
        setIsProcessing(false);
        return;
      }

      // 2. Process Items
      for (const item of items) {
        if (item.type === 'COURSE') {
          // Check if already enrolled to avoid uniqueness errors
          const { data: existing } = await supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', item.id).single();
          if (!existing) {
            const { error: enrollErr } = await supabase.from('enrollments').insert({
              user_id: user.id,
              course_id: item.id
            });
            if (enrollErr) {
              console.error("Enrollment insert error:", enrollErr);
              throw new Error("فشل تسجيل الكورس: " + enrollErr.message);
            }
          }
        } else if (item.type === 'BOOK') {
          await supabase.from('book_orders').insert({
            user_id: user.id,
            book_id: item.id,
            format: item.format,
            price_paid: item.price * (item.quantity || 1),
            quantity: item.quantity || 1,
            shipping_address: item.format === 'PHYSICAL' ? shippingAddress : null,
            phone: item.format === 'PHYSICAL' ? contactPhone : null
          });
        }
      }

      // Success
      clearCart();
      setSuccess(true);
      
    } catch (err: any) {
      alert("حدث خطأ أثناء إتمام الطلب. يرجى التواصل مع الدعم الفني: " + err.message);
    }
    
    setIsProcessing(false);
  };

  if (success) {
    return (
      <main className="pt-32 pb-16 px-container-margin w-full max-w-3xl mx-auto min-h-screen text-center flex flex-col items-center justify-center">
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center border border-white/5 shadow-[0_0_50px_rgba(121,255,91,0.1)]">
          <span className="material-symbols-outlined text-7xl text-secondary mb-6">task_alt</span>
          <h1 className="font-headline-md text-3xl text-on-surface mb-2">تم الشراء بنجاح!</h1>
          <p className="text-on-surface-variant mb-8 text-lg">
            تمت إضافة الكورسات والكتب إلى حسابك. نتمنى لك رحلة تعليمية موفقة.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="bg-primary text-on-primary-container px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)]">
              الذهاب للوحة التحكم
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pt-32 pb-16 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      <div className="mb-12">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2 flex items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary">shopping_cart</span>
          عربة التسوق
        </h1>
        <p className="text-on-surface-variant text-lg">مراجعة المشتريات وإتمام الدفع باستخدام المحفظة.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">remove_shopping_cart</span>
          <h2 className="text-xl font-bold text-on-surface mb-4">السلة فارغة</h2>
          <div className="flex justify-center gap-4">
            <Link href="/courses" className="px-6 py-3 bg-surface-container-high rounded-xl hover:bg-white/10 transition-colors font-bold text-primary">تصفح الكورسات</Link>
            <Link href="/store" className="px-6 py-3 bg-surface-container-high rounded-xl hover:bg-white/10 transition-colors font-bold text-secondary">تصفح المكتبة</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="font-headline-md text-xl text-on-surface mb-6 border-b border-white/5 pb-4">العناصر ({items.length})</h2>
              
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-surface-container-low items-center">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 flex items-center justify-center border border-white/10">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">
                          {item.type === 'COURSE' ? 'play_circle' : 'menu_book'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-on-surface">{item.title}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id, item.format)}
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          title="حذف"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'COURSE' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                          {item.type === 'COURSE' ? 'كورس' : item.format === 'PHYSICAL' ? 'كتاب مطبوع' : 'كتاب إلكتروني (PDF)'}
                        </span>
                      </div>
                      
                      {item.type === 'BOOK' && item.format === 'PHYSICAL' && (
                        <div className="flex items-center gap-3 mt-4">
                          <span className="text-xs text-on-surface-variant font-bold">الكمية:</span>
                          <div className="flex items-center bg-surface-container-highest border border-white/10 rounded-lg overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.id, item.format!, (item.quantity || 1) + 1)}
                              className="px-2 py-1 hover:bg-white/10 text-on-surface transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                            <span className="px-3 py-1 text-sm font-bold font-code-sm border-x border-white/10 min-w-[2.5rem] text-center">
                              {item.quantity || 1}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.format!, (item.quantity || 1) - 1)}
                              disabled={(item.quantity || 1) <= 1}
                              className="px-2 py-1 hover:bg-white/10 text-on-surface transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="font-code-sm font-bold text-xl text-on-surface text-left min-w-[80px]">
                      {item.price * (item.quantity || 1)} <span className="text-sm font-normal text-on-surface-variant">EGP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Form (Only if Physical Book is in cart) */}
            {hasPhysicalItems && (
              <div className="glass-card rounded-2xl p-6 border border-secondary/30 bg-secondary/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
                <h2 className="font-headline-md text-xl text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">local_shipping</span>
                  بيانات الشحن
                </h2>
                <p className="text-sm text-on-surface-variant mb-6">يوجد نسخة مطبوعة في السلة، يرجى ملء بيانات التوصيل.</p>
                
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">عنوان التوصيل بالتفصيل</label>
                    <textarea 
                      className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 text-sm focus:border-secondary focus:outline-none resize-none h-24"
                      placeholder="المحافظة، المركز/المدينة، الشارع، العمارة، رقم الشقة..."
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">رقم هاتف للتواصل مع المندوب</label>
                    <input 
                      type="text" 
                      className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 text-sm focus:border-secondary focus:outline-none font-code-sm"
                      placeholder="01xxxxxxxxx"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-4">
            <div className="glass-card rounded-2xl p-6 border border-white/5 sticky top-28">
              <h2 className="font-headline-md text-xl text-on-surface mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6 border-b border-white/5 pb-6">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>المجموع</span>
                  <span className="font-code-sm">{totalPrice} EGP</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>مصاريف الشحن</span>
                  <span className="font-code-sm text-secondary">مجاناً</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <span className="font-bold text-on-surface">الإجمالي المطلوب</span>
                <span className="font-code-sm text-3xl font-bold text-primary">{totalPrice} EGP</span>
              </div>

              {!user ? (
                <div className="text-center">
                  <p className="text-sm text-error mb-4 bg-error/10 p-3 rounded-lg">يجب تسجيل الدخول لإتمام عملية الشراء</p>
                  <Link href="/login" className="flex items-center justify-center w-full py-4 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-all">
                    تسجيل الدخول
                  </Link>
                </div>
              ) : Number(user?.balance) < totalPrice ? (
                <div className="text-center">
                  <p className="text-sm text-error mb-4 bg-error/10 p-3 rounded-lg flex items-start gap-2 text-right">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>رصيد المحفظة ({user.balance} EGP) لا يكفي لإتمام الطلب. يرجى شحن الرصيد.</span>
                  </p>
                  <Link href="/wallet" className="flex items-center justify-center w-full py-4 rounded-xl border border-error text-error font-bold hover:bg-error/5 transition-all gap-2">
                    <span className="material-symbols-outlined">add_circle</span>
                    شحن المحفظة
                  </Link>
                </div>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-primary-container text-on-primary-container font-bold shadow-[0_0_20px_rgba(0,210,255,0.2)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-5 h-5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></span>
                      جاري الدفع...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">payments</span>
                      دفع وتأكيد الطلب
                    </>
                  )}
                </button>
              )}

              {user && (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                  <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
                  رصيد المحفظة المتاح: <span className="font-code-sm font-bold text-on-surface">{user.balance} EGP</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </main>
  );
}
