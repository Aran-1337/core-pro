"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'wallet' | 'books' | 'courses'>('wallet');
  
  const [walletRequests, setWalletRequests] = useState<any[]>([]);
  const [bookOrders, setBookOrders] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recentLog, setRecentLog] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [renewalErrorMsg, setRenewalErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Pending Wallet Requests
    const { data: walletData } = await supabase
      .from('wallet_requests')
      .select('*, users(full_name, phone, balance)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (walletData) setWalletRequests(walletData);

    try {
      const { data: bData, error: bError } = await supabase
        .from('book_orders')
        .select('*, users(full_name, email, phone), books(title, price_digital, price_physical)')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      if (bError) console.error('Book Orders Error:', bError);
      if (bData) setBookOrders(bData);
    } catch (err) {}

    try {
      const { data: eData, error: eError } = await supabase
        .from('enrollments')
        .select('*, users(full_name, email), courses(title, price)')
        .order('created_at', { ascending: false });
      if (eError) console.error('Enrollments Error:', eError);
      if (eData) setEnrollments(eData);
    } catch (err) {}

    // 3. Fetch Recent Log (Approved Wallet + Shipped Books)
    const { data: approvedWallet } = await supabase
      .from('wallet_requests')
      .select('*, users(full_name)')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })
      .limit(5);

    let log: any[] = [];
    if (approvedWallet) {
      approvedWallet.forEach((req: any) => log.push({
        type: 'WALLET',
        id: `w_${req.id}`,
        title: 'شحن محفظة (' + req.payment_method + ')',
        user: req.users?.full_name,
        amount: '+' + req.amount,
        date: req.created_at
      }));
    }
    
    try {
      const { data: shippedBooks } = await supabase
        .from('book_orders')
        .select('*, users(full_name), books(title)')
        .eq('status', 'SHIPPED')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (shippedBooks) {
        shippedBooks.forEach((b: any) => log.push({
          type: 'BOOK',
          id: `b_${b.id}`,
          title: `تم شحن كتاب "${b.books?.title}"`,
          user: b.users?.full_name,
          amount: 'توصيل',
          date: b.created_at
        }));
      }
    } catch (e) {}
    
    log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentLog(log.slice(0, 8));

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Wallet Actions ---
  const handleApproveWallet = async (request: any) => {
    if (!confirm(`هل أنت متأكد من إضافة ${request.amount} EGP لمحفظة الطالب؟`)) return;
    setProcessingId(request.id);
    
    try {
      const newBalance = Number(request.users.balance || 0) + Number(request.amount);
      const { error: balanceErr } = await supabase.from('users').update({ balance: newBalance }).eq('id', request.user_id);
      if (balanceErr) throw balanceErr;

      const { error: reqErr } = await supabase.from('wallet_requests').update({ status: 'APPROVED' }).eq('id', request.id);
      if (reqErr) throw reqErr;

      const { error: notifErr } = await supabase.from('notifications').insert([{
        user_id: request.user_id,
        message: `تم الموافقة على طلب الشحن الخاص بك! تمت إضافة ${request.amount} EGP إلى رصيد محفظتك بنجاح.`
      }]);
      
      fetchData();
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    }
    setProcessingId(null);
  };

  const handleRejectWallet = async (id: string) => {
    if (!confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;
    setProcessingId(id);
    const { error } = await supabase.from('wallet_requests').update({ status: 'REJECTED' }).eq('id', id);
    if (!error) {
      setWalletRequests(walletRequests.filter(r => r.id !== id));
    }
    setProcessingId(null);
  };

  const handleShipBook = async (orderId: string) => {
    if (!confirm("هل تم تسليم الكتاب للمندوب للشحن؟")) return;
    setProcessingId(orderId);
    
    try {
      const { error } = await supabase.from('book_orders').update({ status: 'SHIPPED' }).eq('id', orderId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    }
    setProcessingId(null);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "الآن";
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">إدارة الطلبات والشحن</h1>
          <p className="text-on-surface-variant text-sm">مراجعة طلبات شحن المحفظة، الكتب، واشتراكات الكورسات.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للوحة التحكم
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8">
          
          <div className="flex gap-2 mb-4 bg-surface-container-lowest p-1 rounded-xl border border-white/5 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'wallet' ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg' : 'text-on-surface-variant hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined">account_balance_wallet</span>
              شحن المحفظة
              {walletRequests.length > 0 && <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full">{walletRequests.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('books')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'books' ? 'bg-secondary/20 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              طلبات الكتب المطبوعة ({loading ? '...' : bookOrders.length})
              {bookOrders.filter(o => o.status === 'PENDING').length > 0 && <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>}
            </button>
            <button 
              onClick={() => setActiveTab('courses')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'courses' ? 'bg-tertiary/20 text-tertiary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-sm">school</span>
              مبيعات الكورسات ({loading ? '...' : enrollments.length})
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
            
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-12 text-center text-on-surface-variant">جاري التحميل...</div>
              ) : activeTab === 'wallet' ? (
                // WALLET TAB
                walletRequests.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-2">done_all</span>
                    <div className="text-on-surface-variant font-bold">لا يوجد طلبات شحن محفظة معلقة حالياً.</div>
                  </div>
                ) : (
                  walletRequests.map(req => (
                    <div key={req.id} className="p-6 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {req.users?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface">{req.users?.full_name || 'طالب غير معروف'}</div>
                            <div className="text-xs text-on-surface-variant font-code-sm">رقم الهاتف: {req.users?.phone || 'غير مسجل'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-code-sm text-primary font-bold text-lg">{req.amount} EGP</div>
                          <div className="text-[10px] text-on-surface-variant font-label-caps">{getTimeAgo(req.created_at)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-surface-container-highest rounded-lg p-3 mb-4 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${req.payment_method?.includes('فودافون') || req.payment_method?.toLowerCase().includes('vodafone') ? 'bg-[#E60000]/20 text-[#E60000]' : 'bg-[#6100de]/20 text-[#b6ebff]'}`}>
                            <span className="material-symbols-outlined text-sm">account_balance</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-on-surface">{req.payment_method}</div>
                          </div>
                        </div>
                        
                        {req.receipt_image_url && (
                          <a href={req.receipt_image_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors font-bold">
                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                            عرض الإيصال
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveWallet(req)}
                          disabled={processingId === req.id}
                          className="flex-1 bg-secondary text-on-secondary py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_0_10px_rgba(121,255,91,0.2)] disabled:opacity-50"
                        >
                          {processingId === req.id ? 'جاري التأكيد...' : 'تأكيد وإضافة الرصيد'}
                        </button>
                        <button 
                          onClick={() => handleRejectWallet(req.id)}
                          disabled={processingId === req.id}
                          className="flex-1 bg-surface-container-high text-error border border-error/30 py-2 rounded-lg font-bold text-sm hover:bg-error/10 transition-colors disabled:opacity-50"
                        >
                          رفض الطلب
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : activeTab === 'books' ? (
                // BOOKS TAB
                bookOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-2">inventory_2</span>
                    <div className="text-on-surface-variant font-bold">لا يوجد طلبات توصيل كتب معلقة.</div>
                  </div>
                ) : (
                  bookOrders.map(order => (
                    <div key={order.id} className="p-6 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                            <span className="material-symbols-outlined text-xl">menu_book</span>
                          </div>
                          <div>
                            <div className="font-bold text-on-surface text-secondary">
                              {order.books?.title} 
                              {order.format === 'PHYSICAL' ? ' (نسخة ورقية)' : ' (نسخة رقمية)'}
                            </div>
                            <div className="text-xs text-on-surface-variant mt-1">المشتري: {order.users?.full_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-code-sm text-secondary font-bold">{order.amount || order.price || order.price_paid || order.total_amount || 0} EGP</div>
                          <div className="text-[10px] text-on-surface-variant font-label-caps">{getTimeAgo(order.created_at)}</div>
                        </div>
                      </div>
                      
                      <div className="bg-secondary/5 rounded-lg p-4 mb-4 border border-secondary/20">
                        <div className="flex items-start gap-2 mb-3">
                          <span className="material-symbols-outlined text-secondary text-sm mt-0.5">location_on</span>
                          <div>
                            <div className="text-xs font-bold text-on-surface-variant mb-1">عنوان التوصيل:</div>
                            <div className="text-sm text-on-surface font-bold leading-relaxed">{order.shipping_address || 'لا يوجد'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-sm">call</span>
                          <div className="text-xs font-bold text-on-surface-variant">رقم التواصل:</div>
                          <div className="text-sm font-code-sm font-bold text-on-surface" dir="ltr">{order.phone_number || order.phone || order.users?.phone || 'لا يوجد'}</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleShipBook(order.id)}
                        disabled={processingId === order.id}
                        className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,107,255,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingId === order.id ? (
                          <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">local_shipping</span>
                            تأكيد شحن الكتاب
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )
              ) : activeTab === 'courses' ? (
                enrollments.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-2">school</span>
                    <div className="text-on-surface-variant font-bold">لا توجد مبيعات كورسات حتى الآن.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right whitespace-nowrap">
                      <thead className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-label-caps">الكورس</th>
                          <th className="px-6 py-4 font-label-caps">بيانات الطالب</th>
                          <th className="px-6 py-4 font-label-caps">تاريخ الاشتراك</th>
                          <th className="px-6 py-4 font-label-caps">السعر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {enrollments.map((enrollment) => (
                          <tr key={enrollment.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-center text-tertiary">
                                  <span className="material-symbols-outlined text-xl">play_circle</span>
                                </div>
                                <div className="font-bold text-on-surface text-tertiary">{enrollment.courses?.title || 'كورس محذوف'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-on-surface text-sm">{enrollment.users?.full_name || 'مستخدم محذوف'}</div>
                              <div className="text-xs text-on-surface-variant">{enrollment.users?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant font-code-sm">
                              {new Date(enrollment.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </td>
                            <td className="px-6 py-4 font-code-sm text-secondary font-bold">
                              {enrollment.courses?.price || 0} EGP
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Side: Recent Transactions */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col border border-white/5">
            <div className="p-6 border-b border-white/5 bg-surface-container-low">
              <h2 className="font-bold text-lg flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">history</span>
                أحدث العمليات المؤكدة
              </h2>
            </div>
            <div className="flex-grow p-4 space-y-3">
              
              {loading ? (
                <div className="text-center text-sm text-on-surface-variant p-4">جاري التحميل...</div>
              ) : recentLog.length === 0 ? (
                <div className="text-center text-sm text-on-surface-variant p-4">لا يوجد عمليات مؤكدة سابقة.</div>
              ) : (
                recentLog.map((log) => (
                  <div key={log.id} className="p-3 bg-surface-container-high rounded-lg border border-white/5 flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${log.type === 'BOOK' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                      <span className="material-symbols-outlined text-sm">{log.type === 'BOOK' ? 'local_shipping' : 'account_balance_wallet'}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm font-bold text-on-surface mb-1">{log.title}</div>
                      <div className="text-xs text-on-surface-variant mb-1">الطالب: {log.user}</div>
                      <div className="text-[10px] text-on-surface-variant font-label-caps">{getTimeAgo(log.date)}</div>
                    </div>
                    <div className={`font-code-sm font-bold ${log.type === 'BOOK' ? 'text-secondary' : 'text-primary'}`}>
                      {log.amount}
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
