"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'system' | 'security' | 'pages'>('profile');
  const [adminProfile, setAdminProfile] = useState({ name: '', title: '', bio: '', avatar_url: '', facebook: '', youtube: '', phone: '' });
  
  // Pages State
  const [pageContact, setPageContact] = useState('');
  const [pageTerms, setPageTerms] = useState('');
  const [pagePrivacy, setPagePrivacy] = useState('');
  
  const [assistants, setAssistants] = useState<any[]>([]);
  const [newAssistantPhone, setNewAssistantPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<'disabled' | 'enrolling' | 'enabled'>('disabled');
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const supabase = createClient();

  const checkMfaStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (data?.currentLevel === 'aal2' || data?.nextLevel === 'aal2') {
        setMfaStatus('enabled');
      }
    }
  };

  const fetchAssistants = async () => {
    const { data } = await supabase.from('users').select('id, full_name, phone, role').eq('role', 'ADMIN');
    if (data) setAssistants(data);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      // Fetch Profile
      const { data: profileData } = await supabase.from('site_settings').select('value').eq('key', 'instructor_profile').single();
      if (profileData && profileData.value) {
        setAdminProfile((prev) => ({ ...prev, ...profileData.value }));
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase.from('users').select('full_name, phone, bio').eq('id', user.id).single();
          if (userData) {
             setAdminProfile({ 
               name: userData.full_name || '', 
               title: 'المحاضر', 
               bio: userData.bio || '', 
               avatar_url: '', 
               facebook: '', 
               youtube: '', 
               phone: userData.phone || '' 
             });
          }
        }
      }

      // Fetch Payment Methods
      const { data: methodsData } = await supabase.from('site_settings').select('value').eq('key', 'payment_methods').single();
      if (methodsData && methodsData.value && Array.isArray(methodsData.value)) {
        // Auto-correct InstaPay icon if it's currently broken
        let loadedMethods = methodsData.value;
        const instapayNeedsFix = loadedMethods.find((m: any) => m.id === 'instapay' && m.type !== 'image');
        
        if (instapayNeedsFix) {
          loadedMethods = loadedMethods.map((m: any) => 
            m.id === 'instapay' ? { ...m, type: 'image', icon: '/instapay.png' } : m
          );
          // Save the correction back quietly
          supabase.from('site_settings').update({ value: loadedMethods }).eq('key', 'payment_methods').then();
        }
        
        setMethods(loadedMethods);
      }

      // Fetch Pages
      const { data: pagesData } = await supabase.from('site_settings').select('key, value').in('key', ['page_contact', 'page_terms', 'page_privacy']);
      if (pagesData) {
        const contact = pagesData.find((p: any) => p.key === 'page_contact');
        const terms = pagesData.find((p: any) => p.key === 'page_terms');
        const privacy = pagesData.find((p: any) => p.key === 'page_privacy');
        
        if (contact && contact.value?.content) setPageContact(contact.value.content);
        if (terms && terms.value?.content) setPageTerms(terms.value.content);
        if (privacy && privacy.value?.content) setPagePrivacy(privacy.value.content);
      }
    };
    fetchSettings();
    fetchAssistants();
    checkMfaStatus();
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    
    // Save phone to users table separately for admin login/contact
    // Save phone and avatar_url to users table separately for admin login/contact
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
       await supabase.from('users').update({ 
         phone: adminProfile.phone || null
       }).eq('id', user.id);
    }
    
    // Save rest to site_settings
    const profileToSave = {
       name: adminProfile.name,
       title: adminProfile.title,
       bio: adminProfile.bio,
       avatar_url: adminProfile.avatar_url,
       facebook: adminProfile.facebook,
       youtube: adminProfile.youtube
    };
    
    const { data: existingSettings } = await supabase.from('site_settings').select('id').eq('key', 'instructor_profile').single();
    if (existingSettings) {
       await supabase.from('site_settings').update({ value: profileToSave }).eq('key', 'instructor_profile');
    } else {
       await supabase.from('site_settings').insert({ key: 'instructor_profile', value: profileToSave });
    }
    
    setIsSaving(false);
    alert('تم حفظ البيانات بنجاح!');
  };

  const savePages = async () => {
    setIsSaving(true);
    
    const pages = [
      { key: 'page_contact', content: pageContact },
      { key: 'page_terms', content: pageTerms },
      { key: 'page_privacy', content: pagePrivacy },
    ];

    for (const page of pages) {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', page.key).single();
      if (existing) {
        await supabase.from('site_settings').update({ value: { content: page.content } }).eq('key', page.key);
      } else {
        await supabase.from('site_settings').insert({ key: page.key, value: { content: page.content } });
      }
    }
    
    setIsSaving(false);
    alert('تم حفظ محتوى الصفحات بنجاح!');
  };

  const addAssistant = async () => {
    if (!newAssistantPhone) return;
    const { data: userToPromote } = await supabase.from('users').select('id, full_name').eq('phone', newAssistantPhone).single();
    if (userToPromote) {
      await supabase.from('users').update({ role: 'ADMIN' }).eq('id', userToPromote.id);
      fetchAssistants();
      setNewAssistantPhone('');
      alert(`تم ترقية ${userToPromote.full_name} ليصبح مساعد (أدمن) بنجاح!`);
    } else {
      alert("لم يتم العثور على أي شخص بهذا الرقم. يجب أن ينشئ حساباً كطالب أولاً.");
    }
  };

  const removeAssistant = async (id: string, name: string) => {
    if (id === adminProfile.id) {
      alert("لا يمكنك إزالة صلاحيات نفسك!");
      return;
    }
    if (confirm(`هل أنت متأكد من إزالة صلاحيات الإدارة من ${name}؟`)) {
      await supabase.from('users').update({ role: 'STUDENT' }).eq('id', id);
      fetchAssistants();
    }
  };

  const startMfaEnrollment = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setQrCodeData(data);
      setMfaStatus('enrolling');
    } catch (err: any) {
      alert("حدث خطأ أثناء البدء: " + err.message);
    }
  };

  const verifyMfa = async () => {
    try {
      if (!qrCodeData) return;
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: qrCodeData.id });
      if (challengeError) throw challengeError;
      
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: qrCodeData.id,
        challengeId: challenge.id,
        code: verificationCode
      });
      if (error) throw error;
      
      setMfaStatus('enabled');
      alert("تم تفعيل المصادقة الثنائية بنجاح!");
    } catch (err: any) {
      alert("الرمز غير صحيح أو حدث خطأ: " + err.message);
    }
  };

  const disableMfa = async () => {
    if (confirm("هل أنت متأكد من تعطيل المصادقة الثنائية؟ سيقلل هذا من أمان حسابك.")) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.totp.length > 0) {
        for (const factor of factors.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      setMfaStatus('disabled');
      alert("تم تعطيل المصادقة الثنائية.");
    }
  };

  // --- Payment Methods State ---
  const [methods, setMethods] = useState<any[]>([
    { id: 'fawry', name: 'Fawry', icon: 'payments', type: 'icon', active: true, desc: 'الدفع النقدي عبر فوري' },
    { id: 'vodafone', name: 'Vodafone Cash', icon: 'phone_iphone', type: 'icon', color: '#E60000', active: true, desc: 'رقم المحفظة: 01012345678' },
    { id: 'instapay', name: 'InstaPay', icon: '/instapay.png', type: 'image', active: true, desc: 'عنوان الدفع: admin@instapay' },
    { id: 'meeza', name: 'Meeza', icon: 'credit_card', type: 'icon', active: false, desc: 'بوابات الدفع المحلية' },
    { id: 'visa', name: 'Visa / Mastercard', icon: 'contactless', type: 'icon', active: true, desc: 'بوابة الدفع العالمية' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [modalMethodName, setModalMethodName] = useState('');
  const [modalMethodDesc, setModalMethodDesc] = useState('');

  const saveMethodsToDb = async (newMethods: any[]) => {
    const { data: existingSettings } = await supabase.from('site_settings').select('id').eq('key', 'payment_methods').single();
    if (existingSettings) {
       await supabase.from('site_settings').update({ value: newMethods }).eq('key', 'payment_methods');
    } else {
       await supabase.from('site_settings').insert({ key: 'payment_methods', value: newMethods });
    }
  };

  const toggleMethod = (id: string) => {
    const newMethods = methods.map(m => m.id === id ? { ...m, active: !m.active } : m);
    setMethods(newMethods);
    saveMethodsToDb(newMethods);
  };

  const openAddModal = () => {
    setEditingMethod(null);
    setModalMethodName('');
    setModalMethodDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (method: any) => {
    setEditingMethod(method);
    setModalMethodName(method.name);
    setModalMethodDesc(method.desc);
    setIsModalOpen(true);
  };

  const saveMethodModal = () => {
    let newMethods = [...methods];
    if (editingMethod) {
      newMethods = newMethods.map(m => m.id === editingMethod.id ? { ...m, name: modalMethodName, desc: modalMethodDesc } : m);
    } else {
      newMethods.push({
        id: `method_${Date.now()}`,
        name: modalMethodName,
        desc: modalMethodDesc,
        icon: 'payments',
        type: 'icon',
        active: true
      });
    }
    setMethods(newMethods);
    saveMethodsToDb(newMethods);
    setIsModalOpen(false);
  };

  const deleteMethodModal = () => {
    if (confirm('هل أنت متأكد من حذف هذه الطريقة؟')) {
      const newMethods = methods.filter(m => m.id !== editingMethod.id);
      setMethods(newMethods);
      saveMethodsToDb(newMethods);
      setIsModalOpen(false);
    }
  };

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">الإعدادات العامة</h1>
          <p className="text-on-surface-variant text-sm">التحكم في المنصة، طرق الدفع، والأمان.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
            العودة للوحة التحكم
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar settings navigation */}
        <aside className="lg:col-span-3 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 p-4 rounded-xl border font-bold transition-all text-right ${activeTab === 'profile' ? 'bg-primary/10 text-primary border-primary/20' : 'border-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">person</span>
            الملف الشخصي
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-3 p-4 rounded-xl border font-bold transition-all text-right ${activeTab === 'payments' ? 'bg-primary/10 text-primary border-primary/20' : 'border-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            طرق الدفع والمحافظ
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-3 p-4 rounded-xl border font-bold transition-all text-right ${activeTab === 'system' ? 'bg-primary/10 text-primary border-primary/20' : 'border-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">settings_applications</span>
            إعدادات النظام
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 p-4 rounded-xl border font-bold transition-all text-right ${activeTab === 'security' ? 'bg-primary/10 text-primary border-primary/20' : 'border-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">security</span>
            الأمان والصلاحيات
          </button>
          <button 
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-3 p-4 rounded-xl border font-bold transition-all text-right ${activeTab === 'pages' ? 'bg-primary/10 text-primary border-primary/20' : 'border-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined">article</span>
            الصفحات الثابتة
          </button>
        </aside>

        {/* Main Settings Area */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* TAB 0: PROFILE */}
          {activeTab === 'profile' && (
            <div className="glass-card rounded-2xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-on-surface mb-6 border-b border-white/5 pb-6">الملف الشخصي للمحاضر</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">الاسم بالكامل (يظهر للطلاب)</label>
                    <input 
                      type="text" 
                      value={adminProfile.name}
                      onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">الوظيفية أو اللقب (مثال: خبير برمجيات)</label>
                    <input 
                      type="text" 
                      value={adminProfile.title}
                      onChange={(e) => setAdminProfile({...adminProfile, title: e.target.value})}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">نبذة عن المحاضر (تظهر للطلاب في صفحة الكورس)</label>
                  <textarea 
                    value={adminProfile.bio || ''}
                    onChange={(e) => setAdminProfile({...adminProfile, bio: e.target.value})}
                    className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface min-h-[120px] resize-y"
                    placeholder="اكتب نبذة تعريفية عنك وعن خبراتك..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2">رابط صورة المحاضر (Avatar URL)</label>
                  <input 
                    type="url" 
                    dir="ltr"
                    value={adminProfile.avatar_url || ''}
                    onChange={(e) => setAdminProfile({...adminProfile, avatar_url: e.target.value})}
                    className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" 
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2"><span className="text-primary">#</span> صفحة فيسبوك (اختياري)</label>
                    <input 
                      type="url" 
                      dir="ltr"
                      value={adminProfile.facebook || ''}
                      onChange={(e) => setAdminProfile({...adminProfile, facebook: e.target.value})}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" 
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2"><span className="text-error">#</span> قناة يوتيوب (اختياري)</label>
                    <input 
                      type="url" 
                      dir="ltr"
                      value={adminProfile.youtube || ''}
                      onChange={(e) => setAdminProfile({...adminProfile, youtube: e.target.value})}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" 
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>

                <div className="h-px bg-white/5 my-6"></div>

                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-2 text-secondary">رقم الهاتف (للتواصل الإداري ولا يظهر للطلاب)</label>
                  <input 
                    type="text" 
                    dir="ltr"
                    value={adminProfile.phone}
                    onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
                    className="w-full md:w-1/2 bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" 
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)] disabled:opacity-50"
                  >
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="glass-card rounded-2xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-on-surface mb-1">طرق الدفع المفعلة</h2>
                  <p className="text-on-surface-variant text-sm">تحكم في المحافظ وخيارات الدفع التي تظهر للطلاب. يمكنك تعديل أرقام المحافظ من هنا.</p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)] shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  إضافة محفظة جديدة
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {methods.map((method) => (
                  <div key={method.id} className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${method.active ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-surface-container-highest opacity-70'}`}>
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-white/5 flex items-center justify-center shrink-0">
                        {method.type === 'image' ? (
                          <img src={method.icon} alt={method.name} className="h-10 object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl" style={{ color: method.color || 'inherit' }}>{method.icon}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{method.name}</h3>
                        <p className="text-sm text-on-surface-variant mt-1" dir="ltr">{method.desc}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      <button 
                        onClick={() => openEditModal(method)}
                        className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        تعديل
                      </button>
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer" title={method.active ? "تعطيل طريقة الدفع" : "تفعيل طريقة الدفع"}>
                        <input type="checkbox" className="sr-only peer" checked={method.active} onChange={() => toggleMethod(method.id)} />
                        <div className="w-11 h-6 bg-surface-container-low peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM SETTINGS */}
          {activeTab === 'system' && (
            <div className="glass-card rounded-2xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-on-surface mb-6 border-b border-white/5 pb-6">إعدادات المنصة</h2>
              
              <div className="space-y-8">
                {/* Branding */}
                <div className="space-y-4">
                  <h3 className="font-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined">brush</span>
                    الهوية البصرية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2">اسم المنصة</label>
                      <input type="text" defaultValue="CORE Academy" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2">اللوجو (شعار الموقع)</label>
                      <div className="border border-white/10 rounded-lg p-2 flex items-center gap-4 bg-surface-container-highest h-12">
                        <div className="bg-surface-container-low px-4 h-full flex items-center rounded text-xs font-bold border border-white/5 cursor-pointer hover:bg-white/5">اختر صورة</div>
                        <span className="text-xs text-on-surface-variant">logo_main.png</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5"></div>

                {/* Socials */}
                <div className="space-y-4">
                  <h3 className="font-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined">share</span>
                    التواصل والدعم الفني
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2"><span className="text-primary">#</span> رقم الدعم الفني (WhatsApp)</label>
                      <input type="text" dir="ltr" defaultValue="+201012345678" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2"><span className="text-primary">#</span> قناة تيليجرام</label>
                      <input type="url" dir="ltr" defaultValue="https://t.me/core_academy" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2"><span className="text-primary">#</span> صفحة فيسبوك</label>
                      <input type="url" dir="ltr" placeholder="https://facebook.com/..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2 flex items-center gap-2"><span className="text-primary">#</span> قناة يوتيوب</label>
                      <input type="url" dir="ltr" placeholder="https://youtube.com/..." className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface text-left" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5"></div>

                {/* Danger Zone */}
                <div className="space-y-4">
                  <h3 className="font-bold text-error flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    التحكم المتقدم (وضع الصيانة)
                  </h3>
                  <div className="p-4 rounded-xl border border-error/30 bg-error/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-on-surface">إغلاق الموقع مؤقتاً</h4>
                      <p className="text-sm text-on-surface-variant">لن يتمكن الطلاب من الدخول أو مشاهدة الكورسات، وستظهر لهم شاشة "صيانة وتحديث". أنت فقط (كأدمن) من يستطيع الدخول.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-14 h-7 bg-surface-container-low peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-error"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                    حفظ التغييرات
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="glass-card rounded-2xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-on-surface mb-6 border-b border-white/5 pb-6">الأمان والصلاحيات</h2>
              
              <div className="space-y-8">
                
                {/* Admin Password */}
                <div className="space-y-4">
                  <h3 className="font-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined">password</span>
                    تغيير كلمة المرور للإدارة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2">كلمة المرور الحالية</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-2">كلمة المرور الجديدة</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 focus:border-primary focus:outline-none text-on-surface" />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button className="px-6 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold hover:bg-white/5 transition-all text-sm border border-white/10">
                        تحديث كلمة المرور
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5"></div>

                {/* 2FA */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-on-surface-variant flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined">verified_user</span>
                        المصادقة الثنائية (2FA)
                      </h3>
                      <p className="text-sm text-on-surface-variant">طلب رمز تأكيد من التطبيق (Google Authenticator) عند تسجيل الدخول لحماية لوحة التحكم من الاختراق.</p>
                    </div>
                    {mfaStatus === 'disabled' && (
                      <button 
                        onClick={startMfaEnrollment}
                        className="px-4 py-2 bg-secondary text-on-secondary rounded-lg font-bold hover:opacity-90 transition-all text-sm whitespace-nowrap shadow-[0_0_15px_rgba(121,255,91,0.2)]"
                      >
                        تفعيل المصادقة
                      </button>
                    )}
                    {mfaStatus === 'enabled' && (
                      <button 
                        onClick={disableMfa}
                        className="px-4 py-2 bg-error text-on-error rounded-lg font-bold hover:opacity-90 transition-all text-sm whitespace-nowrap"
                      >
                        تعطيل المصادقة
                      </button>
                    )}
                  </div>
                  
                  {mfaStatus === 'enrolling' && qrCodeData && (
                    <div className="p-6 bg-surface-container-highest border border-white/10 rounded-xl flex flex-col md:flex-row gap-6 items-center">
                      <div className="bg-white p-2 rounded-lg">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData.totp.uri)}`} alt="QR Code" width={150} height={150} />
                      </div>
                      <div className="flex-1 space-y-4">
                        <h4 className="font-bold text-primary">خطوات التفعيل:</h4>
                        <ol className="list-decimal list-inside text-sm text-on-surface-variant space-y-2">
                          <li>قم بتحميل تطبيق Google Authenticator على هاتفك.</li>
                          <li>قم بمسح الكود (QR Code) الظاهر أمامك باستخدام التطبيق.</li>
                          <li>أدخل الرمز المكون من 6 أرقام الذي ظهر في التطبيق واضغط تأكيد.</li>
                        </ol>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="000000"
                            maxLength={6}
                            dir="ltr"
                            value={verificationCode}
                            onChange={e => setVerificationCode(e.target.value)}
                            className="w-32 bg-surface-container-low border border-white/10 rounded-lg px-4 py-2 text-center tracking-[0.5em] font-bold focus:border-primary focus:outline-none text-on-surface" 
                          />
                          <button 
                            onClick={verifyMfa}
                            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm"
                          >
                            تأكيد التفعيل
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/5"></div>

                {/* Assistants */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined">admin_panel_settings</span>
                      إدارة المشرفين (المساعدين)
                    </h3>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="أدخل رقم هاتف المساعد لإضافته..." 
                      dir="ltr"
                      value={newAssistantPhone}
                      onChange={e => setNewAssistantPhone(e.target.value)}
                      className="flex-grow bg-surface-container-highest border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-primary focus:outline-none text-on-surface text-left" 
                    />
                    <button 
                      onClick={addAssistant}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition-all text-sm whitespace-nowrap"
                    >
                      إضافة أدمن
                    </button>
                  </div>
                  
                  <div className="border border-white/5 rounded-xl bg-surface-container-low divide-y divide-white/5">
                    {assistants.map((assistant) => (
                      <div key={assistant.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${assistant.id === adminProfile.id ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                            {assistant.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-on-surface">
                              {assistant.full_name} {assistant.id === adminProfile.id && "(أنت)"}
                            </div>
                            <div className="text-xs text-on-surface-variant" dir="ltr">{assistant.phone}</div>
                          </div>
                        </div>
                        {assistant.id !== adminProfile.id && (
                          <button 
                            onClick={() => removeAssistant(assistant.id, assistant.full_name)}
                            className="text-error text-sm font-bold p-2 hover:bg-error/10 rounded transition-colors"
                          >
                            إزالة الصلاحية
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-surface-container-low flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">محتوى الصفحات الثابتة</h2>
                    <p className="text-sm text-on-surface-variant mt-1">يمكنك استخدام HTML لتنسيق النصوص (مثل &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;)</p>
                  </div>
                  <button 
                    onClick={savePages} 
                    disabled={isSaving}
                    className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.3)] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">save</span>
                    )}
                    حفظ التعديلات
                  </button>
                </div>

                <div className="p-6 space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">call</span>
                      صفحة اتصل بنا (/contact)
                    </label>
                    <textarea 
                      value={pageContact}
                      onChange={e => setPageContact(e.target.value)}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 text-sm focus:border-primary focus:outline-none text-on-surface min-h-[150px] font-code-sm"
                      placeholder="اكتب كود HTML هنا..."
                      dir="ltr"
                    />
                  </div>

                  <hr className="border-white/5" />

                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-sm">gavel</span>
                      صفحة الشروط والأحكام (/terms)
                    </label>
                    <textarea 
                      value={pageTerms}
                      onChange={e => setPageTerms(e.target.value)}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 text-sm focus:border-primary focus:outline-none text-on-surface min-h-[250px] font-code-sm"
                      placeholder="اكتب كود HTML هنا..."
                      dir="ltr"
                    />
                  </div>

                  <hr className="border-white/5" />

                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">privacy_tip</span>
                      صفحة سياسة الخصوصية (/privacy)
                    </label>
                    <textarea 
                      value={pagePrivacy}
                      onChange={e => setPagePrivacy(e.target.value)}
                      className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 text-sm focus:border-primary focus:outline-none text-on-surface min-h-[250px] font-code-sm"
                      placeholder="اكتب كود HTML هنا..."
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Unified Add/Edit Payment Method Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-primary/20 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingMethod ? 'edit' : 'add_card'}</span>
              {editingMethod ? 'تعديل بيانات المحفظة' : 'إضافة محفظة / طريقة دفع'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">اسم الطريقة (مثال: أورانج كاش)</label>
                <input 
                  type="text" 
                  value={modalMethodName}
                  onChange={(e) => setModalMethodName(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none text-on-surface" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">التفاصيل ورقم المحفظة</label>
                <input 
                  type="text" 
                  dir="ltr" 
                  value={modalMethodDesc}
                  onChange={(e) => setModalMethodDesc(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:outline-none text-on-surface text-left" 
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={saveMethodModal}
                  className="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-lg hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)]"
                >
                  {editingMethod ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                {editingMethod && (
                  <button 
                    onClick={deleteMethodModal}
                    className="w-1/3 bg-error/10 text-error font-bold py-3 rounded-lg hover:bg-error/20 transition-all"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
