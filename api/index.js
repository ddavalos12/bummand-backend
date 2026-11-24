require('reflect-metadata');
require('pg');
require('express');
require('rxjs');
require('passport');
require('@nestjs/platform-socket.io');
require('puppeteer-core');
require('tar-fs');
require('tar-stream');
require('pump');
if (process.env.SWAGGER_ENABLED === 'true') {
  require('swagger-ui-express');
}

const modulo_vercel = require('../dist/vercel');
const manejador =
  modulo_vercel.default ||
  modulo_vercel.manejadorVercel ||
  modulo_vercel;

module.exports = manejador;
