import { NestFactory } from '@nestjs/core';
import { AppModulo } from '../app.modulo';
import { SemillaServicio } from './semilla.servicio';

async function bootstrap() {
  const args = process.argv.slice(2);
  const app = await NestFactory.createApplicationContext(AppModulo, {
    logger: ['log', 'warn', 'error'],
  });
  const semilla = app.get(SemillaServicio);

  if (args.includes('--limpiar-todo')) {
    console.log('>>> Ejecutando Limpieza Total (Enfoque B: hoja en blanco)...');
    await semilla.limpiarTodo();
    console.log('>>> Limpieza total y creación de Administrador Primario (.env) completada.');
  } else if (args.includes('--limpiar-datos')) {
    console.log('>>> Ejecutando Limpieza de Datos Operativos (Tipo 1: preserva usuarios y catálogos)...');
    await semilla.limpiarDatosOperativos();
    console.log('>>> Limpieza de declaraciones y datos operativos completada con éxito.');
  } else if (args.includes('--catalogos')) {
    console.log('>>> Sembrando únicamente catálogos institucionales base...');
    await semilla.sembrarCatalogos();
    console.log('>>> Catálogos base sembrados con éxito.');
  } else if (args.includes('--cuestionarios')) {
    console.log('>>> Sembrando únicamente cuestionarios y preguntas dinámicas...');
    await semilla.sembrarCuestionarios();
    console.log('>>> Cuestionarios sembrados con éxito.');
  } else {
    console.log('>>> Ejecutando siembra completa institucional de BUMAND...');
    await semilla.ejecutarSemilla();
    console.log('>>> Siembra institucional completada con éxito.');
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error durante la ejecución del sembrador institucional:', err);
  process.exit(1);
});
