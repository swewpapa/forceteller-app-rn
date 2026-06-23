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
          {
            target: './src/features/home',
            from: './src/features',
            except: ['./home'],
          },
          {
            target: './src/features/today',
            from: './src/features',
            except: ['./today'],
          },
          {
            target: './src/features/premium',
            from: './src/features',
            except: ['./premium'],
          },
          {
            target: './src/features/more',
            from: './src/features',
            except: ['./more'],
          },
        ],
      },
    ],
  },
};
