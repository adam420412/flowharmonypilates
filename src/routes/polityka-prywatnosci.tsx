import { createFileRoute } from "@tanstack/react-router";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/polityka-prywatnosci")({
  head: () => ({
    meta: [
      { title: "Polityka prywatności — Flow & Harmony" },
      { name: "description", content: "Polityka prywatności i zasady przetwarzania danych osobowych w studio Pilates Flow & Harmony, Poznań." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />
      <article className="prose prose-stone mx-auto max-w-3xl px-6 pb-20 pt-32 md:px-10 md:pt-40">
        <span className="text-xs uppercase tracking-widest text-mocha">Dokumenty</span>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Polityka prywatności</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ostatnia aktualizacja: 28 maja 2026</p>

        <h2 className="mt-10">1. Administrator danych</h2>
        <p>
          Administratorem danych osobowych jest <strong>Fites Joanna Konieczna</strong> (Flow &amp; Harmony Studio Pilates),
          ul. Piotrowska 3, 62-353 Poznań, NIP: <strong>7822224858</strong>. Kontakt:{" "}
          <a href="mailto:joanna@flowharmony.pl">joanna@flowharmony.pl</a>, tel. +48 501 817 979.
        </p>


        <h2 className="mt-8">2. Jakie dane zbieramy</h2>
        <ul>
          <li><strong>Konto i rezerwacje:</strong> imię i nazwisko, adres e-mail, numer telefonu, historia rezerwacji.</li>
          <li><strong>Formularz kontaktowy:</strong> imię, e-mail, treść wiadomości.</li>
          <li><strong>Logi techniczne:</strong> adres IP, typ przeglądarki, czas wizyty (anonimowo, do celów bezpieczeństwa).</li>
        </ul>

        <h2 className="mt-8">3. Cel i podstawa prawna</h2>
        <ul>
          <li>Realizacja umowy o świadczenie zajęć Pilates — art. 6 ust. 1 lit. b RODO.</li>
          <li>Wystawienie dokumentów księgowych — art. 6 ust. 1 lit. c RODO.</li>
          <li>Komunikacja w sprawie rezerwacji i listy rezerwowej — art. 6 ust. 1 lit. f RODO.</li>
          <li>Marketing (newsletter, oferty) — wyłącznie po wyrażeniu zgody, art. 6 ust. 1 lit. a RODO.</li>
        </ul>

        <h2 className="mt-8">4. Okres przechowywania</h2>
        <p>
          Dane konta i rezerwacji przechowujemy przez czas trwania umowy oraz 5 lat po jej zakończeniu
          (wymóg podatkowy). Wiadomości z formularza kontaktowego — 12 miesięcy. Zgody marketingowe —
          do odwołania.
        </p>

        <h2 className="mt-8">5. Odbiorcy danych</h2>
        <ul>
          <li>Lovable Cloud / Supabase — dostawca infrastruktury bazy danych i hostingu (UE).</li>
          <li>Operator domeny i hostingu (cyber_Folks S.A.).</li>
          <li>Operator płatności (Stripe Inc., gdy zostanie uruchomiony moduł płatności online).</li>
          <li>Biuro rachunkowe — w zakresie wymaganym przepisami prawa.</li>
        </ul>

        <h2 className="mt-8">6. Twoje prawa</h2>
        <p>Masz prawo do: dostępu do swoich danych, sprostowania, usunięcia, ograniczenia przetwarzania,
        przenoszenia danych, sprzeciwu, cofnięcia zgody w dowolnym momencie oraz wniesienia skargi do
        Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).</p>

        <h2 className="mt-8">7. Pliki cookies</h2>
        <p>
          Strona używa wyłącznie niezbędnych plików cookies (sesja użytkownika, zapamiętanie zgody na
          cookies). Nie korzystamy z cookies marketingowych ani profilujących bez Twojej zgody.
        </p>

        <h2 className="mt-8">8. Kontakt</h2>
        <p>
          W sprawach związanych z ochroną danych osobowych pisz na adres{" "}
          <a href="mailto:joanna@flowharmony.pl">joanna@flowharmony.pl</a>.
        </p>
      </article>
      <Footer />
    </div>
  );
}
