import { createFileRoute } from "@tanstack/react-router";
import { Navigation } from "@/components/site/Navigation";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: [
      { title: "Regulamin studia — Flow & Harmony" },
      { name: "description", content: "Regulamin korzystania ze studia Pilates Flow & Harmony w Kamionkach — zasady rezerwacji, odwołań i bezpieczeństwa." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-cream text-foreground">
      <Navigation />
      <article className="prose prose-stone mx-auto max-w-3xl px-6 pb-20 pt-32 md:px-10 md:pt-40">
        <span className="text-xs uppercase tracking-widest text-mocha">Dokumenty</span>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Regulamin studia</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ostatnia aktualizacja: 28 maja 2026</p>

        <h2 className="mt-10">§ 1. Postanowienia ogólne</h2>
        <p>
          Studio Flow &amp; Harmony prowadzone jest przez <strong>Fites Joanna Konieczna</strong>,
          ul. Piotrowska 3, 62-353 Poznań, NIP: <strong>7822224858</strong>. Studio oferuje zajęcia
          Pilates na reformerach w grupach do 4 osób, sesje indywidualne i duo oraz treningi na Cadillacu.
        </p>


        <h2 className="mt-8">§ 2. Rezerwacje</h2>
        <ul>
          <li>Rezerwacji dokonuje się przez stronę internetową po założeniu bezpłatnego konta.</li>
          <li>Każda osoba zapisana na zajęcia zobowiązana jest do potwierdzenia obecności poprzez
          przybycie najpóźniej 5 minut przed rozpoczęciem.</li>
          <li>W przypadku zajęć grupowych obowiązuje lista rezerwowa — w razie zwolnienia miejsca
          system automatycznie zapisuje pierwszą osobę z listy.</li>
        </ul>

        <h2 className="mt-8">§ 3. Odwołania i karnety</h2>
        <ul>
          <li>Bezpłatne odwołanie rezerwacji możliwe jest najpóźniej na 12 godzin przed zajęciami.</li>
          <li>Późniejsze odwołanie lub nieobecność oznacza utratę wejścia z karnetu / pełną opłatę za sesję.</li>
          <li>Karnety są imienne i nie podlegają zwrotowi po wykupieniu.</li>
          <li>Karnety mają określoną datę ważności — niewykorzystane wejścia po terminie przepadają.</li>
        </ul>

        <h2 className="mt-8">§ 4. Bezpieczeństwo i higiena</h2>
        <ul>
          <li>Na zajęcia obowiązuje strój sportowy i skarpetki antypoślizgowe (dostępne w studio).</li>
          <li>Każdy uczestnik zobowiązany jest poinformować instruktora o przeciwwskazaniach zdrowotnych,
          ciąży lub urazach przed rozpoczęciem zajęć.</li>
          <li>Studio nie odpowiada za rzeczy pozostawione w szatni bez zabezpieczenia.</li>
        </ul>

        <h2 className="mt-8">§ 5. Płatności</h2>
        <p>
          Płatności za karnety i pojedyncze wejścia realizowane są przelewem, kartą lub w gotówce w studio.
          Po uruchomieniu modułu płatności online (Stripe) możliwa będzie również płatność na stronie.
        </p>

        <h2 className="mt-8">§ 6. Reklamacje</h2>
        <p>
          Reklamacje należy zgłaszać na adres{" "}
          <a href="mailto:joanna@flowharmony.pl">joanna@flowharmony.pl</a> w ciągu 14 dni
          od zaistnienia zdarzenia. Odpowiedź otrzymasz w ciągu 14 dni roboczych.
        </p>

        <h2 className="mt-8">§ 7. Postanowienia końcowe</h2>
        <p>
          Studio zastrzega sobie prawo do zmiany regulaminu — aktualna wersja jest zawsze dostępna na
          niniejszej stronie. W sprawach nieuregulowanych obowiązują przepisy Kodeksu cywilnego.
        </p>
      </article>
      <Footer />
    </div>
  );
}
