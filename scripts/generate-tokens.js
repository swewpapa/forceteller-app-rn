// scripts/generate-tokens.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { generate } = require('./lib/token-codegen');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/design-tokens/tokens.json');
// 여러 컴포넌트가 공유하는 스케일(palette/mode-colors/spacing/radius)은 theme/generated/에.
// 한 컴포넌트만 쓰는 생성물(typography)은 그 컴포넌트 폴더 안 generated/에 콜로케이트—
// "생성물은 항상 generated/ 폴더 안"이라는 규칙은 동일하게 유지하면서 소유권만 다르다.
const THEME_OUT_DIR = path.join(ROOT, 'src/shared/theme/generated');
const TYPOGRAPHY_OUT_DIR = path.join(
  ROOT,
  'src/shared/components/Typography/generated',
);

const tokens = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const { paletteTs, modeColorsTs, spacingTs, radiusTs, typographyTs } =
  generate(tokens);

fs.mkdirSync(THEME_OUT_DIR, { recursive: true });
fs.mkdirSync(TYPOGRAPHY_OUT_DIR, { recursive: true });

const outputs = [
  [path.join(THEME_OUT_DIR, 'palette.ts'), paletteTs],
  [path.join(THEME_OUT_DIR, 'mode-colors.ts'), modeColorsTs],
  [path.join(THEME_OUT_DIR, 'spacing.ts'), spacingTs],
  [path.join(THEME_OUT_DIR, 'radius.ts'), radiusTs],
  [path.join(TYPOGRAPHY_OUT_DIR, 'typography.ts'), typographyTs],
];

for (const [filePath, content] of outputs) {
  fs.writeFileSync(filePath, content);
}
execFileSync(
  'npx',
  ['prettier', '--write', ...outputs.map(([filePath]) => filePath)],
  { stdio: 'inherit' },
);
console.log(
  outputs
    .map(([filePath]) => `generated: ${path.relative(ROOT, filePath)}`)
    .join('\n'),
);
