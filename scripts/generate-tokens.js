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
  'src/shared/components/typography/generated',
);

// generate()의 반환 키 ↔ 파일 경로 매핑. 새 출력이 생기면 여기에도 등록해야 하며,
// 빠뜨리면 아래 가드가 실패한다(조용히 파일이 안 써지는 사고 방지).
const OUT_PATHS = {
  paletteTs: path.join(THEME_OUT_DIR, 'palette.ts'),
  modeColorsTs: path.join(THEME_OUT_DIR, 'mode-colors.ts'),
  spacingTs: path.join(THEME_OUT_DIR, 'spacing.ts'),
  radiusTs: path.join(THEME_OUT_DIR, 'radius.ts'),
  typographyTs: path.join(TYPOGRAPHY_OUT_DIR, 'typography.ts'),
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
fs.mkdirSync(TYPOGRAPHY_OUT_DIR, { recursive: true });

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
