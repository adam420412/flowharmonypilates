import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { startCheckout } from "@/lib/payments.functions";

type Props = {
  packageCode: string;
  label?: string;
  className?: string;
};

export function BuyPackageButton({ packageCode, label = "Kup online", className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const checkout = useServerFn(startCheckout);

  const onClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        navigate({ to: "/login", search: { next: `/cennik` } as any });
        return;
      }
      const r = await checkout({ data: { packageCode } });
      window.location.href = r.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się rozpocząć płatności");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center justify-center rounded-full bg-terracotta px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-foreground disabled:opacity-60"
        }
      >
        {loading ? "Przekierowywanie…" : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
