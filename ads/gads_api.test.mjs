// Goldene Fälle für gads_api.mjs (reine Logik, ohne Netzwerk)
import test from 'node:test';
import assert from 'node:assert/strict';
import { gads_baue_berichtszeilen, gads_baue_sitelink_operationen } from './gads_api.mjs';

test('Bericht: API-Ergebnis -> Zeilen, Kosten in Euro, unvollständige Zeilen raus', () => {
  const z = gads_baue_berichtszeilen([
    { segments: { date: '2026-11-26' }, campaign: { id: '23468824534', name: 'Search' }, adGroup: { id: '192140250216', name: 'Pforzheim' },
      metrics: { impressions: '230', clicks: '20', costMicros: '150500000', conversions: 1 } },
    { segments: { date: '2026-11-26' }, campaign: { id: '1' } }
  ], 'J');
  assert.equal(z.length, 1);
  assert.deepEqual(z[0], { datum: '2026-11-26', kampagne_id: '23468824534', kampagne: 'Search', anzeigengruppe_id: '192140250216',
    anzeigengruppe: 'Pforzheim', impressionen: 230, klicks: 20, kosten_eur: 150.5, conversions: 1, geladen_am: 'J' });
});

test('Sitelinks: nur fehlende anlegen, je Sitelink Asset + Verknüpfung', () => {
  assert.equal(gads_baue_sitelink_operationen(['Wohnungen in Pforzheim', 'Wohnungen in Karlsruhe']).length, 0);
  const ops = gads_baue_sitelink_operationen(['Wohnungen in Pforzheim']);
  assert.equal(ops.length, 2);
  assert.equal(ops[0].assetOperation.create.sitelinkAsset.linkText, 'Wohnungen in Karlsruhe');
  assert.equal(ops[0].assetOperation.create.resourceName, ops[1].campaignAssetOperation.create.asset);
  assert.equal(ops[1].campaignAssetOperation.create.fieldType, 'SITELINK');
});
