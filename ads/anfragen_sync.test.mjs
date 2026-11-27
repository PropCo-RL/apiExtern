// Goldene Fälle für anfragen_sync.mjs (reine Logik, ohne Netzwerk). Aufruf: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ads_sync_normalisiere_email, ads_sync_normalisiere_telefon, ads_sync_wandle_wix,
  ads_sync_wandle_sites, ads_sync_baue_zeile, ads_sync_baue_wix_abfrage, ads_sync_hashe,
  ads_sync_lies_personen, ads_sync_lies_tage, ads_sync_bestimme_status, ads_sync_tage_zwischen,
  ads_sync_entferne_doppelte
} from './anfragen_sync.mjs';

test('E-Mail: klein, ohne Leerzeichen; ungültig -> leer', () => {
  assert.equal(ads_sync_normalisiere_email('  Max.Muster@Firma.DE '), 'max.muster@firma.de');
  assert.equal(ads_sync_normalisiere_email('keine-mail'), '');
  assert.equal(ads_sync_normalisiere_email(undefined), '');
  assert.equal(ads_sync_normalisiere_email('k.A.'), '');
});

test('Telefon: 0…, 0049, +49 (0)…, +43; zu kurz -> leer', () => {
  assert.equal(ads_sync_normalisiere_telefon('0176 123 456 78'), '+4917612345678');
  assert.equal(ads_sync_normalisiere_telefon('0049 (0)176-1234567'), '+491761234567');
  assert.equal(ads_sync_normalisiere_telefon('+49 (0)176 1234567'), '+491761234567');
  assert.equal(ads_sync_normalisiere_telefon('+49 0176 1234567'), '+491761234567');
  assert.equal(ads_sync_normalisiere_telefon('+43 660 1234567'), '+436601234567');
  assert.equal(ads_sync_normalisiere_telefon('123'), '');
  assert.equal(ads_sync_normalisiere_telefon('k.A.'), '');
});

test('Wix: Datum als {$date}, ohne ID/Datum -> null', () => {
  assert.deepEqual(ads_sync_wandle_wix({ _id: 'abc', _createdDate: { $date: '2026-11-26T17:35:06.047Z' }, email: 'a@b.de',
    kopieVonDuration: '4', feldFurKurzeAntwort: '1 Monat' }),
    { id: 'wix:abc', quelle: 'wix', zeit: '2026-11-26T17:35:06.047Z', email: 'a@b.de', telefon: undefined, personen: '4', dauer: '1 Monat' });
  assert.equal(ads_sync_wandle_wix({ _createdDate: '2026-11-25T08:18:45Z' }), null);
  assert.equal(ads_sync_wandle_wix({ _id: 'y' }), null);
});

test('sites: nur Direktbuchung Website mit gültigem JSON', () => {
  const zeile = ['26.11.2026 10:00:00', 'Direktbuchung Website', 'T', 'go1', 'Firma', '', 'x@firma.de', '0176 1234567',
    '01.12.2026', '15.12.2026', '4', '', '', 'Gebucht', JSON.stringify({ bookingId: 'BK-SITE-123456', timestamp: '2026-11-26T09:00:00.000Z',
    startDate: '2026-12-01', endDate: '2026-12-15', guestsCount: '4' })];
  assert.deepEqual(ads_sync_wandle_sites(zeile),
    { id: 'site:BK-SITE-123456', quelle: 'a.l8street.com', zeit: '2026-11-26T09:00:00.000Z', email: 'x@firma.de', telefon: '0176 1234567',
      personen: '4', dauer: '14 Tage' });
  assert.equal(ads_sync_wandle_sites(['', 'Profil-Update']), null);
  assert.equal(ads_sync_wandle_sites(zeile.slice(0, 14).concat(['kaputt'])), null);
});

test('Zeile: gehasht + OK; ohne Kontakt -> Manuell prüfen', () => {
  const ok = ads_sync_baue_zeile({ id: 'wix:abc', quelle: 'wix', zeit: 'Z', email: 'Test@Firma.de', personen: '3', dauer: '7' }, 'J');
  assert.equal(ok.email_sha256, ads_sync_hashe('test@firma.de'));
  assert.equal(ok.telefon_sha256, null);
  assert.equal(ok.status, 'OK');
  assert.equal(ads_sync_baue_zeile({ id: 'x', quelle: 'wix', zeit: 'Z', email: 'kaputt', personen: '4', dauer: '2 Monate' }, 'J').status, 'Manuell prüfen');
  assert.equal(ok.personen, 3);
  assert.equal(ok.aufenthalt_tage, 7);
  assert.equal(ads_sync_hashe('a').length, 64);
});

test('Wix-Abfrage: ab Datum, Seitenversatz', () => {
  const a = ads_sync_baue_wix_abfrage('2026-11-01T00:00:00.000Z', 2);
  assert.equal(a.query.filter._createdDate.$gt.$date, '2026-11-01T00:00:00.000Z');
  assert.equal(a.query.paging.offset, 200);
  assert.equal(a.dataCollectionId, 'getAQuote033');
});

test('Qualifizierung: ab 3 Personen und ab 6 Tagen (offen/verlängerbar zählt)', () => {
  assert.equal(ads_sync_bestimme_status(true, 3, 6), 'OK');
  assert.equal(ads_sync_bestimme_status(true, 4, 999), 'OK');
  assert.equal(ads_sync_bestimme_status(true, 2, 60), 'Nicht qualifiziert');
  assert.equal(ads_sync_bestimme_status(true, 5, 4), 'Nicht qualifiziert');
  assert.equal(ads_sync_bestimme_status(true, null, 30), 'Manuell prüfen');
  assert.equal(ads_sync_bestimme_status(true, 4, null), 'Manuell prüfen');
  assert.equal(ads_sync_bestimme_status(false, 4, 30), 'Manuell prüfen');
  assert.equal(ads_sync_bestimme_status(false, 1, 30), 'Nicht qualifiziert');
});

test('Personen und Mietdauer aus Freitext', () => {
  assert.equal(ads_sync_lies_personen('4'), 4);
  assert.equal(ads_sync_lies_personen('2 persoane'), 2);
  assert.equal(ads_sync_lies_personen('Zinalda'), null);
  assert.equal(ads_sync_lies_tage('1 Monat'), 30);
  assert.equal(ads_sync_lies_tage('2 wochen'), 14);
  assert.equal(ads_sync_lies_tage('4 Nächte'), 4);
  assert.equal(ads_sync_lies_tage('14 Tage'), 14);
  assert.equal(ads_sync_lies_tage('7'), 7);
  assert.equal(ads_sync_lies_tage('2'), null);
  assert.equal(ads_sync_lies_tage('unbefristet'), 999);
  assert.equal(ads_sync_lies_tage('1 Woche, Option auf Verlängerung'), 999);
  assert.equal(ads_sync_lies_tage(''), null);
  assert.equal(ads_sync_lies_tage('12 luni'), null);
  assert.equal(ads_sync_lies_tage('06.12.2026'), null);
  assert.equal(ads_sync_lies_tage('10.12.–20.12.'), null);
  assert.equal(ads_sync_lies_personen('2 Teams à 5 Personen'), null);
  assert.equal(ads_sync_lies_tage('4 Monteure, 3 Wochen'), null);
  assert.equal(ads_sync_lies_tage('3 Montage'), null);
  assert.equal(ads_sync_lies_tage('2 Wochen, ggf. 3 Monate'), null);
  assert.equal(ads_sync_lies_tage('Zeitraum noch offen'), null);
  assert.equal(ads_sync_lies_tage('keine Verlängerung'), null);
  assert.equal(ads_sync_lies_tage('ohne Option auf Verlängerung'), null);
  assert.equal(ads_sync_lies_tage('nicht unbefristet'), null);
  assert.equal(ads_sync_lies_tage('6 Monate'), 180);
  assert.deepEqual(ads_sync_entferne_doppelte([{ anfrage_id: 'a', s: 1 }, { anfrage_id: 'a', s: 2 }, { anfrage_id: 'b' }]),
    [{ anfrage_id: 'a', s: 2 }, { anfrage_id: 'b' }]);
  assert.equal(ads_sync_tage_zwischen('2026-12-01', '2026-12-15'), '14 Tage');
  assert.equal(ads_sync_tage_zwischen('', '2026-12-15'), '');
});
