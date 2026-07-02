import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full mt-section-gap bg-surface-container-lowest border-t border-white/5">
      <div className="flex flex-col items-center py-16 px-container-margin gap-8 w-full max-w-7xl mx-auto">
        <span className="font-display-lg text-display-lg-mobile text-primary">CORE</span>
        <div className="flex gap-8">
          <Link href="/contact" className="font-label-caps text-on-surface-variant hover:text-primary transition-colors">
            اتصل بنا
          </Link>
          <Link href="/terms" className="font-label-caps text-on-surface-variant hover:text-primary transition-colors">
            الشروط والأحكام
          </Link>
          <Link href="/privacy" className="font-label-caps text-on-surface-variant hover:text-primary transition-colors">
            سياسة الخصوصية
          </Link>
        </div>
        <p className="font-body-base text-on-surface-variant text-center" dir="ltr">
          © {new Date().getFullYear()} جميع الحقوق محفوظة ل Dev Aran
        </p>
      </div>
    </footer>
  );
}
