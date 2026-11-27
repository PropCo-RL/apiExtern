// =================================================================
// 90 PR-KOMMENTAR – Ergebnis einer Prüfung in den PR schreiben
// Gibt es schon einen Bot-Kommentar mit demselben Marker, wird er
// AKTUALISIERT statt neu angelegt (keine Kommentar-Flut bei vielen Pushes).
// Frühere Läufe bleiben zugeklappt unter "Frühere Läufe" erhalten (Verlauf).
//
// Aufruf: node 90_pr_kommentar.js <Ergebnisdatei> "<!-- marker -->"
// Umgebung: GH_TOKEN, REPO (owner/name), PR_NUMMER
// Leere oder fehlende Ergebnisdatei = nichts tun.
// =================================================================
const fs = require('fs');

const API = 'https://api.github.com';
const BOT_NAME = 'github-actions[bot]';
const MAX_SEITEN = 10;
// GitHub erlaubt 65.536 Zeichen je Kommentar; älteste Läufe fallen zuerst weg
const MAX_KOMMENTAR_ZEICHEN = 60000;
const VERLAUF_START = '\n\n<details><summary>🕘 Frühere Läufe</summary>\n<!-- verlauf -->\n\n';
const VERLAUF_ENDE = '\n\n</details>';
const LAUF_TRENNER = '\n\n---\n\n';

// ==========================================
// ORCHESTRATOR (HAUPTFUNKTION)
// ==========================================
async function schreibePrKommentar() {
  const [dateiPfad, marker] = process.argv.slice(2);
  const { GH_TOKEN: token, REPO: repo, PR_NUMMER: prNummer } = process.env;
  if (!dateiPfad || !marker) return beende('Aufruf: node 90_pr_kommentar.js <Datei> <Marker>');
  if (!token || !repo || !prNummer) return beende('GH_TOKEN, REPO oder PR_NUMMER fehlt.');

  const text = leseErgebnis(dateiPfad);
  if (!text) return console.log(`Keine Ergebnisdatei (${dateiPfad}), kein Kommentar nötig.`);

  const zeit = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  const lauf = `${text.startsWith(marker) ? text.slice(marker.length).trim() : text}\n\n<sub>Lauf vom ${zeit}</sub>`;
  const inhalt = `${marker}\n${lauf}`;
  const vorhanden = await findeKommentar(repo, prNummer, marker, token);
  if (vorhanden) {
    const neuerText = baueMitVerlauf(marker, lauf, String(vorhanden.body || ''));
    await rufeApi('PATCH', `/repos/${repo}/issues/comments/${vorhanden.id}`, token, { body: neuerText });
    console.log(`Kommentar ${vorhanden.id} aktualisiert (Verlauf behalten).`);
    return;
  }
  await rufeApi('POST', `/repos/${repo}/issues/${prNummer}/comments`, token, { body: inhalt });
  console.log('Neuer Kommentar angelegt.');
}

function leseErgebnis(dateiPfad) {
  try {
    if (!fs.existsSync(dateiPfad)) return '';
    return fs.readFileSync(dateiPfad, 'utf8').trim();
  } catch (fehler) {
    console.log(`::warning::Ergebnisdatei nicht lesbar: ${fehler.message}`);
    return '';
  }
}

// Neuer Lauf oben, bisheriger Stand + ältere Läufe zugeklappt darunter
function baueMitVerlauf(marker, lauf, alterText) {
  const teile = alterText.trimStart().slice(marker.length).split(VERLAUF_START);
  const bisherigerLauf = teile[0].trim();
  const rest = teile.slice(1).join(VERLAUF_START);
  const ohneEnde = rest.endsWith(VERLAUF_ENDE) ? rest.slice(0, -VERLAUF_ENDE.length) : rest;
  const aeltere = ohneEnde ? ohneEnde.split(LAUF_TRENNER) : [];
  const verlauf = [bisherigerLauf, ...aeltere].filter(Boolean);
  let text = '';
  while (verlauf.length > 0) {
    text = `${marker}\n${lauf}${VERLAUF_START}${verlauf.join(LAUF_TRENNER)}${VERLAUF_ENDE}`;
    if (text.length <= MAX_KOMMENTAR_ZEICHEN) return text;
    verlauf.pop();
  }
  return `${marker}\n${lauf}`;
}

// Sucht den ältesten Bot-Kommentar mit genau diesem Marker
async function findeKommentar(repo, prNummer, marker, token) {
  for (let seite = 1; seite <= MAX_SEITEN; seite++) {
    const kommentare = await rufeApi('GET', `/repos/${repo}/issues/${prNummer}/comments?per_page=100&page=${seite}`, token);
    if (!Array.isArray(kommentare) || kommentare.length === 0) return null;
    // Marker muss am Anfang stehen (zitierte Marker anderer Checks zählen nicht)
    const treffer = kommentare.find(k => k.user && k.user.login === BOT_NAME && String(k.body || '').trimStart().startsWith(marker));
    if (treffer) return treffer;
    if (kommentare.length < 100) return null;
  }
  return null;
}

async function rufeApi(methode, pfad, token, daten) {
  try {
    const antwort = await fetch(API + pfad, {
      method: methode,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'appscripts-pruefungen',
        'Content-Type': 'application/json'
      },
      body: daten ? JSON.stringify(daten) : undefined
    });
    const rohText = await antwort.text();
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}: ${rohText.slice(0, 300)}`);
    return rohText ? JSON.parse(rohText) : null;
  } catch (fehler) {
    throw new Error(`GitHub-API ${methode} ${pfad} fehlgeschlagen: ${fehler.message}`);
  }
}

function beende(nachricht) {
  console.log(`::error::${nachricht}`);
  process.exitCode = 1;
}

schreibePrKommentar().catch(fehler => beende(fehler.message || String(fehler)));
