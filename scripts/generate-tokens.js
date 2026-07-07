// scripts/generate-tokens.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { generate } = require('./lib/token-codegen');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/design-tokens/tokens.json');
// 모든 디자인 토큰 생성물(palette/mode-colors/spacing/radius/typography)은 theme/generated/에.
// typography도 통합 토큰 번들의 일부라 spacing/radius와 나란히 theme/generated/에 둔다—
// "생성물은 항상 generated/ 폴더 안"이라는 규칙은 유지하면서 소유권을 theme으로 일원화한다.
const THEME_OUT_DIR = path.join(ROOT, 'src/shared/theme/generated');

// generate()의 반환 키 ↔ 파일 경로 매핑. 새 출력이 생기면 여기에도 등록해야 하며,
// 빠뜨리면 아래 가드가 실패한다(조용히 파일이 안 써지는 사고 방지).
const OUT_PATHS = {
  paletteTs: path.join(THEME_OUT_DIR, 'palette.ts'),
  modeColorsTs: path.join(THEME_OUT_DIR, 'mode-colors.ts'),
  spacingTs: path.join(THEME_OUT_DIR, 'spacing.ts'),
  radiusTs: path.join(THEME_OUT_DIR, 'radius.ts'),
  typographyTs: path.join(THEME_OUT_DIR, 'typography.ts'),
};

const tokens = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const generated = generate(tokens);

const unmapped = Object.keys(generated).filter((key) => !(key in OUT_PATHS));
if (unmapped.length) {
  throw new Error(
    `generate() 출력에 대응하는 경로 없음: ${unmapped.join(', ')} — OUT_PATHS에 추가 필요`,
  );
}

fs.mkdirSync(THEME_OUT_DIR, { recursive: true });

const outputs = Object.entries(OUT_PATHS).map(([key, filePath]) => [
  filePath,
  generated[key],
]);

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
