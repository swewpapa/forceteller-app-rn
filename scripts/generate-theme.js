// scripts/generate-theme.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { generate } = require('./lib/token-codegen');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/design-tokens/tokens.json');
const OUT_DIR = path.join(ROOT, 'src/shared/theme/generated');

const tokens = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const { paletteTs, colorsTs } = generate(tokens);

fs.mkdirSync(OUT_DIR, { recursive: true });
const palettePath = path.join(OUT_DIR, 'palette.ts');
const colorsPath = path.join(OUT_DIR, 'colors.ts');
fs.writeFileSync(palettePath, paletteTs);
fs.writeFileSync(colorsPath, colorsTs);
execFileSync('npx', ['prettier', '--write', palettePath, colorsPath], {
  stdio: 'inherit',
});
console.log(
  `generated: ${path.relative(ROOT, palettePath)}, ${path.relative(ROOT, colorsPath)}`,
);
