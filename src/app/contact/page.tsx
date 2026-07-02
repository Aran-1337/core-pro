import { createClient } from "@/utils/supabase/server";

export const revalidate = 0; // Ensures it's dynamically fetched

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: pageData } = await supabase.from('site_settings').select('value').eq('key', 'page_contact').single();
  const content = pageData?.value?.content;

  return (
    <main className="pt-32 pb-16 px-container-margin max-w-4xl mx-auto min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">اتصل بنا</h1>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-6">
        {content ? (
          <div className="prose prose-invert max-w-none font-body-base text-on-surface-variant leading-relaxed text-right" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">email</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">البريد الإلكتروني</h3>
                <p className="text-on-surface-variant font-body-base" dir="ltr">support@devaran.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined">phone</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">رقم الهاتف</h3>
                <p className="text-on-surface-variant font-body-base" dir="ltr">+20 100 000 0000</p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
