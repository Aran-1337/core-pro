"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function TrackingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, phone, role, last_ip, country, browser, device, login_sessions, blocked_ips, status')
        .order('role', { ascending: true }); // Admins first
      
      if (data) setUsers(data);
      setLoading(false);
    };
    
    fetchUsers();
  }, []);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closeUserModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleBlockIp = async (ip: string) => {
    if (!selectedUser) return;
    const currentBlocked = Array.isArray(selectedUser.blocked_ips) ? selectedUser.blocked_ips : [];
    if (currentBlocked.includes(ip)) return;
    
    const newBlocked = [...currentBlocked, ip];
    await supabase.from('users').update({ blocked_ips: newBlocked }).eq('id', selectedUser.id);
    
    // Update local state
    const updatedUser = { ...selectedUser, blocked_ips: newBlocked };
    setSelectedUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    alert(`تم حظر IP: ${ip} بنجاح`);
  };

  const handleUnblockIp = async (ip: string) => {
    if (!selectedUser) return;
    const currentBlocked = Array.isArray(selectedUser.blocked_ips) ? selectedUser.blocked_ips : [];
    
    const newBlocked = currentBlocked.filter(blockedIp => blockedIp !== ip);
    await supabase.from('users').update({ blocked_ips: newBlocked }).eq('id', selectedUser.id);
    
    // Update local state
    const updatedUser = { ...selectedUser, blocked_ips: newBlocked };
    setSelectedUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    alert(`تم فك الحظر عن IP: ${ip} بنجاح`);
  };

  const handleSuspendAccount = async () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    await supabase.from('users').update({ status: newStatus }).eq('id', selectedUser.id);
    
    // Update local state
    const updatedUser = { ...selectedUser, status: newStatus };
    setSelectedUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    alert(newStatus === 'SUSPENDED' ? 'تم إيقاف الحساب بنجاح' : 'تم تفعيل الحساب بنجاح');
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">مراقبة الزوار والـ IP</h1>
          <p className="text-on-surface-variant text-sm">تتبع أماكن الطلاب الجغرافية وحماية الحسابات من المشاركة.</p>
        </div>
        <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          العودة للوحة التحكم
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-highest border-b border-white/5 text-on-surface-variant text-sm">
                <th className="p-4 font-bold">الاسم</th>
                <th className="p-4 font-bold">رقم الهاتف</th>
                <th className="p-4 font-bold">الرتبة</th>
                <th className="p-4 font-bold" dir="ltr">آخر IP</th>
                <th className="p-4 font-bold">الدولة</th>
                <th className="p-4 font-bold">المتصفح</th>
                <th className="p-4 font-bold">إجراءات الحماية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">جاري تحميل البيانات...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">لا يوجد مستخدمين مسجلين بعد.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface'}`}>
                          {u.full_name.charAt(0)}
                        </div>
                        {u.full_name}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant" dir="ltr">{u.phone}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {u.role === 'ADMIN' ? 'أدمن' : 'طالب'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-code-sm text-on-surface-variant" dir="ltr">
                      {u.last_ip || 'غير متوفر'}
                    </td>
                    <td className="p-4 text-sm text-on-surface">
                      <div className="flex items-center gap-2">
                        {u.country ? (
                          <>
                            <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                            {u.country}
                          </>
                        ) : (
                          <span className="text-on-surface-variant">غير متوفر</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {u.browser || 'غير متوفر'}
                    </td>
                    <td className="p-4 text-sm">
                      <button 
                        onClick={() => openUserModal(u)}
                        className="px-3 py-1.5 bg-error/10 text-error hover:bg-error hover:text-white rounded transition-colors text-xs font-bold"
                      >
                        إدارة الحماية
                      </button>
                      {u.status === 'SUSPENDED' && (
                        <span className="block mt-1 text-xs text-error font-bold">موقوف</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protection Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high">
              <div>
                <h3 className="text-xl font-bold text-on-surface">إدارة حماية الحساب: {selectedUser.full_name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">سجل الجلسات والأجهزة التي استخدمها الطالب</p>
              </div>
              <button onClick={closeUserModal} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Account Level Protection */}
              <div className="mb-6 p-4 rounded-xl border border-error/20 bg-error/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-error">حالة الحساب</h4>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {selectedUser.status === 'SUSPENDED' 
                      ? 'هذا الحساب موقوف حالياً ولا يمكنه تسجيل الدخول.' 
                      : 'إيقاف الحساب يمنع الطالب من الدخول من أي جهاز نهائياً.'}
                  </p>
                </div>
                <button 
                  onClick={handleSuspendAccount}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    selectedUser.status === 'SUSPENDED' 
                      ? 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white' 
                      : 'bg-error text-white hover:bg-error/80'
                  }`}
                >
                  {selectedUser.status === 'SUSPENDED' ? 'تفعيل الحساب' : 'إيقاف الحساب نهائياً'}
                </button>
              </div>

              {/* Sessions History */}
              <h4 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">history</span>
                سجل الأجهزة المتصلة
              </h4>
              
              <div className="space-y-3">
                {Array.isArray(selectedUser.login_sessions) && selectedUser.login_sessions.length > 0 ? (
                  selectedUser.login_sessions.map((session: any, idx: number) => {
                    const isBlocked = Array.isArray(selectedUser.blocked_ips) && selectedUser.blocked_ips.includes(session.ip);
                    return (
                      <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${isBlocked ? 'border-error/30 bg-error/5' : 'border-white/5 bg-surface-container-high'}`}>
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBlocked ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'}`}>
                            <span className="material-symbols-outlined">{session.device === 'Mobile/Tablet' ? 'smartphone' : 'computer'}</span>
                          </div>
                          <div>
                            <div className="font-bold text-sm text-on-surface" dir="ltr">{session.ip}</div>
                            <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                              <span>{session.browser}</span> • <span>{session.country}</span>
                            </div>
                            <div className="text-[10px] text-on-surface-variant/70 mt-1">
                              {new Date(session.timestamp).toLocaleString('ar-EG')}
                            </div>
                          </div>
                        </div>
                        
                        {!isBlocked ? (
                          <button 
                            onClick={() => handleBlockIp(session.ip)}
                            className="px-3 py-1.5 bg-error/10 text-error hover:bg-error hover:text-white rounded transition-colors text-xs font-bold"
                          >
                            حظر هذا الـ IP
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUnblockIp(session.ip)}
                            className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors text-xs font-bold"
                          >
                            فك حظر الـ IP
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 border border-white/5 border-dashed rounded-xl text-on-surface-variant">
                    لا يوجد سجل جلسات محفوظ حتى الآن
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
