// =================================================================
// ADS ANFRAGEN SYNC – Website-Anfragen -> BigQuery für den Google-Ads-Conversion-Import
// Quellen (nur lesen):
//   - Wix-Sammlung 'AnfrageHomepageLanding' (Formular „Angebot anfordern“ auf www.l8street.com)
//   - Tab 'sites' im Sheet „08.1_API GitHub Site - Extern“ (Buchungsformular auf a.l8street.com)
// Ziel: BigQuery l8-datenspeicherung-langzeit.kommunikation.google_ads_anfragen
//   je Anfrage eine Zeile: Anfrage-ID (Bestell-ID gegen Doppelte), Zeit, E-Mail/Telefon als SHA-256, Status
//   Ohne gültige E-Mail und ohne Telefon: Status 'Manuell prüfen' (wird nicht geraten)
// Doppelte: vorhandene IDs werden vor dem Einfügen aus BigQuery gelesen.
// Lauf: GitHub Action .github/workflows/ads-anfragen.yml (alle 6 Stunden)
// Secrets: WIX_API_KEY, GCP_SA_KEY (JSON-Schlüssel eines Dienstkontos mit BigQuery-Rechten,
//   Sheet 08.1 für dessen E-Mail freigegeben „Betrachter“)
// =================================================================
import crypto from 'node:crypto';

export const KONFIG = {
  PROJEKT: 'l8-datenspeicherung-langzeit',
  DATASET: 'kommunikation',
  TABELLE: 'google_ads_anfragen',
  WIX_SITE_ID: '1c4fe0cc-152c-4488-8ddc-3ab7fb0a1e4d',
  WIX_SAMMLUNG: 'getAQuote033',
  WIX_URL: 'https://www.wixapis.com/wix-data/v2/items/query',
  SHEET_ID: '1Aq9doxAkEw435bRCpXafayRwdNeaP9LVMU1YwWG7z70',
  SHEET_BEREICH: 'sites!A2:O',
  TAGE: 90,
  SEITE: 100,
  MAX_SEITEN: 10,
  CONVERSION_NAME: 'Angebot anfordern (Website-Formular)',
  STATUS_OK: 'OK',
  STATUS_MANUELL: 'Manuell prüfen'
};

export const SCHEMA = [
  { name: 'anfrage_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'quelle', type: 'STRING' },
  { name: 'conversion_zeit', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'email_sha256', type: 'STRING' },
  { name: 'telefon_sha256', type: 'STRING' },
  { name: 'conversion_name', type: 'STRING' },
  { name: 'status', type: 'STRING' },
  { name: 'geladen_am', type: 'TIMESTAMP' }
];

// -----------------------------------------------------------------
// 1. ORCHESTRATOR
// -----------------------------------------------------------------
export async function ads_sync_starte_lauf() {
  if (!process.env.GCP_SA_KEY || !process.env.WIX_API_KEY) {
    console.log('Ads-Anfragen: Secrets GCP_SA_KEY/WIX_API_KEY noch nicht eingetragen – Lauf übersprungen.');
    return;
  }
  const token = await ads_sync_hole_token();
  await ads_sync_sichere_tabelle(token);
  const ab = new Date(Date.now() - KONFIG.TAGE * 86400000);
  const jetzt = new Date().toISOString();
  const roh = [
    ...(await ads_sync_lies_wix(ab)).map(e => ads_sync_wandle_wix(e)),
    ...(await ads_sync_lies_sites(token)).map(z => ads_sync_wandle_sites(z))
  ].filter(e => e && new Date(e.zeit) >= ab);
  const vorhanden = await ads_sync_lies_vorhandene_ids(token);
  const zeilen = roh.filter(e => !vorhanden.has(e.id)).map(e => ads_sync_baue_zeile(e, jetzt));
  await ads_sync_fuege_ein(token, zeilen);
  console.log(`Ads-Anfragen: ${roh.length} gelesen, ${zeilen.length} neu nach BigQuery.`);
}

// -----------------------------------------------------------------
// 2. ZUGANG (Dienstkonto -> OAuth-Token)
// -----------------------------------------------------------------
async function ads_sync_hole_token() {
  let schluessel;
  try {
    schluessel = JSON.parse(process.env.GCP_SA_KEY || '');
  } catch (fehler) {
    throw new Error('Secret GCP_SA_KEY fehlt oder ist kein gültiges JSON.');
  }
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: schluessel,
    scopes: ['https://www.googleapis.com/auth/bigquery', 'https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  return (await auth.getAccessToken());
}

async function ads_sync_rufe_auf(url, optionen, erlaubt = []) {
  let antwort;
  try {
    antwort = await fetch(url, optionen);
  } catch (fehler) {
    throw new Error(`Nicht erreichbar: ${url} (${fehler.message})`);
  }
  if (antwort.ok) return antwort.json();
  if (erlaubt.includes(antwort.status)) return null;
  throw new Error(`${url} antwortet ${antwort.status}: ${(await antwort.text()).slice(0, 300)}`);
}

// -----------------------------------------------------------------
// 3. QUELLEN LESEN
// -----------------------------------------------------------------
async function ads_sync_lies_wix(ab) {
  if (!process.env.WIX_API_KEY) throw new Error('Secret WIX_API_KEY fehlt.');
  const eintraege = [];
  for (let seite = 0; seite < KONFIG.MAX_SEITEN; seite++) {
    const daten = await ads_sync_rufe_auf(KONFIG.WIX_URL, {
      method: 'POST',
      headers: { Authorization: process.env.WIX_API_KEY, 'wix-site-id': KONFIG.WIX_SITE_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify(ads_sync_baue_wix_abfrage(ab.toISOString(), seite))
    });
    const items = (daten.dataItems || []).map(item => item.data || {});
    eintraege.push(...items);
    if (items.length < KONFIG.SEITE) break;
  }
  return eintraege;
}

export function ads_sync_baue_wix_abfrage(abIso, seite) {
  return {
    dataCollectionId: KONFIG.WIX_SAMMLUNG,
    query: {
      filter: { _createdDate: { $gt: { $date: abIso } } },
      sort: [{ fieldName: '_createdDate', order: 'ASC' }],
      paging: { limit: KONFIG.SEITE, offset: seite * KONFIG.SEITE }
    }
  };
}

async function ads_sync_lies_sites(token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${KONFIG.SHEET_ID}/values/${encodeURIComponent(KONFIG.SHEET_BEREICH)}`;
  const daten = await ads_sync_rufe_auf(url, { headers: { Authorization: `Bearer ${token}` } });
  return daten.values || [];
}

// -----------------------------------------------------------------
// 4. UMWANDELN (reine Logik, getestet) -> { id, quelle, zeit, email, telefon } oder null
// -----------------------------------------------------------------
export function ads_sync_wandle_wix(eintrag) {
  const zeit = ads_sync_lies_datum(eintrag._createdDate);
  if (!eintrag._id || !zeit) return null;
  return { id: `wix:${eintrag._id}`, quelle: 'wix', zeit, email: eintrag.email, telefon: eintrag.phone };
}

// Tab 'sites': B Art, G E-Mail, H Telefon, O Payload-JSON (bookingId, timestamp)
export function ads_sync_wandle_sites(zeile) {
  if (String(zeile[1] || '').trim() !== 'Direktbuchung Website') return null;
  let payload;
  try {
    payload = JSON.parse(zeile[14] || '');
  } catch (fehler) {
    return null;
  }
  const zeit = ads_sync_lies_datum(payload.timestamp);
  if (!payload.bookingId || !zeit) return null;
  return { id: `site:${payload.bookingId}`, quelle: 'a.l8street.com', zeit, email: zeile[6], telefon: zeile[7] };
}

export function ads_sync_baue_zeile(eintrag, jetzt) {
  const email = ads_sync_normalisiere_email(eintrag.email);
  const telefon = ads_sync_normalisiere_telefon(eintrag.telefon);
  return {
    anfrage_id: eintrag.id,
    quelle: eintrag.quelle,
    conversion_zeit: eintrag.zeit,
    email_sha256: email ? ads_sync_hashe(email) : null,
    telefon_sha256: telefon ? ads_sync_hashe(telefon) : null,
    conversion_name: KONFIG.CONVERSION_NAME,
    status: email || telefon ? KONFIG.STATUS_OK : KONFIG.STATUS_MANUELL,
    geladen_am: jetzt
  };
}

// Wix liefert Datumsfelder als { $date: '…' } oder als Text
export function ads_sync_lies_datum(wert) {
  const text = wert && typeof wert === 'object' ? wert.$date : wert;
  if (!text) return '';
  const datum = new Date(text);
  return isNaN(datum.getTime()) ? '' : datum.toISOString();
}

// Google-Vorgabe: klein, ohne Leerzeichen; ungültig -> ''
export function ads_sync_normalisiere_email(wert) {
  const email = String(wert || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) ? email : '';
}

// Google-Vorgabe: E.164 (+49…); (0) und 0049/0 werden bereinigt; unklar -> ''
export function ads_sync_normalisiere_telefon(wert) {
  let nummer = String(wert || '').trim().replace(/\(0\)/g, '').replace(/[^\d+]/g, '');
  if (nummer.startsWith('00')) nummer = '+' + nummer.slice(2);
  else if (nummer.startsWith('0')) nummer = '+49' + nummer.slice(1);
  if (nummer.startsWith('+490')) nummer = '+49' + nummer.slice(4);
  return /^\+[1-9]\d{7,14}$/.test(nummer) ? nummer : '';
}

export function ads_sync_hashe(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// -----------------------------------------------------------------
// 5. BIGQUERY
// -----------------------------------------------------------------
const BQ = `https://bigquery.googleapis.com/bigquery/v2/projects/${KONFIG.PROJEKT}`;

async function ads_sync_sichere_tabelle(token) {
  const tabelle = { tableReference: { projectId: KONFIG.PROJEKT, datasetId: KONFIG.DATASET, tableId: KONFIG.TABELLE },
    description: 'Website-Anfragen für den Google-Ads-Conversion-Import (apiExtern/ads)', schema: { fields: SCHEMA } };
  await ads_sync_rufe_auf(`${BQ}/datasets/${KONFIG.DATASET}/tables`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(tabelle)
  }, [409]); // 409 = gibt es schon
}

async function ads_sync_lies_vorhandene_ids(token) {
  const abfrage = { query: `SELECT anfrage_id FROM \`${KONFIG.PROJEKT}.${KONFIG.DATASET}.${KONFIG.TABELLE}\``,
    useLegacySql: false, location: 'EU', timeoutMs: 60000, maxResults: 100000 };
  const daten = await ads_sync_rufe_auf(`${BQ}/queries`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(abfrage)
  });
  if (!daten.jobComplete) throw new Error('BigQuery: vorhandene IDs nicht rechtzeitig gelesen – Lauf abgebrochen.');
  return new Set((daten.rows || []).map(zeile => zeile.f[0].v));
}

async function ads_sync_fuege_ein(token, zeilen) {
  if (zeilen.length === 0) return;
  const daten = await ads_sync_rufe_auf(`${BQ}/datasets/${KONFIG.DATASET}/tables/${KONFIG.TABELLE}/insertAll`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows: zeilen.map(zeile => ({ insertId: zeile.anfrage_id, json: zeile })) })
  });
  if (daten.insertErrors) throw new Error(`BigQuery: Einfügefehler ${JSON.stringify(daten.insertErrors).slice(0, 500)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ads_sync_starte_lauf().catch(fehler => {
    console.error(`Ads-Anfragen: ${fehler.message}`);
    process.exit(1);
  });
}
