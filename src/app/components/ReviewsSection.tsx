"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('student_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data) setReviews(data);
      setLoading(false);
    };

    fetchReviews();
  }, []);

  if (loading || reviews.length === 0) return null; // Don't show section if no reviews

  return (
    <section className="py-section-gap relative">
      <div className="container mx-auto px-container-margin">
        <div className="text-center mb-16">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">آراء الطلاب المبدعين</h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            ماذا يقول طلابنا عن تجربتهم في منصة ثانوية المبرمج؟ قصص نجاح حقيقية تبدأ من هنا.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-secondary/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
              
              <div className="flex text-amber-400 mb-4 text-sm relative z-10">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined ${i < review.rating ? 'fill-current' : 'text-surface-container-highest'}`} style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                ))}
              </div>
              
              <p className="text-on-surface-variant italic mb-6 relative z-10 min-h-[80px]">
                "{review.review_text}"
              </p>
              
              <div className="flex items-center gap-4 relative z-10 border-t border-white/5 pt-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-white/10 shrink-0">
                  {review.image_url ? (
                    <img src={review.image_url} alt={review.student_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary font-bold text-sm">
                      {review.student_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-sm">{review.student_name}</h4>
                  {review.student_role && (
                    <p className="text-xs text-on-surface-variant">{review.student_role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
