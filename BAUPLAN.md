# Bauplan

Ergänzung zum README. Das README beschreibt, wie es aussehen und sich verhalten soll.
Hier steht, was dahinter gebaut werden muss.

## Empfohlener Stack

Next.js (App Router) + TypeScript + Tailwind, Supabase für Auth, Postgres und Storage,
Vercel fürs Deployment. Ein einzelner Nutzer, kein Team — deshalb kein
Rollen-/Rechtekonzept, aber Row Level Security auf `user_id` von Anfang an, damit ein
zweiter Account später nichts aufbrechen kann.

PWA-Manifest und Service Worker einplanen: die App wird vom Home-Bildschirm gestartet
und soll gecachte Daten auch ohne Netz anzeigen (Gig-Details im Club, wo kein Empfang ist).

## Datenmodell

```sql
-- Bookings
gigs (
  id, user_id, venue, city, date, set_start, set_end,
  fee_cents, currency, status,            -- 'confirmed' | 'requested' | 'option'
  contact_id, tech_notes, hotel, travel,
  advance_confirmed bool, rider_sent bool,
  created_at, updated_at
)

-- Kontakte
contacts (
  id, user_id, name, organisation, role,  -- 'booking' | 'label_promo' | 'crew'
  email, phone, last_contact_at, notes
)

-- Aufgaben (Dashboard + Rider + Release-Phasen, ein Typ reicht)
tasks (
  id, user_id, title, due_date, done bool,
  scope,                                  -- 'general' | 'gig' | 'release'
  gig_id nullable, release_id nullable, phase_id nullable,
  sort_order
)

-- Releases
releases (
  id, user_id, title, kind,               -- 'ep' | 'single' | 'album' | 'remix'
  label, release_date, campaign_start,    -- campaign_start treibt den Zeitstrahl
  status,                                 -- 'planning' | 'scheduled' | 'released'
  budget_cents, presave_count, presave_goal,
  artwork_url
)

release_phases (
  id, release_id, no, name, starts_on, ends_on, sort_order
)

tracks (
  id, release_id, side_label, title, duration_seconds,
  status,                                 -- 'master' | 'revision' | 'open'
  sort_order
)

release_assets (
  id, release_id, name, done bool, done_on
)

release_deadlines (
  id, release_id, title, due_date, owner_contact_id, done bool
)

-- Content
posts (
  id, user_id, platform,                  -- 'instagram' | 'tiktok' | 'youtube' | 'spotify'
  format,                                 -- 'reel' | 'carousel' | 'story' | 'video'
  caption, planned_at, published_at,
  status,                                 -- 'idea' | 'draft' | 'in_progress' | 'ready' | 'published'
  release_id nullable, gig_id nullable,
  media_url, external_url, external_id,
  ai_generated bool, source_plan_id nullable
)

-- Analytics: zwei Ebenen, beide aus dem Import gefüttert
account_metrics (
  id, user_id, platform, period_start, period_end,
  views, reach, profile_views, followers_delta, interactions,
  source,                                 -- 'screenshot' | 'manual' | 'api'
  import_id, created_at
)

post_metrics (
  id, post_id, measured_at,
  views, likes, saves, shares, followers_delta,
  avg_watch_seconds, completion_rate,
  retention_curve jsonb,                  -- [100, 97, 92, ...] 10 Stützpunkte
  source, import_id
)

-- Merkmale pro Post: Grundlage der Trend-Auswertung
post_traits (
  post_id, mixer_visible bool, has_overlay_text bool,
  own_track bool, length_seconds int, posted_hour int,
  hook_description text
)

-- Import-Historie
imports (
  id, user_id, platform, kind,            -- 'account' | 'post'
  image_path, raw_extraction jsonb, confidence jsonb,
  confirmed_at, created_at
)

-- Finanzen
invoices (
  id, user_id, number, gig_id nullable, recipient,
  amount_cents, issued_on, due_on, paid_on,
  status                                  -- 'draft' | 'open' | 'paid' | 'overdue'
)

expenses (
  id, user_id, category, amount_cents, date, note, gig_id nullable
)

-- Claude
ai_conversations (id, user_id, context, created_at)
ai_messages (id, conversation_id, role, content, created_at)
ai_plan_items (
  id, conversation_id, planned_for date, platform, idea,
  accepted bool, post_id nullable         -- gesetzt sobald übernommen
)
```

Abgeleitete Werte nicht speichern, sondern berechnen: Gagen-Summen, Phasen-Fortschritt,
Release-Status, Trend-Vergleiche, Countdown.

## Screenshot-Import

Der Kern der App. Ohne ihn gibt es keine Zahlen, denn Spotify for Artists hat keine
offene Analytics-Schnittstelle und Instagram/TikTok verlangen einen App-Review, der
für eine Einzelperson unverhältnismäßig ist.

Ablauf:

1. **Upload.** `<input type="file" accept="image/*" capture="environment">`, Bild direkt
   nach Supabase Storage, Pfad `imports/{user_id}/{uuid}.jpg`. Vorher clientseitig auf
   max. 2048 px längste Kante runterrechnen — spart Tokens und Upload-Zeit.
2. **Extraktion.** Server-Route ruft die Anthropic Messages API mit dem Bild als
   `image`-Block und einem `tool_use`-Schema auf, das die Felder erzwingt.
   Ein Schema pro Modus (Account / Post), plus Plattform-Erkennung.
   Wichtig: **`confidence` pro Feld** verlangen, nicht nur die Werte — daraus entsteht
   die SICHER/PRÜFEN-Kennzeichnung in der UI.
3. **Prüfung.** Ergebnis als `imports.raw_extraction` speichern, unbestätigt.
   Die Review-Ansicht zeigt jede Zeile editierbar; unsichere Felder sind vorausgewählt.
4. **Übernahme.** Erst beim Bestätigen in `account_metrics` bzw. `post_metrics`
   schreiben, mit `import_id` als Herkunft. Doppelte Zeiträume erkennen und ein Update
   anbieten statt eine zweite Zeile anzulegen.

Beispiel-Schema für den Post-Modus:

```json
{
  "name": "extract_post_metrics",
  "input_schema": {
    "type": "object",
    "properties": {
      "platform": { "type": "string", "enum": ["instagram","tiktok","youtube","spotify"] },
      "posted_date": { "type": "string", "description": "ISO, leer wenn nicht sichtbar" },
      "views": { "type": "integer" },
      "likes": { "type": "integer" },
      "saves": { "type": "integer" },
      "shares": { "type": "integer" },
      "followers_delta": { "type": "integer" },
      "avg_watch_seconds": { "type": "number" },
      "completion_rate": { "type": "number" },
      "confidence": {
        "type": "object",
        "description": "Pro Feldname 0–1, wie sicher der Wert im Bild lesbar war",
        "additionalProperties": { "type": "number" }
      },
      "unreadable_fields": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["platform", "confidence"]
  }
}
```

Schwelle: `confidence >= 0.9` gilt als SICHER, darunter PRÜFEN.
Deutsche und englische Zahlformate beide behandeln („1.204“ vs „1,204“, „12,8k“ vs „12.8K“).
Bei unbekannter Plattform nicht raten, sondern nachfragen lassen.

Für die Retention-Kurve im Post-Detail: aus der Kurve im Screenshot zehn Stützpunkte
in Prozent schätzen lassen. Das ist ungenau, reicht aber für den Vergleich zwischen
eigenen Posts — was hier zählt.

## Trend-Auswertung

Die fünf Vergleiche auf dem Zahlen-Screen sind reine SQL-Aggregate über
`post_metrics` + `post_traits`, keine KI:

| Dimension | Vergleich |
|---|---|
| BILDINHALT | `mixer_visible = true` gegen `false`, Median der Views |
| POSTZEIT | `posted_hour BETWEEN 19 AND 21` gegen alles außerhalb |
| LÄNGE | `length_seconds < 15` gegen `> 30` |
| TON | `own_track = true` gegen `false` |
| TEXT IM BILD | `has_overlay_text = false` gegen `true` |

Median statt Mittelwert, weil ein einzelner Ausreißer sonst alles verzerrt.
Faktor = Median A / Median B, Balkenbreiten relativ zum größeren Wert.
Unter zehn Posts pro Seite eines Vergleichs die Zeile ausgrauen und
„zu wenig Daten“ anzeigen statt eine Zahl zu behaupten.

`post_traits` muss beim Anlegen eines Posts erfasst werden — vier Schalter und ein
Zahlenfeld. Ohne diese Merkmale gibt es keine Trends, das ist der unbequeme Teil.
Alternative: Claude die Merkmale aus dem hochgeladenen Video-Thumbnail schätzen lassen
und vom Nutzer bestätigen.

## Claude-Anbindung

Zwei getrennte Einsätze, nicht vermischen:

**1. Planer (Tab 4).** Ein Chat mit Werkzeugen. Der Systemprompt bekommt den echten
Kontext mitgegeben: kommende Gigs, geplante Releases mit Datum, bereits geplante Posts,
und die Ergebnisse der Trend-Auswertung als kurze Fakten („Clips mit sichtbarem Mixer:
Median 71k gegen 19k“). Genau daraus entstehen brauchbare Vorschläge statt
Allgemeinplätze.

Werkzeuge, die Claude aufrufen darf:
- `propose_content_plan(items[])` — schreibt nach `ai_plan_items`, legt **keine** Posts an.
- `list_upcoming(range)` — liest Gigs, Releases, geplante Posts.
- `get_performance_summary()` — liest die Trend-Aggregate.

Der Nutzer übernimmt Vorschläge einzeln. Erst dann entsteht ein `posts`-Datensatz mit
`ai_generated = true`. Claude darf nie direkt in `posts` schreiben — das ist die Regel,
die den Kalender vertrauenswürdig hält.

Streaming verwenden, damit die Antwort tippend erscheint. Der Ladezustand im Design
(drei blinkende Quadrate) ist die Zeit bis zum ersten Token.

**2. Extraktion (Tab 8).** Ein einzelner Aufruf ohne Chat, mit erzwungenem Schema,
`temperature: 0`. Kein Systemprompt-Kontext nötig, keine Historie.

Kosten: Bild-Extraktion liegt bei wenigen Cent pro Screenshot, der Planer bei ein paar
Cent pro Gespräch. Bei täglicher Nutzung landet man im niedrigen einstelligen
Euro-Bereich pro Monat. Ein Monatslimit pro Nutzer einbauen, damit ein Fehler in einer
Schleife nicht teuer wird.

## Reihenfolge der Bauschritte

1. **Gerüst.** Next.js, Supabase, Auth, PWA-Manifest, Tab-Navigation, die vier
   Haupt-Screens mit hart kodierten Beispieldaten aus dem Prototyp. Ziel: die App liegt
   auf dem Home-Bildschirm und fühlt sich richtig an.
2. **Bookings echt.** Tabellen `gigs` und `contacts`, Liste, Advance-Sheet,
   Anlegen/Bearbeiten-Formular. Das ist der erste echte Nutzen.
3. **Aufgaben und Content.** `tasks` und `posts`, Dashboard-Liste, Content-Pipeline,
   Wochenstreifen.
4. **Releases.** `releases` mit Phasen, Tracks, Assets, Deadlines. Zeitstrahl aus
   `campaign_start` und `release_date` berechnen.
5. **Screenshot-Import.** Upload, Extraktion, Review, Übernahme. Erst Account-Modus,
   dann Post-Modus.
6. **Zahlen und Trends.** Diagramme aus `account_metrics`, Post-Detail aus
   `post_metrics`, die fünf Trend-Vergleiche.
7. **Claude-Planer.** Chat, Werkzeuge, Übernahme in den Kalender.
8. **Finanzen.** `invoices` und `expenses`, Kennzahlen, Rechnungsliste.
9. **Tour & Logistik.** Ablauf und Rider-Check pro Gig.

Nach Schritt 2 ist die App bereits nützlich, nach Schritt 6 ersetzt sie die Tabellen,
nach Schritt 7 tut sie etwas, das keine Tabelle kann.

## Was bewusst nicht gebaut wird

- Keine Live-Schnittstellen zu Instagram, TikTok oder Spotify. Der Screenshot-Import
  ersetzt sie und kostet keinen App-Review.
- Kein Team, keine Freigaben, keine Kommentare.
- Kein eigenes Rechnungs-PDF am Anfang. Nummer, Betrag und Status reichen; das PDF
  macht das Steuerprogramm besser.
- Kein Kalender-Sync (ICS-Export) in der ersten Version, aber im Datenmodell schon
  möglich — `gigs` und `posts` haben alles, was ein Feed braucht.
