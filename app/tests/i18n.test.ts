import test from 'node:test';
import assert from 'node:assert/strict';
import { isRtl, label, languages, languageSupported } from '../src/i18n/ui.ts';

test('15 locales including the two RTL scripts', () => {
  assert.equal(languages.length, 15);
  assert.equal(new Set(languages.map(l => l.code)).size, 15);
  assert.ok(isRtl('ar') && isRtl('he'));
  assert.equal(isRtl('fr'), false);
});
test('all labels always have a non-empty fallback', () => {
  assert.ok(languageSupported('zh-TW'));
  assert.ok(!languageSupported('xx'));
  for (const l of languages) {
    for (const key of ['catalog','play','pause','topology','inspector'] as const) {
      assert.ok(label(l.code, key));
    }
  }
});


test('navigation, study diagram and inspector text are translated in French and English', () => {
  for (const key of ["heroLead","heroAccent","heroDescription","labEyebrow","exploreEyebrow","events","levelInitial","levelIntermediate","levelAdvanced","groupMode","groupControls","groupWorkspace","groupParticipants","skipLink","logicalFlow","sender","receiver","inspectStep","inspectTo","selectedEvent","selectedField","sampleLabel","sampleBytes","sampleMeaning","sampleValidRange","sampleNoRange","discoveryHint","noFields","footerAlpha","footerAttribution","footerRights","diagramTcp"] as const) {
    const fr = label('fr', key);
    const en = label('en', key);
    assert.ok(fr && en, key);
    assert.notEqual(fr, en, `FR/EN translation identical: ${key}`);
    assert.equal(label('ar', key), en, `missing fallback: ${key}`);
  }
});
