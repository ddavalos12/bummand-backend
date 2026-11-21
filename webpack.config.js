const nodeExternals = require('webpack-node-externals');

const MODULOS_ESM_EMPAQUETAR = [
  /^@nestjs\/config(\/.*)?$/,
  /^@nestjs\/typeorm(\/.*)?$/,
  /^@nestjs\/jwt(\/.*)?$/,
  /^@nestjs\/passport(\/.*)?$/,
  /^@nestjs\/mapped-types(\/.*)?$/,
  /^@nestjs\/schedule(\/.*)?$/,
  /^@standard-schema\/spec(\/.*)?$/,
  /^es-toolkit(\/.*)?$/,
  /^marked(\/.*)?$/,
];

module.exports = function (options) {
  return {
    ...options,
    entry: {
      main: './src/main.ts',
      vercel: './src/vercel.ts',
    },
    externals: [
      nodeExternals({
        allowlist: MODULOS_ESM_EMPAQUETAR,
      }),
    ],
    output: {
      ...(options.output || {}),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
  };
};
