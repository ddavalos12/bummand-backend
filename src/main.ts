import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModulo } from './app.modulo';
import { configurarAplicacion } from './bootstrap-app';
import manejadorVercel from './vercel';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModulo);
  await configurarAplicacion(app);

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);
  console.log(`[BUMAND] Servidor iniciado en http://localhost:${puerto}`);
  console.log(
    `[BUMAND] Documentación Swagger UI disponible en http://localhost:${puerto}/api/docs`,
  );
}

if (process.env.VERCEL !== '1') {
  void bootstrap();
}

export default manejadorVercel;
