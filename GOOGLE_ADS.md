# Google Ads, Tracking und Auswertung – Stand 28.11.2026

Kurzüberblick über alles, was rund um Google Ads, GA4 und BigQuery eingerichtet ist.
Keine Schlüssel in dieser Datei – die stehen nur als GitHub-Secrets im Repo.

## Konten und Kennungen
| Was | Wert |
|---|---|
| Google-Ads-Werbekonto (L8 Street Gmbh) | 408-695-7872 |
| Google-Ads-Verwaltungskonto (MCC, hält den Developer-Token) | 858-991-8156 |
| Versehentlich angelegtes zweites MCC (leer, ignorieren/kündigen) | 810-492-2272 |
| Kampagne „Search“ | 23468824534 |
| Anzeigengruppe Pforzheim / Karlsruhe | 192140250216 / 199423026181 |
| Conversion „Angebot anfordern (Website-Formular)“ | 7919934190 |
| GA4-Messung / Property / Stream | G-NVRSB6NDXZ / 440156955 / 8128757699 |
| Google-Cloud-Projekt | l8-datenspeicherung-langzeit (BigQuery, Standort EU) |
| Wix-Website L8 Street | 1c4fe0cc-152c-4488-8ddc-3ab7fb0a1e4d |
| Wix-Sammlung „AnfrageHomepageLanding“ | getAQuote033 (Personen = kopieVonDuration, Mietdauer = feldFurKurzeAntwort) |
| Sheet 08.1 (Buchungen a.l8street.com, Tab `sites`) | 1Aq9doxAkEw435bRCpXafayRwdNeaP9LVMU1YwWG7z70 |

## Kampagne „Search“ (Stand 27.11.)
- Budget 60 €/Tag, Gebotsstrategie „Klicks maximieren“ (max. 12 € CPC). Letzte 30 Tage ca. 740 € Kosten.
- Anzeigengruppe **Pforzheim**: nur Pforzheim-Anzeige und -Keywords; 11 fremdsprachige Keywords pausiert.
- Anzeigengruppe **Karlsruhe**: Monteurwohnung/-zimmer/-unterkunft Karlsruhe, Monteurzimmer Ettlingen, Malsch (Wortgruppe), eigene Karlsruhe-Anzeige.
- Sitelinks: 4-Zimmer (kf6), 2-Zimmer (cs3), Angebot anfordern, Wohnungen in Pforzheim, Wohnungen in Karlsruhe (a.l8street.com).
- 8 Callouts (Rechnung mit MwSt, Ab 3 Personen, Eigene Küche & Bad, …).
- Standorte aus dem Unternehmensprofil verknüpft. „Top Monteurwohnung Karlsruhe“ ist unbestätigt (Google verlangt Videoanruf) – bewusst so gelassen.
- Zielseite der Anzeigen: www.l8street.com.

## Conversions in Google Ads
| Aktion | Quelle | Filter | Rolle |
|---|---|---|---|
| Angebot anfordern (Website-Formular) | BigQuery `kommunikation.google_ads_anfragen` | `status = OK` | primär – Gebote später darauf |
| google_ads_anfragen – Alle Datensätze | dieselbe Tabelle | keiner | Beobachtung (Zielvorhaben „Lead-Formular senden“ vor Umstellung auf „Conversions maximieren“ als *nicht Standard* setzen) |

Zuordnung: Transaktions-ID = `anfrage_id`, Zeit = `conversion_zeit`, E-Mail = `email_sha256`, Telefon = `telefon_sha256`, GCLID = `gclid`. E-Mail und Telefon sind bereits SHA-256-gehasht, die GCLID nicht (Klartext). Import täglich ca. 6–7 Uhr.

**Gute Anfrage (Status OK):** Kontakt vorhanden, ab 3 Personen, ab 6 Tagen (unbefristet/„Option auf Verlängerung“ zählt). Eindeutig darunter = „Nicht qualifiziert“, unklar = „Manuell prüfen“. Alle Anfragen bleiben in BigQuery.

## Abläufe (GitHub Actions in diesem Repo)
| Ablauf | Wann | Was |
|---|---|---|
| `ads-anfragen.yml` → `ads/anfragen_sync.mjs` | alle 6 Std. | Wix-Formular + Buchungen a.l8street.com → BigQuery `kommunikation.google_ads_anfragen` (MERGE über `anfrage_id`) |
| `gads.yml` → `ads/gads_api.mjs bericht` | täglich 04:41 UTC | Kosten/Klicks/Conversions je Tag und Anzeigengruppe (30 Tage) → `google_ads.kosten_taeglich` |
| `gads.yml` → `ads/gads_api.mjs sitelinks` | nur von Hand | fehlende Stadt-Sitelinks anlegen |
| `build-pages.yml` | Zeitplan alle 15 Min. (läuft real ca. alle 30), bei Sheet-Änderung (`sheet_updated`) oder von Hand – nicht automatisch beim Merge | Website a.l8street.com neu bauen |

GitHub startet Zeitpläne manchmal nicht (28.11. ausgefallen) – dann unter Actions „Run workflow“.

**Secrets (Namen):** `G_ADS_KEY` (Developer-Token, Stufe Explorer), `GAPPSCRIPT_SA_CREDENTIALS_WRITE` (Dienstkonto `github-deployer`, in Google Ads als Nutzer „Standard“ und mit BigQuery-Rechten, Sheet 08.1 freigegeben), `WIX_KEY`, `CLAUDE_KEY` (Prüfer).
Google Ads API: Version v26, eigener Zugang – Adspirer wird nicht mehr gebraucht.

## Tracking auf den Websites
- **a.l8street.com:** Cookie-Banner; GA4 und Google-Klick-ID (gclid, 90 Tage) nur nach Zustimmung. `generate_lead` bei Buchung (`anfrage_art: buchung`) und beim Knopf „Unverbindlich per WhatsApp anfragen“ (`anfrage_art: whatsapp`, mit Personen und Tagen). WhatsApp-Nachricht enthält bei Anzeigenklick `Ref: G-…`.
- **www.l8street.com (Wix):** Skript „Lead-Tracking Angebot anfordern (GA4)“ meldet `generate_lead` (Wix → Einstellungen → Benutzerdefinierter Code).
- GA4: `generate_lead` ist Schlüsselereignis; GA4 mit Google Ads und BigQuery (täglicher Export) verknüpft.
- Elfsight-Bewertungen laden immer (Entscheidung Inhaber 27.11.).

## Offen / nächste Schritte
1. Auswertung „Kosten je guter Anfrage“ (Tab „Ü_Google_Ads“), sobald einige Tage Daten da sind.
2. Wix-Anfragen über den GA4-Export Google Ads zuordnen (gclid per Zeitabgleich).
3. „Ü_Quellen“: Anfragen, Buchungen, Umsatz und Kosten je Portal (Portal-Kostenliste nur ca. 70 % aktuell, mit Gmail-Rechnungen abgleichen).
4. WhatsApp-Chats per Zeitstempel Google Ads zuordnen.
5. Bei genug Conversions: Gebotsstrategie „Conversions maximieren“; vorher Zielvorhaben „Lead-Formular senden“ auf nicht Standard.
6. Datenschutzerklärung: Google Analytics statt Adobe, Elfsight und unpkg ergänzen.
7. Später: Zielseite der Anzeigen auf a.l8street.com/<stadt>/, Sitelinks/Anzeigengruppen je weiterer Stadt, ggf. Microsoft Ads testen.
