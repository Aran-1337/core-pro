"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function AdminStudentsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [loading, setLoading] = useState(true);

  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);

  const [editingBalanceStudent, setEditingBalanceStudent] = useState<any>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  
  // Notification Modal
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notifyingStudent, setNotifyingStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, email, full_name, phone, role, status, balance, created_at,
        enrollments (
          id, expires_at, course_id, created_at,
          courses (
            id, title, pricing_type, price
          )
        )
      `)
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
      setLoading(false);
      return;
    }

    if (users) {
      const active = users.filter(u => u.status === 'APPROVED').map(formatStudentData);
      const pending = users.filter(u => u.status === 'PENDING').map(formatStudentData);
      setActiveStudents(active);
      setPendingStudents(pending);
    }
    setLoading(false);
  };

  const formatStudentData = (u: any) => {
    const formattedDate = new Date(u.created_at).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    
    // Map enrollments to courses format for UI
    const mappedCourses = u.enrollments?.map((e: any) => ({
      id: e.course_id,
      enrollment_id: e.id,
      title: e.courses?.title || 'كورس محذوف',
      type: e.courses?.pricing_type === 'ONE_TIME' ? 'one-time' : 'subscription',
      price: e.courses?.price,
      enrolledAt: e.created_at ? new Date(e.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }) : null,
      progress: 0 // Progress tracking not implemented yet
    })) || [];

    return {
      id: u.id,
      name: u.full_name || 'بدون اسم',
      level: 'غير محدد', // Level not in DB yet
      email: u.email || 'غير متاح',
      phone: u.phone || 'غير محدد',
      joinDate: formattedDate,
      requestDate: formattedDate,
      balance: u.balance,
      avatar: u.full_name ? u.full_name.charAt(0) : 'ط',
      color: 'bg-primary/20 text-primary', // Can be randomized
      courses: mappedCourses
    };
  };

  // --- Actions ---
  const approveStudent = async (student: any) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'APPROVED' })
      .eq('id', student.id);

    if (!error) {
      // Add to active, remove from pending
      setActiveStudents([{ ...student, status: 'APPROVED' }, ...activeStudents]);
      setPendingStudents(pendingStudents.filter(s => s.id !== student.id));
    } else {
      alert("حدث خطأ أثناء الموافقة على الطالب");
    }
  };

  const rejectStudent = async (id: string) => {
    if (confirm("هل أنت متأكد من رفض طلب هذا الطالب؟ سيتم مسح بياناته نهائياً.")) {
      // Because users is linked to auth.users, ideally we'd delete the auth user via Edge Function.
      // For now, we update the status to REJECTED or delete from public.users (which might cause issues if they try to sign up again without deleting auth.user).
      // We'll set status to REJECTED.
      const { error } = await supabase
        .from('users')
        .update({ status: 'REJECTED' })
        .eq('id', id);

      if (!error) {
        setPendingStudents(pendingStudents.filter(s => s.id !== id));
      } else {
        alert("حدث خطأ أثناء الرفض");
      }
    }
  };

  const deleteActiveStudent = async (id: string) => {
    if (confirm("تحذير: هل أنت متأكد من حذف حساب هذا الطالب بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) {
      // Set to REJECTED to restrict access (Real deletion requires Admin API).
      const { error } = await supabase
        .from('users')
        .update({ status: 'REJECTED' })
        .eq('id', id);

      if (!error) {
        setActiveStudents(activeStudents.filter(s => s.id !== id));
        setViewingStudent(null);
      } else {
        alert("حدث خطأ أثناء إيقاف الحساب");
      }
    }
  };

  const openBalanceModal = (student: any) => {
    setEditingBalanceStudent(student);
    setNewBalance(student.balance);
  };

  const saveBalance = async () => {
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', editingBalanceStudent.id);

    if (!error) {
      setActiveStudents(activeStudents.map(s => s.id === editingBalanceStudent.id ? { ...s, balance: newBalance } : s));
      setEditingBalanceStudent(null);
    } else {
      alert("حدث خطأ أثناء حفظ الرصيد");
    }
  };

  const openProfileModal = (student: any) => {
    setViewingStudent(student);
  };

  const cancelSubscription = async (studentId: string, enrollmentId: string) => {
    if (confirm("هل تريد إلغاء اشتراك الطالب في هذا الكورس؟")) {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (!error) {
        // Update local state
        const updatedStudents = activeStudents.map(student => {
          if (student.id === studentId) {
            return {
              ...student,
              courses: student.courses.filter((c: any) => c.enrollment_id !== enrollmentId)
            };
          }
          return student;
        });
        setActiveStudents(updatedStudents);
        
        const updatedViewingStudent = updatedStudents.find(s => s.id === studentId);
        setViewingStudent(updatedViewingStudent);
      } else {
        alert("حدث خطأ أثناء إلغاء الاشتراك");
      }
    }
  };

  const openNotificationModal = (student: any) => {
    setNotifyingStudent(student);
    setNotificationMessage("اشتراكك في الكورس قد انتهى. يرجى شحن رصيدك وتجديد الاشتراك للاستمرار.");
    setNotificationModalOpen(true);
  };

  const sendNotification = async () => {
    if (!notificationMessage.trim()) return alert("يرجى كتابة رسالة");
    const { error } = await supabase.from('notifications').insert([
      { user_id: notifyingStudent.id, message: notificationMessage }
    ]);
    if (error) {
      alert("حدث خطأ أثناء إرسال الإشعار");
      console.error(error);
    } else {
      alert("تم إرسال الإشعار بنجاح للطالب!");
      setNotificationModalOpen(false);
    }
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">إدارة الطلاب</h1>
          <p className="text-on-surface-variant text-sm">إدارة حسابات الطلاب، الموافقة على التسجيلات، وتعديل الأرصدة والاشتراكات.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للوحة التحكم
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container-low p-1 rounded-xl w-fit border border-white/5">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-sm">groups</span>
          الطلاب المعتمدين ({loading ? '...' : activeStudents.length})
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-secondary/20 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
        >
          <span className="material-symbols-outlined text-sm">how_to_reg</span>
          طلبات التسجيل ({loading ? '...' : pendingStudents.length})
          {pendingStudents.length > 0 && <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && activeTab === 'active' && (
          <>
            <div className="p-4 border-b border-white/5 bg-surface-container-low flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-1/2">
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="ابحث عن طالب بالاسم، الإيميل، أو رقم الهاتف..." 
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg pr-10 pl-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right whitespace-nowrap">
                <thead className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-label-caps">الطالب</th>
                    <th className="px-6 py-4 font-label-caps">بيانات التواصل</th>
                    <th className="px-6 py-4 font-label-caps">تاريخ التسجيل</th>
                    <th className="px-6 py-4 font-label-caps">رصيد المحفظة</th>
                    <th className="px-6 py-4 font-label-caps text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${student.color} flex items-center justify-center font-bold`}>
                            {student.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface">{student.name}</div>
                            <div className="text-xs text-primary">{student.level}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-on-surface">{student.email}</div>
                        <div className="text-xs text-on-surface-variant font-code-sm">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant font-code-sm">
                        {student.joinDate}
                      </td>
                      <td className="px-6 py-4 font-code-sm text-secondary font-bold text-lg">
                        {student.balance} EGP
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openBalanceModal(student)}
                            className="px-3 py-1 bg-surface-container-high border border-white/10 hover:border-primary/50 text-on-surface rounded text-xs transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">edit_square</span>
                            تعديل الرصيد
                          </button>
                          <button 
                            onClick={() => openProfileModal(student)}
                            className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors flex items-center gap-1 text-xs font-bold" 
                            title="عرض الملف والاشتراكات"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            الاشتراكات
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeStudents.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-16 text-on-surface-variant font-bold">لا يوجد طلاب معتمدين حتى الآن</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && activeTab === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
              <thead className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-label-caps">الطالب</th>
                  <th className="px-6 py-4 font-label-caps">بيانات التواصل</th>
                  <th className="px-6 py-4 font-label-caps">المستوى الدراسي</th>
                  <th className="px-6 py-4 font-label-caps">تاريخ الطلب</th>
                  <th className="px-6 py-4 font-label-caps text-center">القرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold">
                          {student.avatar}
                        </div>
                        <div className="font-bold text-on-surface">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-on-surface">{student.email}</div>
                      <div className="text-xs text-on-surface-variant font-code-sm">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {student.level}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-code-sm">
                      {student.requestDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => approveStudent(student)}
                          className="px-4 py-1.5 bg-secondary text-on-secondary hover:brightness-110 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-[0_0_15px_rgba(121,255,91,0.2)]"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          موافقة
                        </button>
                        <button 
                          onClick={() => rejectStudent(student.id)}
                          className="p-1.5 hover:bg-error/20 text-error rounded-lg transition-colors" title="رفض"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">task_alt</span>
                      <p className="text-on-surface-variant font-bold">لا توجد طلبات تسجيل معلقة!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* Edit Balance Modal */}
      {editingBalanceStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-primary/20 shadow-2xl relative">
            <button onClick={() => setEditingBalanceStudent(null)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-bold text-xl text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              تعديل رصيد المحفظة
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">تعديل رصيد الطالب: <span className="font-bold text-on-surface">{editingBalanceStudent.name}</span></p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-on-surface-variant mb-2">الرصيد الجديد (EGP)</label>
              <input 
                type="number" 
                value={newBalance}
                onChange={(e) => setNewBalance(Number(e.target.value))}
                className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface font-code-sm text-xl" 
              />
            </div>
            
            <div className="flex gap-2">
              <button onClick={saveBalance} className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-lg hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                حفظ الرصيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Profile & Subscriptions Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-3xl rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setViewingStudent(null)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container-highest p-2 rounded-full">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            
            {/* Student Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-16 h-16 rounded-xl ${viewingStudent.color} flex items-center justify-center font-bold text-2xl`}>
                {viewingStudent.avatar}
              </div>
              <div>
                <h3 className="font-bold text-2xl text-on-surface">{viewingStudent.name}</h3>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-1">
                  <span>{viewingStudent.email}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                  <span className="font-code-sm">{viewingStudent.phone}</span>
                </div>
              </div>
            </div>

            {/* Courses & Subscriptions */}
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h4 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">collections_bookmark</span>
                الكورسات والاشتراكات الحالية
              </h4>
              <button 
                onClick={() => openNotificationModal(viewingStudent)} 
                className="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                إرسال إشعار للطالب
              </button>
            </div>

            <div className="space-y-3 mb-8">
              {viewingStudent.courses && viewingStudent.courses.length > 0 ? (
                viewingStudent.courses.map((course: any) => (
                  <div key={course.id} className="p-4 bg-surface-container-low border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/10 transition-colors">
                    
                    <div>
                      <div className="font-bold text-on-surface">{course.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {course.type === 'one-time' ? (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">shopping_cart</span> مدفوع بالكامل (مدى الحياة)
                          </span>
                        ) : (
                          <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">event_repeat</span> اشتراك شهري
                          </span>
                        )}
                        {course.enrolledAt && (
                          <span className="text-xs text-on-surface-variant">تاريخ الاشتراك: <span className="font-code-sm">{course.enrolledAt}</span></span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Progress Bar (Visual only) */}
                      <div className="hidden md:flex flex-col items-end gap-1">
                        <span className="text-xs text-on-surface-variant font-code-sm">{course.progress}%</span>
                        <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${course.progress}%` }}></div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => cancelSubscription(viewingStudent.id, course.enrollment_id)}
                        className="px-3 py-1.5 bg-error/10 text-error hover:bg-error hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 opacity-80 hover:opacity-100 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-sm">block</span>
                        إلغاء الاشتراك
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-surface-container-low border border-white/5 rounded-xl text-on-surface-variant">
                  الطالب غير مشترك في أي كورسات حالياً.
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-error/20">
              <h4 className="font-bold text-error mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                منطقة الخطر (إدارة الحساب)
              </h4>
              <p className="text-sm text-on-surface-variant mb-4">
                حذف حساب الطالب سيؤدي إلى إيقافه ومنعه من استخدام المنصة بشكل كامل.
              </p>
              <button 
                onClick={() => deleteActiveStudent(viewingStudent.id)}
                className="px-4 py-2 bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                إيقاف حساب الطالب نهائياً
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {notificationModalOpen && notifyingStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-primary/20 shadow-2xl relative">
            <button onClick={() => setNotificationModalOpen(false)} className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-bold text-xl text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">campaign</span>
              إرسال إشعار للطالب
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">إرسال تنبيه أو رسالة لـ: <span className="font-bold text-on-surface">{notifyingStudent.name}</span></p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-on-surface-variant mb-2">محتوى الرسالة</label>
              <textarea 
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface font-body-base min-h-[120px] resize-none" 
                placeholder="اكتب رسالتك هنا لتظهر للطالب في منتصف الشاشة..."
              />
            </div>
            
            <div className="flex gap-2">
              <button onClick={sendNotification} className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)]">
                إرسال الإشعار الآن
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
