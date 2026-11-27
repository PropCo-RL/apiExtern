// =================================================================
// GADS API – eigener Zugang zur Google Ads API (ersetzt Adspirer)
// Aufruf: node gads_api.mjs bericht    -> Kosten/Klicks/Conversions je Tag + Anzeigengruppe (30 Tage) nach BigQuery
//         node gads_api.mjs sitelinks  -> Stadt-Sitelinks (Pforzheim, Karlsruhe) anlegen, falls noch nicht vorhanden
// Zugang: Dienstkonto (Secret GAPPSCRIPT_SA_CREDENTIALS_WRITE bzw. GCP_SA_KEY, in Google Ads als Nutzer „Standard“)
//         + Developer-Token (Secret G_ADS_KEY). Ziel BigQuery: google_ads.kosten_taeglich (EU)
// Lauf: .github/workflows/gads.yml (täglich Bericht; Sitelinks nur von Hand)
// =================================================================
export const GADS = {
  VERSION: 'v26',
  KUNDE: '4086957872', // Werbekonto L8 Street Gmbh
  KAMPAGNE: '23468824534', // Search
  PROJEKT: 'l8-datenspeicherung-langzeit',
  DATASET: 'google_ads',
  TABELLE: 'kosten_taeglich',
  SITELINKS: [
    { linkText: 'Wohnungen in Pforzheim', url: 'https://a.l8street.com/pforzheim/' },
    { linkText: 'Wohnungen in Karlsruhe', url: 'https://a.l8street.com/karlsruhe/' }
  ],
  SITELINK_TEXT1: 'Alle freien Monteurwohnungen',
  SITELINK_TEXT2: 'Verfügbarkeit live prüfen'
};

// -----------------------------------------------------------------
// 1. ORCHESTRATOR
// -----------------------------------------------------------------
export async function gads_starte_lauf(aktion) {
  if (!process.env.G_ADS_KEY || !process.env.GCP_SA_KEY) {
    console.log('Google Ads: Secrets G_ADS_KEY/GCP_SA_KEY fehlen – Lauf übersprungen.');
    return;
  }
  const token = await gads_hole_token();
  if (aktion === 'sitelinks') return gads_lege_sitelinks_an(token);
  return gads_schreibe_bericht(token);
}

// -----------------------------------------------------------------
// 2. ZUGANG
// -----------------------------------------------------------------
async function gads_hole_token() {
  let schluessel;
  try {
    schluessel = JSON.parse(process.env.GCP_SA_KEY);
  } catch (fehler) {
    throw new Error('Secret mit Dienstkonto-Schlüssel ist kein gültiges JSON.');
  }
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: schluessel,
    scopes: ['https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/bigquery']
  });
  return auth.getAccessToken();
}

async function gads_rufe_auf(url, token, body, extraHeader = {}) {
  let antwort;
  try {
    antwort = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extraHeader },
      body: JSON.stringify(body)
    });
  } catch (fehler) {
    throw new Error(`Nicht erreichbar: ${url} (${fehler.message})`);
  }
  const text = await antwort.text();
  if (!antwort.ok) throw new Error(`${url} antwortet ${antwort.status}: ${text.slice(0, 600)}`);
  try {
    return JSON.parse(text);
  } catch (fehler) {
    throw new Error(`Antwort von ${url} ist kein JSON.`);
  }
}

function gads_url(pfad) {
  return `https://googleads.googleapis.com/${GADS.VERSION}/customers/${GADS.KUNDE}/${pfad}`;
}

async function gads_frage_ab(token, gaql) {
  const stapel = await gads_rufe_auf(gads_url('googleAds:searchStream'), token, { query: gaql },
    { 'developer-token': process.env.G_ADS_KEY });
  return (Array.isArray(stapel) ? stapel : [stapel]).flatMap(s => s.results || []);
}

// -----------------------------------------------------------------
// 3. BERICHT -> BIGQUERY
// -----------------------------------------------------------------
async function gads_schreibe_bericht(token) {
  const ergebnisse = await gads_frage_ab(token, `SELECT segments.date, campaign.id, campaign.name, ad_group.id,
    ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM ad_group WHERE segments.date DURING LAST_30_DAYS`);
  const zeilen = gads_baue_berichtszeilen(ergebnisse, new Date().toISOString());
  await gads_bq(token, `CREATE TABLE IF NOT EXISTS ${gads_tabelle()} (datum DATE, kampagne_id STRING, kampagne STRING,
    anzeigengruppe_id STRING, anzeigengruppe STRING, impressionen INT64, klicks INT64, kosten_eur FLOAT64,
    conversions FLOAT64, geladen_am TIMESTAMP)`);
  if (zeilen.length) await gads_bq(token, gads_baue_merge(), JSON.stringify(zeilen));
  const kosten = zeilen.reduce((s, z) => s + z.kosten_eur, 0);
  console.log(`Google Ads: ${zeilen.length} Tageszeilen (30 Tage, ${kosten.toFixed(2)} €) nach BigQuery.`);
}

// API-Ergebnis -> flache Zeilen (reine Logik, getestet)
export function gads_baue_berichtszeilen(ergebnisse, jetzt) {
  return ergebnisse.map(r => ({
    datum: r.segments?.date,
    kampagne_id: String(r.campaign?.id ?? ''),
    kampagne: r.campaign?.name ?? '',
    anzeigengruppe_id: String(r.adGroup?.id ?? ''),
    anzeigengruppe: r.adGroup?.name ?? '',
    impressionen: Number(r.metrics?.impressions ?? 0),
    klicks: Number(r.metrics?.clicks ?? 0),
    kosten_eur: Math.round(Number(r.metrics?.costMicros ?? 0) / 10000) / 100,
    conversions: Number(r.metrics?.conversions ?? 0),
    geladen_am: jetzt
  })).filter(z => z.datum && z.anzeigengruppe_id);
}

function gads_tabelle() {
  return `\`${GADS.PROJEKT}.${GADS.DATASET}.${GADS.TABELLE}\``;
}

function gads_baue_merge() {
  return `MERGE ${gads_tabelle()} z USING (
    SELECT DATE(JSON_VALUE(x, '$.datum')) datum, JSON_VALUE(x, '$.kampagne_id') kampagne_id, JSON_VALUE(x, '$.kampagne') kampagne,
      JSON_VALUE(x, '$.anzeigengruppe_id') anzeigengruppe_id, JSON_VALUE(x, '$.anzeigengruppe') anzeigengruppe,
      CAST(JSON_VALUE(x, '$.impressionen') AS INT64) impressionen, CAST(JSON_VALUE(x, '$.klicks') AS INT64) klicks,
      CAST(JSON_VALUE(x, '$.kosten_eur') AS FLOAT64) kosten_eur, CAST(JSON_VALUE(x, '$.conversions') AS FLOAT64) conversions,
      TIMESTAMP(JSON_VALUE(x, '$.geladen_am')) geladen_am
    FROM UNNEST(JSON_QUERY_ARRAY(@daten)) x) n
  ON z.datum = n.datum AND z.anzeigengruppe_id = n.anzeigengruppe_id
  WHEN MATCHED THEN UPDATE SET kampagne = n.kampagne, anzeigengruppe = n.anzeigengruppe, impressionen = n.impressionen,
    klicks = n.klicks, kosten_eur = n.kosten_eur, conversions = n.conversions, geladen_am = n.geladen_am
  WHEN NOT MATCHED THEN INSERT (datum, kampagne_id, kampagne, anzeigengruppe_id, anzeigengruppe, impressionen, klicks,
    kosten_eur, conversions, geladen_am) VALUES (n.datum, n.kampagne_id, n.kampagne, n.anzeigengruppe_id, n.anzeigengruppe,
    n.impressionen, n.klicks, n.kosten_eur, n.conversions, n.geladen_am)`;
}

async function gads_bq(token, sql, daten) {
  const abfrage = { query: sql, useLegacySql: false, location: 'EU', timeoutMs: 120000 };
  if (daten !== undefined) abfrage.queryParameters = [{ name: 'daten', parameterType: { type: 'STRING' }, parameterValue: { value: daten } }];
  const antwort = await gads_rufe_auf(`https://bigquery.googleapis.com/bigquery/v2/projects/${GADS.PROJEKT}/queries`, token, abfrage);
  if (!antwort.jobComplete) throw new Error('BigQuery: Abfrage nicht rechtzeitig fertig.');
}

// -----------------------------------------------------------------
// 4. SITELINKS (einmalig, nur fehlende anlegen)
// -----------------------------------------------------------------
async function gads_lege_sitelinks_an(token) {
  const vorhanden = await gads_frage_ab(token, `SELECT asset.sitelink_asset.link_text FROM campaign_asset
    WHERE campaign.id = ${GADS.KAMPAGNE} AND campaign_asset.field_type = 'SITELINK' AND campaign_asset.status = 'ENABLED'`);
  const operationen = gads_baue_sitelink_operationen(vorhanden.map(r => r.asset?.sitelinkAsset?.linkText));
  if (operationen.length === 0) {
    console.log('Google Ads: Stadt-Sitelinks sind schon vorhanden – nichts zu tun.');
    return;
  }
  await gads_rufe_auf(gads_url('googleAds:mutate'), token, { mutateOperations: operationen },
    { 'developer-token': process.env.G_ADS_KEY });
  console.log(`Google Ads: ${operationen.length / 2} Stadt-Sitelink(s) angelegt.`);
}

// Fehlende Sitelinks -> Asset anlegen + an Kampagne hängen (temporäre IDs -1, -2, …; reine Logik, getestet)
export function gads_baue_sitelink_operationen(vorhandeneTexte) {
  const fehlend = GADS.SITELINKS.filter(s => !vorhandeneTexte.includes(s.linkText));
  return fehlend.flatMap((s, i) => {
    const asset = `customers/${GADS.KUNDE}/assets/-${i + 1}`;
    return [
      { assetOperation: { create: { resourceName: asset, finalUrls: [s.url],
        sitelinkAsset: { linkText: s.linkText, description1: GADS.SITELINK_TEXT1, description2: GADS.SITELINK_TEXT2 } } } },
      { campaignAssetOperation: { create: { campaign: `customers/${GADS.KUNDE}/campaigns/${GADS.KAMPAGNE}`,
        asset, fieldType: 'SITELINK' } } }
    ];
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  gads_starte_lauf(process.argv[2] || 'bericht').catch(fehler => {
    console.error(`Google Ads: ${fehler.message}`);
    process.exit(1);
  });
}
