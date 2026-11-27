# Regeln für dieses Repo (apiExtern – Website a.l8street.com + Ads-Abläufe)

Gilt für alle PRs. Feste Prüfung: `pruefungen/web_regeln.mjs` (im Job `typpruefung`). Claude-Prüfer liest den Abschnitt „Code“.

## Ablauf
- Nie direkt auf `main`. Branch + PR, mergen nur nach OK des Inhabers und wenn `typpruefung`, `geheimnisse`, `claude-pflicht` grün sind.
- Nach dem Merge baut `build-pages.yml` die Seite neu (sonst spätestens nach ca. 30 Min. automatisch).

## Code
Pflicht (PR rot):
- Stylesheet nur Pico v2: `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css`. Kein zweites CSS-Framework (Bootstrap, Tailwind …). Eigene Styles in `css.js` (SHARED_CSS) oder kleinen Style-Blöcken.
- Jede Seite nutzt `HEADER_HTML`/`FOOTER_HTML` aus `header_footer.html` (Kopf, Fuß, Cookie-Banner, „Cookie-Einstellungen“). Keine eigenen Kopf-/Fußzeilen.
- GA4 (`G-NVRSB6NDXZ`) und Google-Klick-ID (gclid) nur nach Zustimmung über `header_footer.html`. Ereignisse nur über `l8MeldeAnfrage()`, kein `gtag(` oder Google-Tag-Skript in anderen Dateien. Ablehnen/Widerruf schaltet GA4 sofort ab.
- `generate.js` muss mit den Daten aus dem Apps-Script (`getAllApartments`, `getAvailability`) alle Seiten bauen: Startseite, Stadtseiten (`/<stadt>/`), Wohnungsseiten (`/a/<kürzel>/`), Rechtsseiten.
- Keine Schlüssel, Tokens oder Passwörter im Code – nur GitHub-Secrets (gitleaks prüft).
- Buchungsformular: „Jetzt verbindlich buchen“ legt eine echte Buchung an (Apps-Script 08.1, Tab `sites`). Nichts ändern, was Testbuchungen oder Doppelbuchungen auslöst. Anfragen ohne Buchung nur über WhatsApp-Knopf.
- `ads/`: Anfragen nach BigQuery `kommunikation.google_ads_anfragen` (MERGE über `anfrage_id`, Status OK nur ab 3 Personen und ab 6 Tagen, unklar = „Manuell prüfen“), Google-Ads-Bericht nach `google_ads.kosten_taeglich`. Kontaktdaten nur als SHA-256. Reine Logik mit Tests (`npm test` in `ads/`).

Hinweis (PR bleibt grün):
- Fremd-Skripte mit fester Version statt `@latest`.
- Neue Fremddienste (Skript/Stylesheet von fremder Domain) in `legal.html` (Datenschutz) nennen. Elfsight-Bewertungen laden bewusst immer (Entscheidung Inhaber 27.11.).
- Dateien über 350 Zeilen bei Änderungen eher aufteilen.
- Deutsche Namen für Neues, ein Zweck je Funktion, unklare Fälle „Manuell prüfen“ statt raten.
