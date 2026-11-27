# apiExtern

## Ads-Anfragen → BigQuery (`ads/`)
GitHub Action `ads-anfragen.yml` (alle 6 Std.) überträgt Website-Anfragen (Wix „Angebot anfordern“ + Buchungen a.l8street.com aus Sheet 08.1/'sites') gehasht nach BigQuery `kommunikation.google_ads_anfragen` für den Google-Ads-Conversion-Import.
Secrets: `WIX_API_KEY`, `GCP_SA_KEY` (Dienstkonto-JSON; Sheet 08.1 für das Dienstkonto als Betrachter freigeben).
