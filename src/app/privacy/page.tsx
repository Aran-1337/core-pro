import { createClient } from "@/utils/supabase/server";

export const revalidate = 0; // Ensures it's dynamically fetched

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: pageData } = await supabase.from('site_settings').select('value').eq('key', 'page_privacy').single();
  const content = pageData?.value?.content;

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-4xl mx-auto min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">سياسة الخصوصية</h1>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-white/5">
        {content ? (
          <div className="prose prose-invert max-w-none font-body-base text-on-surface-variant leading-relaxed text-right" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="space-y-6 text-on-surface-variant font-body-base leading-relaxed">
            <h2 className="text-xl font-bold text-on-surface">مقدمة</h2>
            <p>
              في منصة Dev Aran، نولي أهمية قصوى لخصوصية بياناتك ومعلوماتك الشخصية. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية بياناتك.
            </p>

            <h2 className="text-xl font-bold text-on-surface">جمع المعلومات</h2>
            <p>
              نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في المنصة مثل: الاسم، البريد الإلكتروني، ورقم الهاتف، والمرحلة الدراسية.
            </p>

            <h2 className="text-xl font-bold text-on-surface">استخدام المعلومات</h2>
            <p>
              نستخدم هذه المعلومات لتحسين تجربتك التعليمية، تفعيل الكورسات، التواصل معك بخصوص الدعم الفني، وإرسال التنبيهات الهامة المتعلقة بحسابك.
            </p>
            
            <h2 className="text-xl font-bold text-on-surface">حماية البيانات</h2>
            <p>
              نحن نتخذ كافة التدابير الأمنية التقنية والتنظيمية لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
