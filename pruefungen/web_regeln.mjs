// =================================================================
// WEB-REGELN – feste Prüfung für die Website a.l8street.com (Pflicht = PR rot, Hinweis = nur Warnung)
// Baut alle Seiten probeweise mit Testdaten (kein Zugriff auf das echte Sheet) und prüft:
// PFLICHT: Bau läuft fehlerfrei · nur Pico v2 als Stylesheet · jede Seite hat Kopf + Fuß aus header_footer.html
//          (Cookie-Banner) · GA4/gtag nur über header_footer.html (Zustimmung)
// HINWEIS: Fremd-Skripte ohne feste Version (@latest) · Fremddienste nicht in legal.html · Dateien > 350 Zeilen
// Regeln und Begründung: CLAUDE.md. Aufruf: node pruefungen/web_regeln.mjs
// =================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const WURZEL = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ERLAUBTES_CSS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@picocss\/pico@2\/css\/pico\.slate\.min\.css$/;
const QUELLDATEIEN = ['generate.js', 'apartment_template.js', 'css.js', 'header_footer.html', 'legal.html'];
const MAX_ZEILEN = 350;
const fehler = [];
const hinweise = [];

// -----------------------------------------------------------------
// 1. ORCHESTRATOR
// -----------------------------------------------------------------
function web_regeln_starte() {
  const seiten = web_regeln_baue_probe();
  if (seiten) seiten.forEach(s => web_regeln_pruefe_seite(s.datei, s.html));
  web_regeln_pruefe_quellen();
  web_regeln_pruefe_groesse();
  hinweise.forEach(h => console.log(`::warning::Web-Regeln (Hinweis): ${h}`));
  fehler.forEach(f => console.log(`::error::Web-Regeln (Pflicht): ${f}`));
  console.log(`Web-Regeln: ${seiten ? seiten.length : 0} Seite(n) gebaut, ${fehler.length} Fehler, ${hinweise.length} Hinweis(e).`);
  if (fehler.length) process.exit(1);
}

// -----------------------------------------------------------------
// 2. PROBE-BAU MIT TESTDATEN
// -----------------------------------------------------------------
function web_regeln_baue_probe() {
  const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'l8-probe-'));
  for (const datei of fs.readdirSync(WURZEL)) {
    if (/\.(js|html)$/.test(datei) || datei.startsWith('home_s_')) fs.copyFileSync(path.join(WURZEL, datei), path.join(ziel, datei));
  }
  const stub = path.join(ziel, 'fetch_stub.mjs');
  fs.writeFileSync(stub, `const wohnung = (n, stadt) => ({ Apartment: 'a/test' + n, title: 'Monteurwohnung ' + stadt, city: stadt,
    regions: stadt + ' (' + stadt + ')', internalTitle: 'T' + n, displayAddress: 'Teststraße ' + n + ', ' + stadt, images: '', pricePerNight: 49 });
  globalThis.fetch = async (url) => ({ json: async () => String(url).includes('getAllApartments')
    ? [wohnung(1, 'Pforzheim'), wohnung(2, 'Karlsruhe')] : {} });`);
  try {
    execFileSync(process.execPath, ['--import', stub, 'generate.js'], { cwd: ziel, stdio: 'pipe', timeout: 60000 });
  } catch (f) {
    fehler.push(`generate.js baut die Seiten nicht: ${String(f.stderr || f.message).slice(0, 400)}`);
    return null;
  }
  const seiten = web_regeln_finde_html(ziel).map(datei => ({ datei: path.relative(ziel, datei), html: fs.readFileSync(datei, 'utf8') }));
  if (seiten.length < 4) fehler.push(`Probe-Bau erzeugt nur ${seiten.length} Seite(n) – erwartet Startseite, Stadt-, Wohnungs- und Rechtsseiten.`);
  return seiten;
}

function web_regeln_finde_html(ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap(e => {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) return web_regeln_finde_html(p);
    return e.name === 'index.html' ? [p] : [];
  });
}

// -----------------------------------------------------------------
// 3. PRÜFUNGEN JE SEITE (PFLICHT)
// -----------------------------------------------------------------
export function web_regeln_pruefe_seite(datei, html, liste = fehler) {
  const css = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)].map(m => (m[0].match(/href=["']([^"']+)/) || [])[1]);
  css.filter(href => !ERLAUBTES_CSS.test(href || '')).forEach(href => liste.push(`${datei}: Stylesheet „${href}“ – erlaubt ist nur Pico v2 (pico.slate.min.css).`));
  if (!html.includes('id="cookie-banner"')) liste.push(`${datei}: Fuß aus header_footer.html fehlt (kein Cookie-Banner).`);
  if (!/<header[\s>]/i.test(html)) liste.push(`${datei}: Kopf aus header_footer.html fehlt.`);
  if (/<script[^>]+src=["']https:\/\/www\.googletagmanager\.com/i.test(html)) liste.push(`${datei}: GA4-Tag fest eingebunden – GA4 darf nur nach Zustimmung über header_footer.html laden.`);
}

// -----------------------------------------------------------------
// 4. QUELLTEXT: TRACKING NUR IM FUSS (PFLICHT), VERSIONEN + DATENSCHUTZ (HINWEIS)
// -----------------------------------------------------------------
function web_regeln_pruefe_quellen() {
  const datenschutz = fs.readFileSync(path.join(WURZEL, 'legal.html'), 'utf8').toLowerCase();
  const dateien = fs.readdirSync(WURZEL).filter(d => /\.(js|html)$/.test(d) || d.startsWith('home_s_'));
  for (const datei of dateien) {
    const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
    if (datei !== 'header_footer.html' && /googletagmanager|gtag\(/.test(text)) fehler.push(`${datei}: GA4/gtag außerhalb von header_footer.html – Meldungen nur über l8MeldeAnfrage().`);
    if (/<script[^>]+src=["'][^"']*@latest/.test(text)) hinweise.push(`${datei}: Fremd-Skript mit @latest – besser feste Version.`);
    for (const host of web_regeln_fremdhosts(text)) {
      const basis = host.split('.').slice(-2, -1)[0];
      if (!datenschutz.includes(basis)) hinweise.push(`${datei}: Fremddienst ${host} steht nicht in legal.html (Datenschutzerklärung).`);
    }
  }
}

export function web_regeln_fremdhosts(text) {
  const hosts = [...text.matchAll(/<(?:script|link)[^>]+(?:src|href)=["']https:\/\/([^/"']+)/gi)].map(m => m[1]);
  return [...new Set(hosts)].filter(h => !/(^|\.)l8street\.com$/.test(h) && !h.includes('jsdelivr'));
}

function web_regeln_pruefe_groesse() {
  for (const datei of QUELLDATEIEN.concat(fs.readdirSync(path.join(WURZEL, 'ads')).map(d => 'ads/' + d))) {
    const pfad = path.join(WURZEL, datei);
    if (!fs.existsSync(pfad) || !/\.(js|mjs|html)$/.test(datei)) continue;
    const zeilen = fs.readFileSync(pfad, 'utf8').split('\n').length;
    if (zeilen > MAX_ZEILEN) hinweise.push(`${datei}: ${zeilen} Zeilen (Richtwert ${MAX_ZEILEN}) – bei Änderungen eher aufteilen.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) web_regeln_starte();
