// Goldene Fälle für anfragen_sync.mjs (reine Logik, ohne Netzwerk). Aufruf: node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ads_sync_normalisiere_email, ads_sync_normalisiere_telefon, ads_sync_wandle_wix,
  ads_sync_wandle_sites, ads_sync_baue_zeile, ads_sync_baue_wix_abfrage, ads_sync_hashe
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
  assert.deepEqual(ads_sync_wandle_wix({ _id: 'abc', _createdDate: { $date: '2026-11-26T17:35:06.047Z' }, email: 'a@b.de' }),
    { id: 'wix:abc', quelle: 'wix', zeit: '2026-11-26T17:35:06.047Z', email: 'a@b.de', telefon: undefined });
  assert.equal(ads_sync_wandle_wix({ _createdDate: '2026-11-25T08:18:45Z' }), null);
  assert.equal(ads_sync_wandle_wix({ _id: 'y' }), null);
});

test('sites: nur Direktbuchung Website mit gültigem JSON', () => {
  const zeile = ['26.11.2026 10:00:00', 'Direktbuchung Website', 'T', 'go1', 'Firma', '', 'x@firma.de', '0176 1234567',
    '', '', '', '', '', 'Gebucht', JSON.stringify({ bookingId: 'BK-SITE-123456', timestamp: '2026-11-26T09:00:00.000Z' })];
  assert.deepEqual(ads_sync_wandle_sites(zeile),
    { id: 'site:BK-SITE-123456', quelle: 'a.l8street.com', zeit: '2026-11-26T09:00:00.000Z', email: 'x@firma.de', telefon: '0176 1234567' });
  assert.equal(ads_sync_wandle_sites(['', 'Profil-Update']), null);
  assert.equal(ads_sync_wandle_sites(zeile.slice(0, 14).concat(['kaputt'])), null);
});

test('Zeile: gehasht + OK; ohne Kontakt -> Manuell prüfen', () => {
  const ok = ads_sync_baue_zeile({ id: 'wix:abc', quelle: 'wix', zeit: 'Z', email: 'Test@Firma.de' }, 'J');
  assert.equal(ok.email_sha256, ads_sync_hashe('test@firma.de'));
  assert.equal(ok.telefon_sha256, null);
  assert.equal(ok.status, 'OK');
  assert.equal(ads_sync_baue_zeile({ id: 'x', quelle: 'wix', zeit: 'Z', email: 'kaputt' }, 'J').status, 'Manuell prüfen');
  assert.equal(ads_sync_hashe('a').length, 64);
});

test('Wix-Abfrage: ab Datum, Seitenversatz', () => {
  const a = ads_sync_baue_wix_abfrage('2026-11-01T00:00:00.000Z', 2);
  assert.equal(a.query.filter._createdDate.$gt.$date, '2026-11-01T00:00:00.000Z');
  assert.equal(a.query.paging.offset, 200);
  assert.equal(a.dataCollectionId, 'getAQuote033');
});
