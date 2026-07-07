const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mustContain = [
  'Autosave is ON.',
  'https://health.stavrosmavrommatis.com/dimitra-iqos/api/vault',
  'function scheduleAutosave',
  'fetchServerVault',
  'pushServerVault',
  'Autosave saves each change instantly.',
  'Undo last change',
  'function clampNumber',
  'window.adjustLogTotal',
  'window.undoLastChange',
  'Tap <b>End day</b> before bed',
  'function businessDate',
  'async function endDay',
  'function startDayWatcher',
  'autoStartOpenDay()'
];

const missing = mustContain.filter(s => !html.includes(s));
if (missing.length) {
  console.error('Missing expected autosave markers:', missing.join(', '));
  process.exit(1);
}

const script = html.match(/<script>([\s\S]*)<\/script>/);
if (!script) {
  console.error('Missing inline script');
  process.exit(1);
}

new Function(script[1]);
console.log('HTML autosave checks passed');
