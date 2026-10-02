import { NestFactory } from '@nestjs/core';
import { AppModulo } from './app.modulo';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModulo);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuración de Swagger para documentación interactiva de la API
  const configuracion = new DocumentBuilder()
    .setTitle('API BUMAND — Sistema de Prácticas y Viáticos')
    .setDescription(
      'Documentación interactiva y especificación OpenAPI de los endpoints del backend BUMAND ' +
      '(Fundación Diaconía FRIF-IFD). Monolito modular en NestJS con PostgreSQL/TypeORM que ' +
      'administra autenticación JWT, usuarios, becarios, iglesias, lugares de práctica con geocercas, ' +
      'asistencia satelital Haversine, declaración y reembolso de pasajes en centavos enteros con regla del día 24, ' +
      'evaluaciones 360° en 5 ejes formativos, formulario pastoral F-03, convalidación de prácticas, ' +
      'notificaciones push y emisión de reportes PDF oficiales.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Autorización JWT',
        description: 'Ingrese el token JWT institucional en el formato: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Sistema', 'Comprobación de conectividad y estado operativo del servicio')
    .addTag('Autenticación', 'Inicio de sesión, emisión y verificación de credenciales JWT')
    .addTag('Usuarios', 'Gestión de cuentas institucionales, estados y roles RBAC')
    .addTag('Becarios', 'Perfiles académicos, carreras, asignaciones institucionales y directorio')
    .addTag('Iglesias', 'Directorio de congregaciones cristianas vinculadas')
    .addTag('Lugares de Práctica', 'Sedes institucionales, coordenadas WGS84 y calibración métrica de geocercas')
    .addTag('Asistencia', 'Marcación de ingreso/salida con geolocalización Haversine y control anti-spoofing')
    .addTag('Pasajes', 'Declaración mensual de viáticos, liquidación del 80% en centavos y regla del día 24')
    .addTag('Evaluaciones', 'Matriz de evaluación 360° en 5 ejes, catálogo de módulos y formulario F-03')
    .addTag('Prácticas', 'Aprobación y certificación de horas de práctica con firma digitalizada')
    .addTag('Notificaciones', 'Bandeja de alertas reactivas, contador de no leídas y push')
    .addTag('Dashboard', 'Consolidado analítico de horas, presupuesto del 80% y rankings')
    .addTag('PDF', 'Generación headless de reportes oficiales certificados en PDF')
    .build();

  const documento = SwaggerModule.createDocument(app, configuracion);
  SwaggerModule.setup('api/docs', app, documento, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'Documentación API BUMAND — Swagger UI',
  });

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);
  console.log(`[BUMAND] Servidor iniciado en http://localhost:${puerto}`);
  console.log(`[BUMAND] Documentación Swagger UI disponible en http://localhost:${puerto}/api/docs`);
}
bootstrap();
