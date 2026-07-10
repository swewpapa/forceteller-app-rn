module.exports = {
  root: true,
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
            except: ['./home', './auth', './theme'],
          },
          {
            target: './src/features/today',
            from: './src/features',
            except: ['./today', './auth'],
          },
          {
            target: './src/features/premium',
            from: './src/features',
            except: ['./premium', './auth'],
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
        ],
      },
    ],
  },
};
