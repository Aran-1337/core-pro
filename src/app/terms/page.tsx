import { createClient } from "@/utils/supabase/server";

export const revalidate = 0; // Ensures it's dynamically fetched

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: pageData } = await supabase.from('site_settings').select('value').eq('key', 'page_terms').single();
  const content = pageData?.value?.content;

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-4xl mx-auto min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">الشروط والأحكام</h1>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-white/5">
        {content ? (
          <div className="prose prose-invert max-w-none font-body-base text-on-surface-variant leading-relaxed text-right" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="space-y-6 text-on-surface-variant font-body-base leading-relaxed">
            <h2 className="text-xl font-bold text-on-surface">1. قبول الشروط</h2>
            <p>
              باستخدامك لمنصة Dev Aran، فإنك توافق على الالتزام بجميع الشروط والأحكام المذكورة هنا.
            </p>

            <h2 className="text-xl font-bold text-on-surface">2. حقوق الملكية الفكرية</h2>
            <p>
              جميع الكورسات والكتب والمواد التعليمية الموجودة على المنصة هي ملكية حصرية لمنصة Dev Aran ولا يجوز نسخها أو إعادة توزيعها بأي شكل من الأشكال.
            </p>

            <h2 className="text-xl font-bold text-on-surface">3. الحسابات والاشتراكات</h2>
            <p>
              يحق للإدارة إيقاف أي حساب يثبت تورطه في مشاركة حسابه مع أشخاص آخرين أو محاولة اختراق أو تسريب محتوى المنصة.
            </p>
            
            <h2 className="text-xl font-bold text-on-surface">4. سياسة الاسترجاع</h2>
            <p>
              لا يمكن استرجاع الأموال بعد تفعيل الاشتراك في الكورس أو تحميل الكتاب الرقمي.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
