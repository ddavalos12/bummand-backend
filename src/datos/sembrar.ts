import { NestFactory } from '@nestjs/core';
import { AppModulo } from '../app.modulo';
import { SemillaServicio } from './semilla.servicio';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModulo, {
    logger: ['log', 'warn', 'error'],
  });
  const semilla = app.get(SemillaServicio);
  await semilla.ejecutarSemilla();
  await app.close();
  console.log('Siembra manual institucional completada con éxito.');
}

bootstrap().catch((err) => {
  console.error('Error durante la siembra institucional:', err);
  process.exit(1);
});
