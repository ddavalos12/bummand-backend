const modulo_vercel = require('../dist/vercel');
const manejador =
  modulo_vercel.default ||
  modulo_vercel.manejadorVercel ||
  modulo_vercel;

module.exports = manejador;
