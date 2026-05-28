## Cel
Oddać Joannie funkcjonującą stronę: czysty ekran logowania, ostateczne konto administratora, kompletny pakiet prawny (RODO), działający formularz kontaktowy z powiadomieniem oraz płatności online za karnety.

---

## 1. Czyszczenie ekranu logowania i kont testowych

**Co znika z UI** (`src/routes/login.tsx`, linie 105–126):
- ramka „Konta testowe" z widocznymi loginami i hasłami,
- przyciski „Wypełnij".

**Co dzieje się w bazie:**
- usuwam użytkownika `klient@flowharmony.test` (z `auth.users` — kaskada usuwa `profiles`, `user_roles`, `bookings`),
- tworzę użytkownika `joanna@flowharmony.pl` z rolą `admin` i hasłem startowym, które podasz w bezpiecznym oknie sekretów po zatwierdzeniu planu,
- usuwam stare `admin@flowharmony.test`,
- jako fallback dodaję na ekranie /login link **„Zapomniałeś hasła?"** (patrz punkt 2), żeby Joanna mogła zresetować hasło w razie utraty.

**Końcowe dane logowania (do przekazania Joannie):**
- E-mail: **joanna@flowharmony.pl**
- Hasło: **ustawisz je sam w okienku po zatwierdzeniu planu** (zalecam min. 12 znaków, mix wielkich/małych liter, cyfra, znak specjalny). Hasło nie pojawia się w kodzie, czacie ani repo.

---

## 2. Reset hasła („Zapomniałem hasła")

- Nowa publiczna trasa **`/zapomnialem-hasla`** — formularz z polem e-mail, wywołuje `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/reset-hasla" })`.
- Nowa publiczna trasa **`/reset-hasla`** — formularz nowego hasła, wywołuje `supabase.auth.updateUser({ password })` po wykryciu `type=recovery` w URL.
- Link **„Zapomniałeś hasła?"** na `/login` pod formularzem.
- Wymaga aktywnego nadawcy e-mail (Lovable Email Domain). Jeśli domena `notify.flowharmony.pl` nie jest jeszcze skonfigurowana, pokażę okno konfiguracji — to jednorazowy krok DNS w cyber_Folks.

---

## 3. RODO: polityka, regulamin, cookies

**Nowe statyczne trasy:**
- `/polityka-prywatnosci` — przetwarzanie danych zgodnie z RODO, kontakt do ADO (Flow & Harmony, NIP/adres do uzupełnienia), cele przetwarzania (rezerwacje, marketing opt-in), prawa użytkownika, dane retencji, info o Lovable Cloud / Supabase jako podmiocie przetwarzającym.
- `/regulamin` — regulamin rezerwacji zajęć (zasady odwołań — już mamy `cancellation_hours_before`, brak zwrotów za niewykorzystane karnety, BHP w studio).
- **Banner cookies** (komponent `<CookieConsent />`) — minimalny: dwa przyciski „Akceptuję wszystkie" / „Tylko niezbędne", trzyma wybór w `localStorage`, blokuje skrypty analityczne (na razie nie używamy, ale przygotowane).
- Linki do polityki/regulaminu w stopce.

> Treści napiszę po polsku jako rozsądny szablon — Joanna powinna je przeczytać i ewentualnie poprawić dane firmy.

---

## 4. Formularz kontaktowy → baza + e-mail do Joanny

- Nowa tabela **`contact_messages`** (id, name, email, phone, message, status, created_at) z RLS: insert dla `anon`+`authenticated`, select/update tylko dla admina.
- Endpoint zapisuje wiadomość przez `createServerFn` z walidacją zod (długości, sanityzacja).
- Po zapisie wysyłany jest e-mail do Joanny przez Lovable Email (transactional template).
- W panelu admina nowa zakładka **„Wiadomości"** z listą i statusem przeczytane/odpowiedziane.

Wymaga email domain (ten sam co reset hasła — robimy raz).

---

## 5. Płatności online za karnety (Stripe)

**Zakres MVP, żeby nie blokować oddania:**
- Włączamy **Lovable Stripe Payments** (built-in, bez konieczności konta Stripe na start — najpierw środowisko testowe).
- Nowy katalog karnetów w bazie (`packages`: 1 wejście, karnet 4, karnet 8, miesięczny open) — Joanna potwierdza ceny przed włączeniem.
- Strona **`/karnety`** (lub sekcja na `/cennik`) z przyciskiem „Kup karnet" → Stripe Checkout.
- Webhook `/api/public/stripe-webhook` zapisuje zakup do nowej tabeli `user_packages` (user_id, package_id, entries_left, expires_at, status).
- Przy rezerwacji zajęć decrement `entries_left`; przy anulowaniu w terminie — zwrot wejścia.
- W panelu admina lista zakupów i ręczne dodawanie karnetu (off-line zakupy).

> Stripe to największy kawałek — jeśli chcesz **najpierw oddać stronę bez płatności**, mogę zrobić punkty 1–4 teraz i Stripe w osobnej iteracji. Daj znać w komentarzu po przeczytaniu planu, jeśli wolisz tak.

---

## Szczegóły techniczne

- Migracje SQL: `contact_messages` + RLS + GRANT-y, `packages` + `user_packages` + RLS + GRANT-y.
- Server functions: `submitContactMessage`, `createCheckoutSession`, `markMessageRead`, `addManualPackage`.
- Server route: `src/routes/api/public/stripe-webhook.ts` z weryfikacją podpisu Stripe.
- Edycje: `src/routes/login.tsx` (usunięcie panelu testowych kont + link reset), `src/components/site/Navigation.tsx` lub stopka (linki do polityki/regulaminu), `src/routes/_authenticated/admin.tsx` (zakładki Wiadomości, Karnety).
- Nowe komponenty: `CookieConsent`, `ContactForm` refactor (jeśli istnieje), `PackagesGrid`.
- Sekrety: hasło początkowe Joanny, `STRIPE_*` (obsłużone przez Lovable Stripe automatycznie po włączeniu).

---

## Kolejność wykonania
1. Migracje DB (admin user, usunięcie testowych, contact_messages, packages, user_packages).
2. UI: czyszczenie /login, link reset hasła, dwie trasy resetu.
3. Strony prawne + cookies banner + linki w stopce.
4. Email domain → formularz kontaktowy z powiadomieniem.
5. Stripe Payments → katalog → checkout → webhook → integracja z rezerwacjami.
6. Smoke test: logowanie Joanny, reset hasła, wysłanie wiadomości, zakup testowego karnetu, rezerwacja z dekrementem.

Po zatwierdzeniu pokażę okno do wpisania **hasła startowego dla joanna@flowharmony.pl**, a potem lecę punkt po punkcie.
