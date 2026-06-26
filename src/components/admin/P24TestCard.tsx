import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { testP24Connection } from "@/lib/p24-test.functions";
import { Loader2, PlugZap } from "lucide-react";

export function P24TestCard() {
  const test = useServerFn(testP24Connection);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await test({ data: {} as any });
      setResult(r);
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-foreground/10 bg-cream p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Test połączenia z Przelewy24</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Sprawdza, czy POS ID i API Key pasują do siebie (endpoint <code>testAccess</code>).
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-xs uppercase tracking-widest text-cream hover:bg-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          {loading ? "Testuję…" : "Testuj połączenie"}
        </button>
      </div>

      {result && (
        <div className="mt-5 space-y-3">
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
            }`}
          >
            <div className="font-semibold">
              {result.ok ? "✓ Autoryzacja udana" : "✗ Błąd autoryzacji"}
              {typeof result.status === "number" ? ` (HTTP ${result.status})` : ""}
            </div>
            {result.hint && <div className="mt-1">{result.hint}</div>}
            {result.message && <div className="mt-1">{result.message}</div>}
          </div>
          <details className="rounded-xl border border-foreground/10 bg-white p-4 text-xs">
            <summary className="cursor-pointer font-semibold">Szczegóły</summary>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all text-foreground/80">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
