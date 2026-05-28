import { Check, Globe, KeyRound, Cloud, ListChecks } from "lucide-react";

type StepStatus = "ok" | "warn" | "todo" | null;

export function DomainSetupGuide({
  canonicalOk,
  apexRedirects,
  lovableRedirects,
}: {
  canonicalOk: boolean;
  apexRedirects: boolean;
  lovableRedirects: boolean;
}) {
  const steps: {
    icon: typeof Globe;
    title: string;
    body: React.ReactNode;
    status: StepStatus;
  }[] = [
    {
      icon: KeyRound,
      title: "1. Lovable → Publish → Custom domain",
      status: null,
      body: (
        <>
          <p>
            W edytorze Lovable kliknij <strong>Publish</strong> (prawy górny róg) → zakładka{" "}
            <strong>Custom domain</strong> → <strong>Connect domain</strong>. Wpisz{" "}
            <code className="rounded bg-foreground/10 px-1.5 py-0.5">flowharmony.pl</code> i potwierdź.
          </p>
          <p className="mt-2">
            Lovable pokaże dwa rekordy do skopiowania — <strong>A</strong> (dla{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5">@</code>) i{" "}
            <strong>CNAME</strong> (dla <code className="rounded bg-foreground/10 px-1 py-0.5">www</code>).
            Trzymaj to okno otwarte do końca konfiguracji.
          </p>
        </>
      ),
    },
    {
      icon: Cloud,
      title: "2. cyber_Folks → Strefa DNS",
      status: null,
      body: (
        <>
          <p>
            Zaloguj się do <a className="text-terracotta underline" href="https://panel.cyberfolks.pl" target="_blank" rel="noreferrer">panel.cyberfolks.pl</a>{" "}
            → <strong>Domeny</strong> → wybierz <code className="rounded bg-foreground/10 px-1.5 py-0.5">flowharmony.pl</code> → <strong>Strefa DNS</strong>.
          </p>
          <p className="mt-2">
            <strong>Usuń stare rekordy</strong> typu A i CNAME dla{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5">@</code> oraz{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5">www</code> (jeśli wskazują na hosting cyber_Folks).
          </p>
          <p className="mt-2">Następnie dodaj nowe wpisy z Lovable:</p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-foreground/5">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Typ</th>
                  <th className="px-3 py-2 text-left font-semibold">Nazwa</th>
                  <th className="px-3 py-2 text-left font-semibold">Wartość</th>
                  <th className="px-3 py-2 text-left font-semibold">TTL</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-t border-border">
                  <td className="px-3 py-2">A</td>
                  <td className="px-3 py-2">@</td>
                  <td className="px-3 py-2">(IP z panelu Lovable)</td>
                  <td className="px-3 py-2">3600</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">CNAME</td>
                  <td className="px-3 py-2">www</td>
                  <td className="px-3 py-2">(host z panelu Lovable)</td>
                  <td className="px-3 py-2">3600</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-foreground/70">
            ⚠️ Skopiuj wartości <strong>dokładnie</strong> z Lovable — różnią się dla każdego projektu.
          </p>
        </>
      ),
    },
    {
      icon: Globe,
      title: "3. Poczekaj na propagację (10 min – 2h)",
      status: null,
      body: (
        <>
          <p>
            Po zapisaniu rekordów DNS poczekaj 10 min – 2h (czasem do 24h). W panelu Lovable status zmieni się
            z <em>Pending</em> na <strong>Verified</strong>, a certyfikat HTTPS wygeneruje się automatycznie.
          </p>
          <p className="mt-2">
            Możesz sprawdzić propagację na{" "}
            <a className="text-terracotta underline" href="https://dnschecker.org/?dn=www.flowharmony.pl&dt=CNAME" target="_blank" rel="noreferrer">
              dnschecker.org
            </a>{" "}
            — wpisz <code className="rounded bg-foreground/10 px-1 py-0.5">www.flowharmony.pl</code> i typ CNAME.
          </p>
        </>
      ),
    },
    {
      icon: ListChecks,
      title: "4. Weryfikacja w tym panelu",
      status: canonicalOk && apexRedirects && lovableRedirects ? "ok" : "todo",
      body: (
        <>
          <p>Po propagacji wszystkie trzy karty u dołu powinny być zielone:</p>
          <ul className="mt-3 space-y-2">
            <CheckItem ok={canonicalOk} label="www.flowharmony.pl odpowiada z HTTPS" />
            <CheckItem
              ok={apexRedirects}
              label="flowharmony.pl (bez www) przekierowuje 301 na www"
            />
            <CheckItem
              ok={lovableRedirects}
              label="flowharmonypilates.lovable.app przekierowuje 301 na www"
            />
          </ul>
          {!apexRedirects && (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800">
              Jeśli apex nie przekierowuje, sprawdź czy w cyber_Folks rekord A dla{" "}
              <code>@</code> wskazuje na IP Lovable (a nie na starą stronę).
            </p>
          )}
        </>
      ),
    },
    {
      icon: Check,
      title: "5. Google Search Console",
      status: null,
      body: (
        <>
          <p>
            Gdy wszystko świeci na zielono, dodaj domenę w{" "}
            <a className="text-terracotta underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
              Google Search Console
            </a>{" "}
            i prześlij sitemapę:{" "}
            <code className="rounded bg-foreground/10 px-1.5 py-0.5">
              https://www.flowharmony.pl/sitemap.xml
            </code>
          </p>
        </>
      ),
    },
  ];

  return (
    <section className="mb-16 rounded-2xl border border-border bg-background p-8 md:p-10">
      <h2 className="font-display text-3xl">Publikacja & Domain check</h2>
      <p className="mt-2 text-sm text-foreground/80">
        Instrukcja krok po kroku — od podpięcia domeny w cyber_Folks do weryfikacji po propagacji DNS.
      </p>

      <ol className="mt-8 space-y-5">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex gap-4 rounded-xl border p-5 ${
              s.status === "ok"
                ? "border-emerald-600/30 bg-emerald-600/[0.04]"
                : s.status === "todo"
                  ? "border-amber-500/30 bg-amber-500/[0.04]"
                  : "border-border bg-foreground/[0.02]"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                s.status === "ok"
                  ? "bg-emerald-600 text-white"
                  : s.status === "todo"
                    ? "bg-amber-500 text-white"
                    : "bg-foreground text-cream"
              }`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-xl">{s.title}</h3>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85">
                {s.body}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          ok ? "bg-emerald-600 text-white" : "bg-foreground/15 text-foreground/60"
        }`}
      >
        {ok ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className={ok ? "text-foreground" : "text-foreground/70"}>{label}</span>
    </li>
  );
}
