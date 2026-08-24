const { resolve } = require('path');

// Resolve babel-preset-expo from the monorepo root so it works
// whether Metro is started from apps/mobile or the workspace root.
const presetExpo = (() => {
  try {
    return require.resolve('babel-preset-expo', { paths: [__dirname] });
  } catch {
    return require.resolve('babel-preset-expo', {
      paths: [resolve(__dirname, '../../')],
    });
  }
})();

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require(presetExpo)],
  };
};
