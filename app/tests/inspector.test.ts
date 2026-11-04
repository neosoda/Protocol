import assert from 'node:assert/strict';
import test from 'node:test';
import { renderInspector } from '../src/inspector/view.ts';
import { escapeHtml } from '../src/ui/escape.ts';
import { catalog } from '../src/protocols/catalog.ts';
import { label } from '../src/i18n/ui.ts';

test('fields and event labels are escaped', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  const original = catalog[0].events[0];
  const hostile = { ...original, title: '<script>evil</script>' };
  const html = renderInspector(hostile, 'expert', k => label('fr', k));
  assert.ok(html.includes('&lt;script&gt;evil'));
  assert.ok(!html.includes('<script>'));
});

test('discovery reveals only the first field and not the hex payload', () => {
  const event = catalog.find(p => p.id === 'tcp')!.events[3];
  const discovery = renderInspector(event, 'discovery', k => label('fr', k));
  const expert = renderInspector(event, 'expert', k => label('fr', k));
  assert.ok(discovery.includes('Passez en mode Expert'));
  assert.ok(expert.includes('41 42 43'));
  assert.ok(!discovery.includes('41 42 43'));
});
