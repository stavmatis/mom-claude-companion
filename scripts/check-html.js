const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mustContain = [
  'Updated by Stavros: autosave is now ON.',
  'https://dimitra-iqos-log.loca.lt/api/vault',
  'function scheduleAutosave',
  'fetchServerVault',
  'pushServerVault',
  'Autosave saves each change instantly.'
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
