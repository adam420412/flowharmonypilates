## Co jest teraz w panelu

- Ustawienia studia (godziny do anulowania itp.)
- Dodawanie zajęć (z powtarzaniem co tydzień)
- Lista nadchodzących zajęć — edycja miejsc/instruktorki, odwoływanie/przywracanie
- Test powiadomień (awans z listy rezerwowej)

## Propozycje do dodania

### 1. Klientki (CRM) — priorytet wysoki
- Lista wszystkich klientek (imię, telefon, e-mail, liczba rezerwacji, ostatnia wizyta, opt-in SMS)
- Szukajka + filtry (aktywne, nowe, nieaktywne >30 dni)
- Karta klientki: historia rezerwacji, statystyki, notatki admina
- Ręczne dodanie/edycja telefonu, oznaczenie VIP
- Eksport CSV

### 2. Rezerwacje — przegląd globalny
- Tabela wszystkich rezerwacji (filtr: zajęcia, data, status, klientka)
- Ręczne dodanie rezerwacji za klientkę (np. zapis telefoniczny)
- Ręczne przeniesienie z listy rezerwowej / zamiana miejsc
- Anulowanie pojedynczej rezerwacji z powodem

### 3. Grafik — widok kalendarza
- Tygodniowy/miesięczny widok (zamiast samej listy)
- Drag & drop do zmiany godziny/instruktorki
- Szybki podgląd obłożenia (kolory: wolne / pełne / odwołane)
- Duplikowanie tygodnia (skopiuj cały tydzień do przodu)

### 4. Typy zajęć i instruktorki
- CRUD typów zajęć (slug, nazwa, opis, kolor, czas, domyślny limit)
- CRUD instruktorek (imię, bio, zdjęcie, aktywna/nieaktywna, kolejność)
- Włącz/wyłącz typ zajęć bez kasowania

### 5. Dashboard / statystyki
- KPI na górze: zajęcia w tym tygodniu, rezerwacje, obłożenie %, lista rezerwowa
- Wykres obłożenia w czasie (ostatnie 4/12 tygodni)
- Top klientki (najwięcej rezerwacji)
- Najczęściej odwoływane sloty / godziny martwe

### 6. Komunikacja
- Wysyłka SMS/e-mail do uczestniczek konkretnych zajęć (np. „spóźnię się 10 min")
- Newsletter / ogłoszenie do wszystkich z opt-in
- Szablony wiadomości (potwierdzenie, przypomnienie, odwołanie)
- Historia powiadomień (już jest tabela `notification_log` — pokazać UI)

### 7. Uprawnienia / zespół
- Lista użytkowniczek z rolami (admin / klientka)
- Nadawanie roli admin innej osobie (np. instruktorka jako admin)
- Log akcji admina (kto co zmienił i kiedy)

### 8. Operacyjne drobiazgi
- Dni wolne / urlop (blokada zakresu dat — kasuje/oznacza zajęcia)
- Globalna pauza rezerwacji (np. remont)
- Komunikat na stronie głównej (banner edytowalny z panelu)
- Galeria / sekcje strony edytowalne (CMS-lite)

### 9. Raporty
- Eksport rezerwacji do CSV (zakres dat)
- Raport miesięczny: liczba zajęć, frekwencja, anulowania
- Raport per instruktorka

### 10. Ustawienia studia — rozbudowa
- Adres, telefon, e-mail kontaktowy (używane na stronie)
- Linki social media
- Logo i kolory marki (bez kodu)
- Polityka anulowania — edytowalny tekst pokazywany klientkom

## Co polecam zrobić najpierw

Trzy najbardziej wartościowe rzeczy z perspektywy codziennej obsługi studia:

1. **Klientki (CRM) + Rezerwacje globalne** — bez tego trudno reagować na telefony
2. **Widok kalendarza grafiku** — szybciej się ogarnia tydzień niż w liście
3. **Dashboard z KPI** — od razu widać czy tydzień się zapełnia

Powiedz które z tych obszarów (lub własny wybór) wdrażamy — wtedy zrobię szczegółowy plan dla konkretnego.