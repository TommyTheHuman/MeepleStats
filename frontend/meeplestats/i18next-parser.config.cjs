module.exports = {
  locales: ['en', 'it', 'de', 'fr'],

  input: ['src/**/*.{ts,tsx}'],
  output: './public/locales/$LOCALE/$NAMESPACE.json',
  defaultNamespace: 'translation',
  createOldCatalogs: false,
  keepRemoved: false,
  sort: true,
  verbose: true,
};