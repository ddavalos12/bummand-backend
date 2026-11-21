const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    entry: {
      main: './src/main.ts',
      vercel: './src/vercel.ts',
    },
    externals: [nodeExternals()],
    output: {
      ...(options.output || {}),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
  };
};
