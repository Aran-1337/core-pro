"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Profile state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
        
      if (profile) {
        setUser(profile);
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setEducationLevel(profile.education_level || "");
        setAvatarUrl(profile.avatar_url || null);
      }
      setLoading(false);
    };
    fetchUser();
  }, [router, supabase]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // validate image
    if (!file.type.startsWith('image/')) {
      alert("الرجاء رفع ملف صورة صالح");
      return;
    }
    
    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to avatars bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("حدث خطأ أثناء رفع الصورة.");
      setSaving(false);
      return;
    }

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const newAvatarUrl = data.publicUrl;

    // Update users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: newAvatarUrl })
      .eq('id', user.id);

    if (updateError) {
      alert("حدث خطأ في حفظ رابط الصورة.");
    } else {
      setAvatarUrl(newAvatarUrl);
      alert("تم تحديث الصورة الشخصية بنجاح!");
      // Need to force reload to reflect changes in NavBar or we can rely on context (if any).
      // Here a simple reload or state update is enough.
      window.location.reload();
    }
    
    setSaving(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        phone,
        education_level: educationLevel,
      })
      .eq("id", user.id);
      
    setSaving(false);
    if (error) {
      alert("حدث خطأ أثناء تحديث البيانات.");
    } else {
      alert("تم تحديث البيانات بنجاح!");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage("كلمات المرور غير متطابقة.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    
    setSaving(true);
    setPasswordMessage("");
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    setSaving(false);
    
    if (error) {
      setPasswordMessage("حدث خطأ أثناء تحديث كلمة المرور.");
    } else {
      setPasswordMessage("تم تحديث كلمة المرور بنجاح.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (loading) {
    return (
      <main className="pt-32 pb-16 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-3xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">إعدادات الحساب</h1>
        <p className="text-on-surface-variant font-body-base">إدارة معلوماتك الشخصية وتفضيلات الأمان.</p>
      </div>

      <div className="space-y-8">
        
        {/* Profile Settings */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <h2 className="font-headline-md text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person</span>
            المعلومات الشخصية
          </h2>
          
          {/* Avatar Upload Section */}
          <div className="mb-8 flex items-center gap-6 pb-6 border-b border-white/5">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full bg-surface-container-highest border-2 border-primary/20 overflow-hidden flex items-center justify-center relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
                )}
                
                {/* Hover overlay */}
                <div 
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                </div>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                disabled={saving}
              />
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-1">الصورة الشخصية</h3>
              <p className="text-sm text-on-surface-variant mb-3">يُنصح بصورة مربعة بحجم لا يتجاوز 2 ميجابايت.</p>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="text-sm font-bold bg-surface-container-highest border border-white/10 px-4 py-2 rounded-lg text-on-surface hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {saving ? "جاري الرفع..." : "تغيير الصورة"}
              </button>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">الاسم الكامل</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:border-primary transition-colors outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:border-primary transition-colors outline-none text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">المستوى الدراسي</label>
                <input 
                  type="text" 
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  placeholder="مثال: الصف الثالث الثانوي"
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:border-primary transition-colors outline-none"
                />
              </div>
            </div>
            <div className="pt-4 text-left">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          <h2 className="font-headline-md text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            الأمان وكلمة المرور
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">كلمة المرور الجديدة</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:border-primary transition-colors outline-none text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">تأكيد كلمة المرور</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:border-primary transition-colors outline-none text-left"
                  dir="ltr"
                />
              </div>
            </div>
            
            {passwordMessage && (
              <div className={`p-3 rounded-lg text-sm font-bold ${passwordMessage.includes("نجاح") ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-error/10 text-error border border-error/20"}`}>
                {passwordMessage}
              </div>
            )}
            
            <div className="pt-4 text-left">
              <button 
                type="submit" 
                disabled={saving || !newPassword}
                className="bg-surface-container-highest border border-white/20 text-on-surface px-6 py-3 rounded-lg font-bold hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? "جاري التحديث..." : "تحديث كلمة المرور"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}
