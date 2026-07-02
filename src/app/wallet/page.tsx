"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function WalletPage() {
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Real data state
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Recharge state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // Get Balance
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(userData);
      
      // Get History (Wallet Requests)
      try {
        const { data: requests } = await supabase
          .from('wallet_requests')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (requests) {
          setTransactions(requests);
        }
      } catch (e) {
        // Table might not exist yet
      }

      // Get Payment Methods
      const { data: methodsData } = await supabase.from('site_settings').select('value').eq('key', 'payment_methods').single();
      if (methodsData && methodsData.value && Array.isArray(methodsData.value)) {
        const activeMethods = methodsData.value.filter(m => m.active);
        setPaymentMethods(activeMethods);
        if (activeMethods.length > 0) {
          setPaymentMethod(activeMethods[0].id);
        }
      }
    }
    setLoading(false);
  };

  const selectAmount = (val: number) => {
    setAmount(val);
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!user) {
      setErrorMsg("يجب تسجيل الدخول أولاً");
      return;
    }
    if (!amount || amount < 10) {
      setErrorMsg("الرجاء تحديد مبلغ صحيح (أدنى مبلغ 10 جنيه)");
      return;
    }
    if (!receiptFile) {
      setErrorMsg("الرجاء إرفاق صورة الإيصال لإثبات التحويل أولاً قبل الإرسال");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload Receipt
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      const selectedMethodObj = paymentMethods.find(m => m.id === paymentMethod);
      const methodName = selectedMethodObj ? selectedMethodObj.name : paymentMethod;

      // Create Request
      const { error: requestError } = await supabase.from('wallet_requests').insert({
        user_id: user.id,
        amount: Number(amount),
        payment_method: methodName,
        receipt_image_url: publicUrl,
        status: 'PENDING'
      });

      if (requestError) throw requestError;

      setSuccess(true);
      setAmount("");
      setReceiptFile(null);
      fetchWalletData(); // Refresh history
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg("حدث خطأ أثناء إرسال الطلب: " + err.message);
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <main className="flex-grow pt-32 pb-16 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-grow pt-32 pb-16 min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-12 rounded-2xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">account_balance_wallet</span>
          <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول أولاً</h2>
          <Link href="/login" className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold">تسجيل الدخول</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow pt-32 pb-16 px-container-margin w-full max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
      {/* Balance Hero Card */}
      <section className="mb-12 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-white/5 relative overflow-hidden bg-[#0A0D14]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-on-surface-variant font-bold text-sm">رصيد المحفظة</span>
            <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
          </div>
          
          <div className="flex items-baseline justify-center gap-2 mb-8" dir="ltr">
            <h1 className="font-display-lg text-5xl md:text-6xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {user.balance}
            </h1>
            <span className="text-on-surface-variant text-sm font-bold">جنيه</span>
          </div>

          <button 
            onClick={() => document.getElementById('recharge-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full bg-[#1DE9B6] text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            شحن الرصيد
            <span className="material-symbols-outlined text-xl">add_circle</span>
          </button>
        </div>
      </section>

      <div id="recharge-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Top-up Controls */}
        <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          
          <form onSubmit={handleRecharge} className="space-y-8" noValidate>
            {/* Select Amount Section */}
            <div className="glass-card p-8 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>add_card</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">اختر قيمة الشحن</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[50, 100, 200, 500].map((val) => (
                  <button 
                    key={val}
                    type="button"
                    className={`p-4 rounded-lg bg-surface-container-low transition-all text-center group active:scale-95 ${
                      amount === val 
                        ? "border border-primary/50 shadow-[0_0_15px_rgba(0,210,255,0.2)] bg-primary/10" 
                        : "border border-white/10 hover:bg-surface-container-high hover:border-white/20"
                    }`}
                    onClick={() => selectAmount(val)}
                  >
                    <span className={`font-code-sm text-code-sm block mb-1 transition-colors ${amount === val ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}>EGP</span>
                    <span className="font-display-lg text-display-lg-mobile text-on-surface">{val}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant block">أو أدخل مبلغاً مخصصاً</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-[#05070a] border-b border-white/10 focus:border-b-primary focus:outline-none focus:ring-0 text-display-lg-mobile font-code-sm p-4 transition-all pr-12 text-primary" 
                    placeholder="0" 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-code-sm text-on-surface-variant">EGP</span>
                </div>
              </div>
            </div>

            {/* Payment Grid Section */}
            <div className="glass-card p-8 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">طريقة الدفع والإيصال</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {paymentMethods.length === 0 ? (
                   <div className="col-span-full text-center p-4 text-on-surface-variant bg-surface-container-low rounded-xl">لا توجد طرق دفع مفعلة حالياً.</div>
                ) : (
                  paymentMethods.map(method => (
                    <label key={method.id} className="relative cursor-pointer group">
                      <input className="peer sr-only" name="payment" type="radio" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)}/>
                      <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-white/10 bg-surface-container-low transition-all peer-checked:border-primary peer-checked:bg-primary/10 hover:bg-white/5 h-full text-center">
                        <div className={paymentMethod === method.id ? 'text-primary' : 'text-on-surface-variant'}>
                          {method.type === 'image' ? (
                            <img src={method.icon} alt={method.name} className="h-16 object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-6xl" style={{ color: method.color || 'inherit' }}>{method.icon}</span>
                          )}
                        </div>
                        <span className="font-body-base text-sm font-bold text-on-surface">{method.name}</span>
                        {method.desc && (
                          <span className="text-xs text-on-surface-variant font-code-sm" dir="ltr">{method.desc}</span>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Receipt Upload */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-on-surface mb-2">إرفاق صورة الإيصال (إجباري)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-on-surface-variant file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 border border-white/5 p-2 rounded-xl bg-surface-container-lowest"
                />
                <p className="text-xs text-on-surface-variant mt-2">يجب أن تكون الصورة واضحة وتحتوي على رقم العملية والمبلغ.</p>
              </div>

              {errorMsg && (
                <div className="mb-4 bg-error/10 border border-error/30 text-error p-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <span className="material-symbols-outlined text-base">error</span>
                  {errorMsg}
                </div>
              )}

              {success ? (
                <div className="w-full bg-secondary/20 text-secondary border border-secondary/30 font-headline-md py-4 rounded-lg flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>تم إرسال الطلب وسوف يتم مراجعته قريباً!</span>
                </div>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-container text-on-primary-container font-headline-md py-4 rounded-lg flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,210,255,0.2)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-6 h-6 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>إرسال طلب الشحن</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Right: Transaction History */}
        <div className="lg:col-span-5 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
          <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col border border-white/5">
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-headline-md text-headline-md text-on-surface">سجل طلبات الشحن</h2>
                <span className="material-symbols-outlined text-on-surface-variant">history</span>
              </div>
              <p className="font-body-base text-body-base text-on-surface-variant">آخر 10 طلبات شحن للمحفظة</p>
            </div>
            
            <div className="flex-grow overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                  <p>لا توجد معاملات سابقة</p>
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-surface-container-high/50 border-b border-white/5">
                      <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">التاريخ</th>
                      <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">المبلغ</th>
                      <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-base divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-code-sm text-code-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="p-4 text-on-surface font-bold font-code-sm">
                          {tx.amount} EGP
                        </td>
                        <td className="p-4">
                          {tx.status === 'APPROVED' ? (
                            <span className="flex items-center gap-1 text-secondary text-sm font-bold bg-secondary/10 px-2 py-1 rounded w-max">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              مقبول
                            </span>
                          ) : tx.status === 'REJECTED' ? (
                            <span className="flex items-center gap-1 text-error text-sm font-bold bg-error/10 px-2 py-1 rounded w-max">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              مرفوض
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-tertiary text-sm font-bold bg-tertiary/10 px-2 py-1 rounded w-max">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              قيد المراجعة
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
