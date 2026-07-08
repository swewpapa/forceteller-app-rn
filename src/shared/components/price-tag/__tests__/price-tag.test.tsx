import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '@/shared/theme';
import { PriceTag, type PriceTagProps } from '../price-tag';

// PriceTag는 useAppColors(ThemeContext)에 의존하므로 ThemeProvider로 감싼다.
// (MMKV는 __mocks__/react-native-mmkv.js로 자동 모킹)
function renderTag(props: PriceTagProps): ReturnType<typeof TestRenderer.create> {
  let tree!: ReturnType<typeof TestRenderer.create>;
  act(() => {
    tree = TestRenderer.create(
      <ThemeProvider>
        <PriceTag {...props} />
      </ThemeProvider>,
    );
  });
  return tree;
}

// 트리의 모든 문자열 노드 수집(어떤 Text 표현이든 무관하게 렌더된 텍스트만 확인).
function collectStrings(node: unknown, acc: string[] = []): string[] {
  if (node == null) return acc;
  if (typeof node === 'string') {
    acc.push(node);
    return acc;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectStrings(child, acc);
    return acc;
  }
  if (typeof node === 'object' && 'children' in node) {
    collectStrings((node as { children: unknown }).children, acc);
  }
  return acc;
}

function renderedTexts(props: PriceTagProps): string[] {
  return collectStrings(renderTag(props).toJSON());
}

describe('PriceTag', () => {
  it('포스(가격) 12 — 천단위 콤마로 포맷', () => {
    expect(renderedTexts({ price: 1000000 })).toContain('1,000,000');
  });

  it('포스(가격) 14 — 렌더 throw 없이 최종가 표기', () => {
    expect(renderedTexts({ price: 500, size: '14' })).toContain('500');
  });

  it('discount on — 원가(취소선) 함께 표기', () => {
    const texts = renderedTexts({ price: 500, discounted: 12000, discount: true });
    expect(texts).toContain('500');
    expect(texts).toContain('12,000');
  });

  it('discount off — 원가 미표기(값이 있어도)', () => {
    const texts = renderedTexts({ price: 500, discounted: 12000, discount: false });
    expect(texts).toContain('500');
    expect(texts).not.toContain('12,000');
  });

  it('inversed — 렌더 throw 없음', () => {
    expect(() => renderTag({ price: 500, inversed: true })).not.toThrow();
  });

  it('inlineTag — percentage 표기', () => {
    expect(renderedTexts({ price: 500, inlineTag: true, percentage: '50%' })).toContain('50%');
  });

  it('bubble — percentage 표기 + 렌더 throw 없음', () => {
    expect(renderedTexts({ price: 500, bubble: true, percentage: '50%' })).toContain('50%');
  });

  it('포스(자산)/보너스포스 14 — 렌더 throw 없음', () => {
    expect(() => renderTag({ price: 500, type: 'asset', size: '14' })).not.toThrow();
    expect(() => renderTag({ price: 500, type: 'bonus', size: '14' })).not.toThrow();
  });

  it('14v — 원가/최종가 세로 스택 렌더', () => {
    const texts = renderedTexts({ price: 500, discounted: 12000, discount: true, size: '14v' });
    expect(texts).toContain('500');
    expect(texts).toContain('12,000');
  });
});
