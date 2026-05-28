import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "fh-cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setShow(true);
    } catch {
      // localStorage may be unavailable (incognito)
    }
  }, []);

  function persist(choice: "all" | "necessary") {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-foreground/10 bg-cream/95 p-5 shadow-xl backdrop-blur md:inset-x-6 md:bottom-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-foreground/85">
          Używamy plików cookies, żeby strona działała poprawnie. Szczegóły w{" "}
          <Link to="/polityka-prywatnosci" className="text-terracotta underline-offset-4 hover:underline">
            polityce prywatności
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => persist("necessary")}
            className="rounded-full border border-foreground/30 px-4 py-2 text-xs uppercase tracking-widest text-foreground hover:bg-foreground/5"
          >
            Tylko niezbędne
          </button>
          <button
            type="button"
            onClick={() => persist("all")}
            className="rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-cream hover:bg-foreground/90"
          >
            Akceptuję
          </button>
        </div>
      </div>
    </div>
  );
}
