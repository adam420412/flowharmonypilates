import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
import { checkDomainStatus, type CheckResult } from "@/lib/domain-status.functions";
import { DomainSetupGuide } from "./DomainSetupGuide";

type Status = Awaited<ReturnType<typeof checkDomainStatus>>;

export function DomainStatusCard() {
  const check = useServerFn(checkDomainStatus);
  const [data, setData] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await check();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="mb-16 rounded-2xl border border-border bg-background p-8 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Status domeny</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Sprawdzenie DNS, HTTPS i przekierowań 301 z poprzednich adresów na <strong>www.flowharmony.pl</strong>.
          </p>
          {data && (
            <p className="mt-1 text-xs text-foreground/60">
              Ostatnie sprawdzenie: {new Date(data.checkedAt).toLocaleString("pl-PL")}
            </p>
          )}
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-xs uppercase tracking-widest transition hover:bg-foreground hover:text-cream disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Odśwież
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Nie udało się wykonać sprawdzenia: {error}
        </div>
      )}

      {loading && !data && (
        <div className="mt-8 flex items-center gap-3 text-sm text-foreground/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Sprawdzanie…
        </div>
      )}

      {data && (
        <div className="mt-8 grid gap-4">
          <CheckRow result={data.canonical} kind="canonical" />
          <CheckRow result={data.apex} kind="redirect" />
          <CheckRow result={data.lovable} kind="redirect" />
        </div>
      )}

      <div className="mt-8 rounded-lg border border-border bg-foreground/[0.02] p-5 text-xs leading-relaxed text-foreground/75">
        <p className="font-semibold uppercase tracking-widest text-foreground/80">Co oznaczają wskaźniki?</p>
        <ul className="mt-3 space-y-1.5">
          <li><strong>DNS / HTTP</strong> – serwer odpowiada na zapytanie (kod 2xx).</li>
          <li><strong>HTTPS</strong> – certyfikat SSL aktywny i poprawny.</li>
          <li><strong>Przekierowanie</strong> – stary adres przekierowuje na www.flowharmony.pl (301).</li>
        </ul>
      </div>
    </section>
  );
}

function CheckRow({ result, kind }: { result: CheckResult; kind: "canonical" | "redirect" }) {
  const allGood =
    result.ok &&
    result.https &&
    (kind === "canonical" || result.redirectsToCanonical === true);

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {allGood ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <h3 className="font-display text-xl">{result.label}</h3>
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-foreground/70 hover:text-terracotta"
          >
            {result.url} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-foreground/60">Status</div>
          <div className="font-display text-2xl">
            {result.status ?? "—"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Badge
          ok={result.ok}
          label="DNS / HTTP"
          detail={result.error ?? (result.ok ? "Odpowiada" : `Kod ${result.status ?? "—"}`)}
        />
        <Badge
          ok={result.https}
          label="HTTPS / SSL"
          detail={result.https ? "Certyfikat OK" : "Brak HTTPS"}
          icon={result.https ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
        />
        {kind === "canonical" ? (
          <Badge ok={true} label="Domena" detail="Główna (canonical)" />
        ) : (
          <Badge
            ok={result.redirectsToCanonical === true}
            label="Przekierowanie 301"
            detail={
              result.redirectsToCanonical
                ? `→ ${new URL(result.finalUrl!).hostname}`
                : result.finalUrl
                  ? `Trafia na ${new URL(result.finalUrl).hostname}`
                  : "Brak"
            }
          />
        )}
      </div>
    </div>
  );
}

function Badge({
  ok,
  label,
  detail,
  icon,
}: {
  ok: boolean;
  label: string;
  detail: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        ok
          ? "border-emerald-600/30 bg-emerald-600/5"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-foreground/70">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 text-sm font-medium ${ok ? "text-emerald-700" : "text-destructive"}`}>
        {ok ? "OK" : "Błąd"}
      </div>
      <div className="text-xs text-foreground/70 truncate">{detail}</div>
    </div>
  );
}
