module.exports = {
  root: true,
  // ota-poc/는 독립 실험 워크스페이스(gitignore) — 앱 린트 대상에서 제외.
  ignorePatterns: ['ota-poc/'],
  extends: '@react-native',
  plugins: ['import'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // 인증 가드 우회 방지: 화면에서 useNavigation 직접 사용 금지.
    // use-app-navigation.ts, login-screen.tsx 등 의도적 사용처에는 eslint-disable-line 주석.
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@react-navigation/native',
            importNames: ['useNavigation'],
            message:
              'useNavigation 직접 사용 금지. useAppNavigation으로 이동하세요 (인증 가드 우회 방지).',
          },
        ],
      },
    ],
    // import 순서 강제(autofix): react → react-native → 외부 → @/(internal) → 상대.
    // 그룹 내 알파벳 정렬은 diff 최소화를 위해 미적용.
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'react-native', group: 'external', position: 'before' },
          { pattern: '@/**', group: 'internal' },
        ],
        pathGroupsExcludedImportTypes: ['react', 'react-native'],
      },
    ],
    // Domain-based architecture boundaries: shared -> features -> app.
    // See docs/architecture.md.
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // `shared` is the lowest layer: must not import features or app.
          { target: './src/shared', from: './src/features' },
          { target: './src/shared', from: './src/app' },
          // `features` must not import from the app layer.
          { target: './src/features', from: './src/app' },
          // No cross-feature imports — each feature is isolated.
          // Exceptions (cross-consumable): `auth` (foundation infra: nav guard, auth store)
          // and `theme` (content domain rendered by multiple screens).
          {
            target: './src/features/home',
            from: './src/features',
            except: ['./home', './auth', './theme', './freeforce'],
          },
          {
            target: './src/features/today',
            from: './src/features',
            except: ['./today', './auth', './freeforce'],
          },
          {
            target: './src/features/premium',
            from: './src/features',
            except: ['./premium', './auth', './freeforce'],
          },
          {
            target: './src/features/more',
            from: './src/features',
            // `user`(me/profile) 소비: 마이페이지가 프로필 실데이터를 읽는다(home→theme 선례와 동일).
            except: ['./more', './auth', './user'],
          },
          // `user`(계정/프로필 도메인)는 auth(foundation)만 소비 — 다른 feature import 금지.
          {
            target: './src/features/user',
            from: './src/features',
            except: ['./user', './auth'],
          },
          // `freeforce`(무료충전 도메인): auth만 소비. 앱바 툴팁 표시조건 훅 등.
          {
            target: './src/features/freeforce',
            from: './src/features',
            except: ['./freeforce', './auth'],
          },
        ],
      },
    ],
  },
};
