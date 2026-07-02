"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function GlobalNotification() {
  const [notification, setNotification] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (data && !error) {
        setNotification(data);
        setIsOpen(true);
      }
    };

    fetchNotifications();

    // Listen for new notifications in real-time
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && payload.new.user_id === session.user.id && !payload.new.is_read) {
              setNotification(payload.new);
              setIsOpen(true);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async () => {
    if (!notification) return;
    
    setIsOpen(false); // Close immediately for good UX
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
      
    setNotification(null);
  };

  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 border border-primary/30 shadow-[0_0_50px_rgba(0,210,255,0.15)] relative transform transition-all animate-in zoom-in-95 duration-300" dir="rtl">
        
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,210,255,0.6)]">
            <span className="material-symbols-outlined text-4xl text-on-primary">campaign</span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="font-bold text-2xl text-on-surface mb-2">تنبيه هام!</h3>
          <p className="text-on-surface-variant leading-relaxed text-lg mb-8 font-body-base">
            {notification.message}
          </p>
          
          <button 
            onClick={markAsRead} 
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)] text-lg"
          >
            حسناً، فهمت
          </button>
        </div>
        
      </div>
    </div>
  );
}
