# Handoff: DJ Cockpit — Management-Web-App für DJ / Producer

## Überblick

Eine mobile Web-App, mit der ein DJ und Producer den Überblick über vier Bereiche behält:
Bookings, Content, Analytics und Releases. Dazu kommen ein Screenshot-Import, der
Plattform-Zahlen aus Bildern ausliest, und ein Claude-Panel, das aus einem Prompt
einen Content-Plan baut und die Vorschläge einzeln in den Kalender schreibt.

Zielnutzer ist eine Person, kein Team. Die App ist ein persönliches Cockpit, kein CRM.
Primäres Gerät ist das Handy (390 × 844 px Designbreite), die App soll aber im
Desktop-Browser genauso laufen.

## Über die Design-Dateien

Die HTML-Dateien in diesem Bundle sind **Design-Referenzen**, keine Produktionsdateien.
Sie zeigen Aussehen und Verhalten vollständig und klickbar, sind aber als ein einziges
Prototyp-File gebaut und haben keine Datenhaltung.

Aufgabe ist es, diese Designs im Zielprojekt **nachzubauen** — mit dessen Framework,
Komponenten und Konventionen. Wenn noch kein Projekt existiert: Next.js (App Router) +
TypeScript + Tailwind + Supabase ist für diesen Fall eine sinnvolle Wahl, weil Auth,
Postgres und File-Storage mitkommen und der Betrieb für eine Einzelperson fast nichts
kostet. Der Prototyp ist bewusst ohne Framework-Bindung geschrieben.

## Fidelity

**High-fidelity.** Farben, Typografie, Abstände, Zustände und Copy sind final.
Die UI soll pixelgenau nachgebaut werden. Alle Werte stehen unten unter „Design-Tokens“.
Inhalte (Gigs, Zahlen, Namen) sind Beispieldaten und werden durch echte Daten ersetzt.

## Aufbau der Navigation

Feste Tab-Bar unten mit sechs Einträgen (Reihenfolge fix):

| Tab | Label | Screen |
|---|---|---|
| 0 | ÜBERBLICK | Dashboard |
| 1 | BOOKINGS | Gig-Liste + Advance-Sheet |
| 2 | CONTENT | Wochenstreifen + Content-Pipeline |
| 9 | RELEASES | Release-Übersicht |
| 3 | ZAHLEN | Analytics + Trends + Post-Detail |
| 4 | CLAUDE | AI-Planer |

Drei weitere Screens haben keinen Tab und werden über Kacheln auf dem Dashboard
erreicht, mit Zurück-Pfeil links im Header:

| Tab | Label | Screen |
|---|---|---|
| 5 | FINANZEN | Kennzahlen, Rechnungen, Einnahmequellen |
| 6 | KONTAKTE | Suche + gruppierte Liste |
| 7 | TOUR & LOGISTIK | Reise-Ablauf + Rider-Check |
| 8 | SCREENSHOT-IMPORT | Import-Flow in vier Schritten |

Header (56 px) zeigt links Datum (8,5 px, letter-spacing .2em, 40 % Weiß) und darunter
den Screen-Titel (17 px, 600). Rechts ein Avatar-Kreis 34 × 34 px, 1 px Rahmen 20 % Weiß,
Initialen 10,5 px / 700. Bei den vier Unter-Screens erscheint links ein 30 × 30 px
Zurück-Button mit „←“.

Über dem Header eine gefakte Status-Bar (44 px): Uhrzeit links, „5G“ + Akku-Rechteck
(20 × 9 px, 70 % gefüllt) rechts. Im echten Build entfällt sie — sie gehört nur zum
Prototyp-Rahmen.

---

## Screens im Detail

### 0 — ÜBERBLICK (Dashboard)

Zweck: die Fragen „was steht als Nächstes an“ und „was ist offen“ in einem Blick.

Aufbau, von oben, `flex-direction: column; gap: 20px`, Padding 16 px 20 px 26 px:

1. **Nächster-Gig-Karte.** Rahmen 1 px `rgba(230,230,230,.55)`, Hintergrund
   `rgba(230,230,230,.04)`, Padding 16 px, Radius 4 px. Zeile 1: Label „NÄCHSTER GIG“
   (8,5 px, .22em) und rechts „T−7“. Dann Venue 24 px / 600 / -.03em in Großbuchstaben,
   darunter „BERLIN / FR 04.09 / 02:00–04:00“ (11,5 px, 60 % Weiß). Unten zwei Buttons
   im `flex; gap: 8px`: „RIDER SENDEN“ (gefüllt `#E6E6E6`, Text `#0E0F0E`, 11 px / 700)
   und „LOGISTIK“ (nur Rahmen, führt zu Tab 7).
2. **Drei-Spalten-Kennzahlen** in einem gemeinsamen Rahmen mit 1 px Trennlinien:
   GIGS Q4 = 11, HÖRER = 84k, POSTS OFFEN = 06. Label 8 px / .16em / 42 % Weiß,
   Wert 20 px / 600 / -.03em.
3. **Release-Countdown.** Label-Zeile „RELEASE“ + „T−29“. Karte mit Titel
   „EP „NACHTFORM““ (15 px / 600), Untertitel „VÖ 26.09 · 4 TRACKS“, rechts ein
   46 × 46 px Cover-Platzhalter (diagonale Streifen, siehe Assets). Darunter ein
   Segment-Balken: 13 Segmente à 6 px Höhe, `gap: 3px`, erledigte gefüllt `#E6E6E6`,
   offene transparent, alle mit 1 px Rahmen 20 % Weiß. Beschriftung „8 / 13 AUFGABEN“.
4. **Offene Aufgaben.** Liste in einem Rahmen, Zeilen 13 px 14 px, Trennlinie 8 % Weiß.
   Jede Zeile: Checkbox 15 × 15 px (1 px Rahmen 35 % Weiß; wenn erledigt Fläche
   `#E6E6E6` und ein 8,5 px „✓“ in `#0E0F0E`), Text 11,5 px, rechts Fälligkeit
   8,5 px / .12em / 35 % Weiß. Erledigt = Text 35 % Weiß + `line-through`.
   Antippen togglet — das ist echter State, keine Attrappe.
5. **Modul-Kacheln.** Grid 3 Spalten, `gap: 8px`: FINANZEN (3.400 € / OFFEN),
   KONTAKTE (42 / 2 NEU), TOUR (KÖLN / 26.09). Darunter eine über drei Spalten
   gespannte Zeile „SCREENSHOT IMPORTIEREN“ mit „＋“ rechts.
6. **Claude-Hinweis.** Gestrichelter Rahmen `rgba(230,230,230,.32)`, links ein 7 × 7 px
   Quadrat mit `blink`-Animation (1,8 s), Text „CLAUDE HAT EINEN WOCHENPLAN“ +
   „6 Posts bis zum Release · antippen“, rechts „›“. Führt zu Tab 4.

### 1 — BOOKINGS

Filter-Segmented oben: ALLE / BESTÄTIGT / ANGEFRAGT. Ein gemeinsamer Rahmen,
1 px Trennlinien zwischen den Segmenten, aktives Segment gefüllt `#E6E6E6` mit
Text `#0E0F0E`, inaktiv transparent mit Text 55 % Weiß. Höhe 9 px Padding, 9,5 px / 600 / .12em.

Darunter eine Meta-Zeile: „06 TERMINE“ links, „GAGE ∑ 8.000 €“ rechts (Summe der
gefilterten Liste, `toLocaleString('de-DE')`).

Gig-Zeilen, getrennt durch 1 px Linien (kein Karten-Look):
Datumsblock links 40 px breit, zentriert: Wochentag 8 px / .14em / 40 % Weiß,
Tag 19 px / 700, Monat 8 px / .14em. Dann eine 1 px Vertikallinie. Mitte: Venue
13 px / 600 mit `text-overflow: ellipsis`, darunter „STADT · ZEIT“ 9,5 px / .1em / 50 % Weiß.
Rechts: Status-Chip (siehe Chip-System) und Gage 10 px / 60 % Weiß.
Gigs mit Status „Option“ werden mit `opacity: .6` gedämpft.

**Advance-Sheet** (Bottom-Sheet, öffnet bei Tap auf eine Zeile):
`position: absolute; inset: 0`, Backdrop `rgba(4,5,4,.75)` mit `fadeIn` 180 ms,
Sheet unten angedockt, Hintergrund `#131413`, Rahmen oben 1 px 20 % Weiß,
`max-height: 88%`, `overflow-y: auto`, Animation `sheetUp` 260 ms
`cubic-bezier(.2,.9,.2,1)`. Wichtig: alle direkten Kinder brauchen `flex: none`,
sonst schrumpfen sie statt zu scrollen.
Inhalt: Griff 36 × 3 px, Venue 19 px / 600 + Untertitel, Status-Chip rechts, dann
eine Key-Value-Liste (Key 8 px / .16em / 40 % Weiß, 70 px breit; Value 11,5 px):
GAGE, KONTAKT, TECHNIK, HOTEL, ANREISE. Unten „ADVANCE BESTÄTIGEN“ (gefüllt) und
„SCHLIESSEN“ (Rahmen).
Das Sheet schließt bei Backdrop-Tap, bei „SCHLIESSEN“ **und bei jedem Tab-Wechsel**.

### 2 — CONTENT

**Wochenstreifen**: sieben gleich breite Spalten in einem Rahmen, 1 px Trennlinien.
Pro Tag: Kürzel 8 px / 45 % Weiß, Tagesnummer 12 px / 700, darunter bis zu zwei
4 × 4 px Punkte (erster gefüllt `#E6E6E6`, weitere nur Rahmen) als Post-Marker.
Heutiger Tag: Spaltenhintergrund `rgba(230,230,230,.09)`.

**Pipeline** in drei Gruppen: HEUTE, DIESE WOCHE, GEPLANT. Gruppentitel 9 px / .2em /
45 % Weiß mit Anzahl daneben. Post-Karte: Rahmen 1 px 11 % Weiß, Radius 4 px,
Padding 12 px 13 px, links ein 36 × 46 px Medien-Platzhalter, dann Plattform
8 px / .16em + Uhrzeit 8 px / 35 % Weiß, darunter der Text 11,5 px / 1.45,
rechts ein Status-Chip (FERTIG / IN ARBEIT / ENTWURF / IDEE).

Abschluss: gestrichelte Zeile „LÜCKEN MIT CLAUDE FÜLLEN“ → Tab 4.

### 9 — RELEASES

Der wichtigste neue Screen. Von oben:

1. **Hero-Karte** mit Rahmen 55 % Weiß und Hintergrund 4 % Weiß, zweigeteilt:
   oben links „AKTUELLER RELEASE“ (8 px / .22em), Titel 25 px / 600 / -.04em,
   Untertitel „EP · 4 TRACKS · HALLENFORM“ (10 px / .06em). Rechts die Restzeit als
   **40 px / 700** Zahl mit „TAGE“ darunter (8 px / .2em). Unten, abgetrennt durch
   1 px Linie, ein Zwei-Spalten-Block: VERÖFFENTLICHUNG „SA 26.09.2026“ und
   STATUS „AUF KURS“ / „IM VERZUG“ (berechnet, siehe State).
2. **Zeitstrahl.** Label-Zeile „ZEITSTRAHL“ + „01.08 → 26.09“. In der Karte ein
   `position: relative` Container mit 16 px Kopf-Padding:
   - eine 26 px hohe Leiste aus fünf Segmenten mit prozentualen Breiten
     (22 / 18 / 26 / 20 / 14 %), 1 px Rahmen 16 % Weiß, Trennlinien rechts.
     Erledigte Phase gefüllt `rgba(230,230,230,.85)` mit Nummer in `#0E0F0E`;
     laufende Phase `rgba(230,230,230,.22)` mit Nummer in `#E6E6E6`;
     kommende transparent mit Nummer 40 % Weiß.
   - eine vertikale Heute-Linie: `position: absolute; left: 34%; top: 0; bottom: -22px;
     width: 1px; background: #E6E6E6`, darüber das Label „HEUTE“ 7,5 px / .14em,
     `transform: translateX(-50%)`, Hintergrund `#0E0F0E` mit 4 px Seiten-Padding,
     damit es die Linie überdeckt.
   - unter der Leiste die Phasennamen, gleiche prozentuale Breiten, 7,5 px / 40 % Weiß.
   Die 34 % sind im Prototyp fix; im Build wird die Position aus
   `(heute − start) / (VÖ − start)` berechnet, ebenso die Segmentbreiten aus den
   Phasen-Zeiträumen.
3. **Status-Grid**, 2 × 2 in einem Rahmen: PRE-SAVES 412 (ZIEL 1.000),
   PLAYLIST-PITCH 0 / 3 (FRIST 05.09), TEASER FERTIG 0 / 3 (AB 31.08),
   BUDGET 640 € (VON 1.200 €). Label 8 px / .16em, Wert 17 px / 600, Sub 8 px / 40 %.
4. **Phasen.** Fünf Blöcke. Kopfzeile: Nummer 9 px / 700, Name 11 px / 600 / .08em,
   rechts „2/3 · LÄUFT“ (Fortschritt + Zeitraum) 8,5 px. Abgeschlossene Phase:
   Kopf gefüllt `rgba(230,230,230,.9)` mit Text `#0E0F0E`. Laufende Phase:
   Kopf `rgba(230,230,230,.07)`, Block-Rahmen auf 45 % Weiß hochgezogen.
   Kommende Phase: Kopf transparent, Rahmen 11 % Weiß.
   Darunter die Aufgaben als Checkbox-Zeilen wie auf dem Dashboard, togglebar.
5. **Tracks.** Zeilen mit Seiten-Kürzel (A1/A2/B1/B2), Titel, Länge und Status-Chip
   (MASTER / REVISION / OFFEN).
6. **Assets.** Zeilen mit „✓“ oder „·“ als Marker, Text und rechts Datum bzw. „FEHLT“.
   Kopfzeile zeigt „5 / 6 FERTIG“.
7. **Externe Deadlines.** Datum 44 px breit, Aufgabe, Zuständige/r als Untertitel,
   rechts Chip (MORGEN gefüllt / OFFEN Rahmen / ERLEDIGT gedämpft).
8. **Weitere Releases.** 34 × 34 px Cover-Platzhalter, Titel, Untertitel mit
   Ergebniszahlen, rechts Datum und Chip (PLANUNG / ERSCHIENEN).
9. Gestrichelte Zeile „PLAN MIT CLAUDE ÜBERARBEITEN“ → Tab 4.

### 3 — ZAHLEN

1. **Zeitraum-Segmented**: 7 T / 30 T / 90 T, gleiche Mechanik wie der Booking-Filter.
   Wechsel tauscht Reichweite, Delta, Achsenbeschriftung und die Balkenanzahl
   (7 / 14 / 18 Balken).
2. **Import-Zeile** (gestrichelt): „＋ SCREENSHOT IMPORTIEREN“ mit Hinweis auf den
   letzten Import → Tab 8.
3. **Reichweiten-Karte**: Label 8,5 px / .2em, Wert 30 px / 600 / -.04em, rechts das
   Delta in einem 1 px-Rahmen-Chip. Balkendiagramm 92 px hoch, `gap: 3px`, letzter
   Balken `#E6E6E6`, alle anderen `rgba(230,230,230,.22)`, jeder mit 1 px Oberkante
   50 % Weiß. Unter dem Diagramm eine 1 px Linie und drei Achsenlabels
   (Start / Mitte / HEUTE).
4. **Nach Plattform**: pro Zeile Name 10,5 px / .1em, Wert, Delta (48 px breit,
   rechtsbündig; negativ = 45 % Weiß statt Volltonweiß) und darunter ein 4 px Balken
   (`rgba(230,230,230,.75)` bei Wachstum, `.28` bei Rückgang).
5. **Bester Content**: Rang 13 px / 700 / 30 % Weiß, Titel, Plattform + Datum,
   rechts Views und Saves. **Zeile antippen öffnet das Post-Detail-Sheet.**
6. **Was funktioniert** (Trend-Vergleich): pro Dimension eine Zeile mit Label
   (9 px / .16em) und Faktor rechts (10 px / 700). Darunter zwei Vergleichsbalken
   à 6 px: Variante A in `#E6E6E6`, Variante B in `rgba(230,230,230,.3)`, jeweils mit
   Beschriftung und Wert. Fünf Dimensionen: BILDINHALT, POSTZEIT, LÄNGE, TON,
   TEXT IM BILD. Kopfzeile rechts: „42 SHORTS AUSGEWERTET“.
7. **Muster erkannt**: Karte mit Rahmen 35 % Weiß, Fließtext 11,5 px / 1.55, darunter
   ein Rahmen-Button „DARAUS EINEN PLAN BAUEN“ → Tab 4.

**Post-Detail-Sheet** (gleiche Sheet-Mechanik wie beim Gig, `max-height: 90%`):
Kopf mit 56 × 74 px Platzhalter, Plattform + Datum, Titel 14 px / 600.
Dann ein 2 × 2 Metrik-Grid (AUFRUFE, GESPEICHERT, GETEILT, NEUE FOLLOWER) mit
Wert 17 px / 600 und Veränderung daneben. Dann „GESEHEN BIS“: eine 56 px hohe
Retention-Kurve aus 10 Balken (erster `#E6E6E6`, Rest `rgba(230,230,230,.28)`),
darunter Achsenlabels „0 S“ / „ABBRUCH 4 S“ / „12 S“ und rechts oben
„41 % KOMPLETT“. Dann eine Key-Value-Liste: LÄNGE, GEPOSTET, HOOK,
MIXER IM BILD, TON. Unten „ÄHNLICHEN POST PLANEN“ — der Button springt zu Tab 4
und schreibt einen vorbereiteten Prompt ins Eingabefeld.

### 4 — CLAUDE

Chat-Verlauf oben, Eingabe unten sticky.
Nachrichten: max. 86 % Breite, Padding 12 px 13 px, 11,5 px / 1.55.
Eigene Nachricht rechts, gefüllt `#E6E6E6` / Text `#0E0F0E`.
Antwort links, transparent mit 1 px Rahmen 14 % Weiß, Text 88 % Weiß.
Einblenden mit `riseIn` 280 ms.

Ladezustand: drei 5 × 5 px Quadrate mit `blink` (1 s, Verzögerung 0 / .2 / .4 s)
in einem Rahmen-Kästchen links.

Plan-Ausgabe: Kopfzeile „PLANVORSCHLAG · 06 POSTS“ und rechts „ALLE ÜBERNEHMEN“
(unterstrichen). Dann pro Vorschlag eine Karte: Datum 9 px / .12em + Plattform
8 px / .16em / 50 % Weiß, Ideentext 11,5 px / 1.5, darunter ein Button
„+ IN KALENDER“. Nach dem Tap: Button gefüllt `#E6E6E6` mit „✓ IM KALENDER“,
Karten-Rahmen auf 50 % Weiß, Hintergrund `rgba(230,230,230,.05)`. Erneuter Tap
nimmt es zurück.

Eingabezeile: 1 px Rahmen 22 % Weiß, links ein „>“-Prompt-Zeichen 11 px / 40 % Weiß,
Textfeld transparent 11,5 px, rechts ein 32 × 32 px gefüllter Senden-Button mit „↑“.
Enter sendet. Darüber eine horizontal scrollbare Reihe Vorschlags-Chips
(Padding 8 px 11 px, 1 px Rahmen 16 % Weiß, 10 px Text) — Tap füllt das Eingabefeld,
sendet aber nicht.

### 5 — FINANZEN

2 × 2 Kennzahlen-Grid in einem Rahmen: EINNAHMEN 2026 38.400 €, OFFEN 3.400 €,
AUSGABEN 11.260 €, RÜCKLAGE STEUER 8.900 €. Label 8 px / .16em, Wert 20 px / 600.

Rechnungsliste: Nummer 9 px / 40 % Weiß (52 px breit), Empfänger 11,5 px,
Datum/Frist als Untertitel 8 px / .12em, Betrag 11,5 px, Chip
(MAHNUNG gefüllt / OFFEN Rahmen / BEZAHLT und ENTWURF gedämpft).

Einnahmen nach Quelle: pro Zeile Label + Wert und darunter ein 4 px Balken;
die stärkste Quelle in `#E6E6E6`, die übrigen in `rgba(230,230,230,.4)`.

### 6 — KONTAKTE

Suchfeld oben (1 px Rahmen 14 % Weiß, „⌕“ links, Platzhalter „Name, Club, Label“).
Filtert live über Name und Organisation; leere Gruppen verschwinden.
Gruppen: BOOKING, LABEL & PROMO, CREW. Zeile: 30 × 30 px runder Initialen-Kreis,
Name 11,5 px, Organisation 8,5 px / .1em / 40 % Weiß, rechts letzter Kontakt
8 px / .12em / 35 % Weiß.

### 7 — TOUR & LOGISTIK

Hero-Karte wie „nächster Gig“: „NÄCHSTE REISE“, „KÖLN · 26.09“ 20 px / 600,
Untertitel mit Venue und Nächten.
Ablauf als Timeline: Uhrzeit 10 px (44 px breit), dann eine 1 px Vertikallinie mit
einem 7 × 7 px Punkt (`left: -3px; top: 3px`) — erledigte Punkte gefüllt, offene nur
Rahmen —, rechts Titel 11,5 px und Detail 9 px / 45 % Weiß.
Darunter „RIDER-CHECK“: vier togglebare Checkbox-Zeilen.

### 8 — SCREENSHOT-IMPORT

Segmented oben: ACCOUNT / EINZELNER POST. Der Wechsel setzt den Flow zurück.
Vier Schritte in einem State (`impStep`):

**pick** — Dropzone 196 px hoch, gestrichelter Rahmen 30 % Weiß, diagonale Streifen
als Hintergrund, in der Mitte ein 42 × 42 px Rahmen-Quadrat mit „＋“,
„SCREENSHOT ABLEGEN“ 11 px / 600 und „oder aus der Galerie wählen“ 9,5 px / 45 %.
Darunter ein erklärender Satz (unterschiedlich je Modus) und die Liste
„LETZTE IMPORTE“ mit Mini-Platzhalter, Plattform · Modus, Zeitraum und Alter.

**reading** — dieselbe Fläche, jetzt mit durchgezogenem Rahmen, drei blinkenden
Quadraten und „CLAUDE LIEST DEN SCREENSHOT“. Darunter eine Schritt-Liste, deren
erledigte Zeilen ein „✓“ in Volltonweiß tragen und die laufende ein „·“ in 40 % Weiß.
Im Prototyp dauert das fix 1.600 ms.

**review** — links ein 74 × 104 px Screenshot-Platzhalter, rechts „ERKANNT“,
Titel (z. B. „INSTAGRAM · ACCOUNT“), Zeitraum und ein Chip „6 VON 7 SICHER“.
Darunter eine Tabelle: Feldname 9 px / .14em / 45 % Weiß, Wert 11,5 px, Chip
„SICHER“ (Rahmen 12 % Weiß, Text 40 % Weiß) oder „PRÜFEN“ (Rahmen 45 % Weiß,
Text Volltonweiß). Unsichere Zeilen bekommen zusätzlich
`background: rgba(230,230,230,.05)`. Hinweistext, dann „ÜBERNEHMEN“ (gefüllt) und
„VERWERFEN“ (Rahmen).
Im echten Build muss jede Zeile editierbar sein — der Prototyp zeigt nur den Hinweis.

**done** — Bestätigungskarte (Rahmen 50 % Weiß) mit einem Satz, was gespeichert wurde,
darunter „ZU DEN ZAHLEN“ (gefüllt, springt zu Tab 3) und „NÄCHSTER“ (setzt zurück).

---

## Interaktionen & Verhalten

| Auslöser | Wirkung |
|---|---|
| Tab-Tap | Screen-Wechsel, schließt offene Sheets (`openGig` und `openPost` auf null) |
| Modul-Kachel | Wechsel auf Tab 5/6/7/8, Zurück-Pfeil erscheint im Header |
| Checkbox-Zeile (Aufgaben, Rider, Phasen-Tasks) | togglet den Erledigt-Status |
| Booking-Zeile | öffnet Advance-Sheet |
| „Bester Content“-Zeile | öffnet Post-Detail-Sheet |
| „ÄHNLICHEN POST PLANEN“ | Tab 4 + vorbereiteter Prompt im Eingabefeld |
| Vorschlags-Chip (Claude) | füllt das Eingabefeld, sendet nicht |
| Senden / Enter | eigene Nachricht anhängen, Ladezustand, nach 1.000 ms Antwort (+ Plan) |
| „+ IN KALENDER“ | togglet die Übernahme eines Vorschlags |
| „ALLE ÜBERNEHMEN“ | markiert alle Vorschläge |
| Dropzone | startet den Lese-Flow |
| Segmented (Filter, Zeitraum, Import-Modus) | filtert bzw. tauscht Datensatz |
| Kontakt-Suche | filtert live, blendet leere Gruppen aus |

Animationen (alle im Prototyp definiert):
`fadeIn` 220–250 ms ease für Screen-Wechsel und Backdrops ·
`riseIn` 280–320 ms ease (8 px von unten) für neue Nachrichten und Plan-Karten ·
`sheetUp` 260 ms `cubic-bezier(.2,.9,.2,1)` für Bottom-Sheets ·
`blink` 1–1,8 s ease-in-out für Lade- und Hinweis-Punkte.

Fehler- und Leerzustände sind im Prototyp **nicht** ausgearbeitet und müssen ergänzt
werden: leere Gig-Liste nach Filterung, Kontakt-Suche ohne Treffer, fehlgeschlagener
Screenshot-Import (Plattform nicht erkannt, Bild zu klein, keine Zahlen gefunden),
Claude-Timeout, Offline-Zustand.

## State (Prototyp-Stand)

```
tab            0–9, aktiver Screen
filter         'Alle' | 'Bestätigt' | 'Angefragt'      Booking-Filter
range          '7T' | '30T' | '90T'                    Analytics-Zeitraum
openGig        Index | null                            Advance-Sheet
openPost       Index | null                            Post-Detail-Sheet
search         String                                  Kontakt-Suche
draft          String                                  Claude-Eingabe
thinking       Boolean                                 Claude-Ladezustand
messages       [{ role: 'me' | 'ai', text }]
plan           [{ day, plat, idea }] | null
added          { [index]: true }                        übernommene Vorschläge
tasks          [{ t, due, d }]
rider          [{ t, d }]
phases         [{ no, name, range, tasks: [{ t, d }] }]
impKind        'account' | 'post'
impStep        'pick' | 'reading' | 'review' | 'done'
```

Abgeleitet, nicht gespeichert: Gagen-Summe der gefilterten Liste, Aufgaben-Fortschritt
pro Phase und gesamt, Release-Status (`AUF KURS` ab 4 erledigten Aufgaben — im Build
besser: Vergleich von Plan-Soll und Ist zum heutigen Datum), Balkenzahl im Diagramm,
Assets-Zähler, Initialen aus dem Namen.

## Design-Tokens

**Farben** — bewusst monochrom. Status wird über Rahmen und Füllung unterschieden,
nie über Farbton. Keine Akzentfarbe, keine Gradienten.

| Rolle | Wert |
|---|---|
| Seiten-Hintergrund (Prototyp-Rahmen) | `#080908` |
| App-Hintergrund | `#0E0F0E` |
| Tab-Bar | `#0B0C0B` |
| Bottom-Sheet | `#131413` |
| Vordergrund / Weiß | `#E6E6E6` |
| Text auf gefüllter Fläche | `#0E0F0E` |
| Text sekundär | `rgba(230,230,230,.6)` |
| Text tertiär / Labels | `rgba(230,230,230,.45)` |
| Text quartär | `rgba(230,230,230,.35)` |
| Rahmen Standard | `rgba(230,230,230,.11)` |
| Rahmen betont | `rgba(230,230,230,.2)` bis `.55` |
| Trennlinie in Listen | `rgba(230,230,230,.08)` |
| Flächen-Tint | `rgba(230,230,230,.04)` bis `.09` |
| Balken sekundär | `rgba(230,230,230,.22)` bis `.3` |

**Chip-System** (drei Varianten, überall gleich):
- `solid` — Fläche `#E6E6E6`, Text `#0E0F0E`, Rahmen `#E6E6E6`. Für den positiven oder
  dringenden Zustand: BESTÄTIGT, FERTIG, MASTER, MORGEN, MAHNUNG.
- `outline` — transparent, Text `#E6E6E6`, Rahmen `rgba(230,230,230,.2)`. Für offen /
  in Arbeit: ANGEFRAGT, ENTWURF, IN ARBEIT, REVISION, OFFEN, PLANUNG.
- `dim` — transparent, Text `rgba(230,230,230,.4)`, Rahmen `rgba(230,230,230,.12)`.
  Für irrelevant oder abgeschlossen: OPTION, IDEE, BEZAHLT, ERLEDIGT, ERSCHIENEN.

Chip-Maße: 8 px Schrift, `letter-spacing: .12em` bis `.14em`, Padding 3 px 6 px,
kein Radius.

**Typografie** — eine Schrift, JetBrains Mono (Google Fonts), Gewichte 300–700.
Das ist Absicht: Rack-/Studio-Software-Anmutung, alle Zahlen tabellarisch bündig.

| Rolle | Größe / Gewicht / Laufweite |
|---|---|
| Hero-Zahl (Countdown) | 40 px / 700 / -.05em |
| Screen-Hero | 24–25 px / 600 / -.03em bis -.04em |
| Große Kennzahl | 30 px / 600 / -.04em |
| Kennzahl | 17–21 px / 600 / -.03em |
| Screen-Titel (Header) | 17 px / 600 / -.01em |
| Karten-Titel | 13–15 px / 600 |
| Fließtext | 11,5 px / 400 / line-height 1.45–1.55 |
| Listentext | 11 px / 400 |
| Button | 10,5–11 px / 700 / .1em |
| Abschnitts-Label | 9 px / 400 / .2em, Farbe 45 % Weiß |
| Meta / Chip | 8–8,5 px / .12em bis .22em |
| Tab-Label | 7,5 px / 600 / .06em |

Großbuchstaben für Labels, Chips, Buttons, Plattformnamen und Venue-Namen in Heroes.
Fließtext und Listentitel bleiben gemischt.

**Abstände**: 4 / 6 / 8 / 9 / 12 / 14 / 16 / 18 / 20 / 26 px.
Screen-Padding 14–16 px oben, 20 px seitlich, 26 px unten. Abstand zwischen
Abschnitten 16–20 px, innerhalb einer Karte 8–14 px, in Listenzeilen 11–14 px.

**Radien**: 3 px für Segmented-Controls, 4 px für alles andere (Karten, Chips: 0).
Der Prototyp-Rahmen selbst hat 36 px — der gehört nicht zur App.

**Schatten**: keine, außer dem Geräteschatten des Prototyp-Rahmens.
Tiefe entsteht ausschließlich über Rahmenhelligkeit.

**Tab-Bar**: Padding 6 px 8 px 18 px, Oberkante 1 px `rgba(230,230,230,.11)`.
Aktiver Tab: 14 × 2 px Strich in `#E6E6E6` über dem Label, Label in Volltonweiß.
Inaktiv: Strich `opacity: 0`, Label `rgba(230,230,230,.4)`.

## Assets

Keine Bilder, keine Icon-Bibliothek. Bewusst:

- **Medien-Platzhalter** (Cover, Post-Thumbnails, Screenshot-Vorschau) sind
  CSS-Streifen: `repeating-linear-gradient(135deg, rgba(230,230,230,.08) 0 4px,
  transparent 4px 9px)` mit 1 px Rahmen. Im Build durch echte Bilder ersetzen,
  aber das Streifenmuster als Ladezustand behalten.
- **Icons** sind Zeichen: `＋` `›` `←` `↑` `✓` `·` `⌕` `>` `∑` `⌀`. Wenn im Zielprojekt
  eine Icon-Bibliothek existiert, dünne Linien-Icons in gleicher Größe verwenden —
  keine gefüllten, keine runden.
- **Diagramme** sind flex-Container aus `div`s mit Prozenthöhen, keine Chart-Bibliothek.
  Für echte Daten reicht das weiterhin; erst bei Tooltips und Zoom lohnt eine Library.

## Bekannte Lücken im Prototyp

- Kein Speichern: jeder Reload setzt alles zurück.
- Screenshot-Import und Claude-Antwort sind zeitgesteuerte Attrappen mit festen Texten.
- Kein Login, keine Mehrbenutzer-Fähigkeit.
- Zeitstrahl-Position (34 %) und alle Datumsangaben sind hart kodiert.
- Keine Fehler- und Leerzustände.
- Kein Anlegen und Bearbeiten: Gigs, Posts, Rechnungen und Kontakte können nur
  angesehen werden. Formulare fehlen komplett und sind der größte fehlende Baustein.
- Keine Barrierefreiheit: Tap-Targets in Listen liegen bei 38–44 px, die Tab-Bar-Labels
  bei 7,5 px. Vor dem Bau prüfen — 44 px Mindesthöhe und größere Labels sind vertretbar,
  die Optik trägt das.

## Dateien in diesem Bundle

- `DJ Cockpit.dc.html` — der Prototyp. Vorlage und Logik in einer Datei, Vorlage
  vollständig inline gestylt. Alle Beispieldaten stehen als Konstanten oben im
  Logik-Block (`GIGS`, `POSTS`, `RANGES`, `PLATFORMS`, `TOP`, `TRENDS`, `IMPORTS`,
  `REVIEW`, `TRACKS`, `ASSETS`, `DEADLINES`, `REL_SEGS`, `REL_STATS`,
  `OTHER_RELEASES`, `INVOICES`, `INCOME`, `CONTACTS`, `ITINERARY`, `PLAN`).
- `DJ Cockpit offline.html` — dieselbe App als eine Datei ohne Abhängigkeiten,
  zum Öffnen im Browser und Ablegen auf dem Home-Bildschirm.
- `BAUPLAN.md` — Datenmodell, Screenshot-Import-Pipeline, Claude-Anbindung,
  Reihenfolge der Bauschritte.
