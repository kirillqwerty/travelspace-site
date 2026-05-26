import { useEffect, useState } from "react";

const KEY = "tury_cookie_accepted_v1";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);
  if (!open) return null;
  return (
    <div
      className="fixed bottom-20 lg:bottom-4 left-3 right-3 lg:left-4 lg:right-auto z-30 max-w-md bg-neutral-900 text-white rounded-2xl shadow-xl p-4 sm:p-5"
      data-testid="cookie-banner"
    >
      <p className="text-sm leading-relaxed">
        Мы используем cookies для удобства сайта и аналитики. Продолжая использовать сайт, вы соглашаетесь
        с нашей <a href="/legal" className="underline">политикой</a>.
      </p>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setOpen(false);
          }}
          className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold px-4 py-2"
          data-testid="cookie-accept"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
