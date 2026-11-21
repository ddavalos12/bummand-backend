import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { FiltroExcepcionesGlobal } from './nucleo/errores';

export async function configurarAplicacion(
  app: NestExpressApplication,
): Promise<NestExpressApplication> {
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const modo_almacenamiento = (process.env.STORAGE_MODE || '')
    .trim()
    .toLowerCase();
  const es_entorno_vercel = process.env.VERCEL === '1';

  if (modo_almacenamiento !== 'r2' && !es_entorno_vercel) {
    try {
      const directorio_uploads = join(process.cwd(), 'uploads');
      if (!existsSync(directorio_uploads)) {
        mkdirSync(directorio_uploads, { recursive: true });
      }
      const configurarCabecerasUploads = (res: {
        setHeader: (clave: string, valor: string) => void;
      }) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      };
      app.useStaticAssets(directorio_uploads, {
        prefix: '/uploads/',
        setHeaders: configurarCabecerasUploads,
      });
      app.useStaticAssets(directorio_uploads, {
        prefix: '/api/uploads/',
        setHeaders: configurarCabecerasUploads,
      });
    } catch {
      // En entornos de solo lectura el servicio AlmacenamientoControlador gestiona /uploads
    }
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new FiltroExcepcionesGlobal());

  const habilitar_swagger =
    process.env.SWAGGER_ENABLED === 'true' ||
    (process.env.SWAGGER_ENABLED !== 'false' && process.env.VERCEL !== '1');

  const instancia_http = app.getHttpAdapter().getInstance();
  instancia_http.get(
    '/favicon.ico',
    (_req: unknown, res: { status: (c: number) => { end: () => void } }) => {
      res.status(204).end();
    },
  );
  instancia_http.get(
    '/documentacion',
    (
      _req: unknown,
      res: {
        redirect: (url: string) => void;
        status: (c: number) => { json: (cuerpo: unknown) => void };
      },
    ) => {
      if (habilitar_swagger) {
        res.redirect('/api/docs');
        return;
      }
      res.status(200).json({
        estado: 'ok',
        servicio: 'bumand-backend',
        mensaje:
          'API BUMAND operativa. La documentación interactiva Swagger (/api/docs) está deshabilitada en producción (SWAGGER_ENABLED=false); defina SWAGGER_ENABLED=true para activarla.',
        salud: '/health',
      });
    },
  );

  if (habilitar_swagger) {
    const configuracion_swagger = new DocumentBuilder()
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
          description:
            'Ingrese el token JWT institucional en el formato: Bearer <token>',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag(
        'Sistema',
        'Comprobación de conectividad y estado operativo del servicio',
      )
      .addTag(
        'Autenticación',
        'Inicio de sesión, emisión y verificación de credenciales JWT',
      )
      .addTag(
        'Usuarios',
        'Gestión de cuentas institucionales, estados y roles RBAC',
      )
      .addTag(
        'Becarios',
        'Perfiles académicos, carreras, asignaciones institucionales y directorio',
      )
      .addTag('Iglesias', 'Directorio de congregaciones cristianas vinculadas')
      .addTag(
        'Lugares de Práctica',
        'Sedes institucionales, coordenadas WGS84 y calibración métrica de geocercas',
      )
      .addTag(
        'Asistencia',
        'Marcación de ingreso/salida con geolocalización Haversine y control anti-spoofing',
      )
      .addTag(
        'Pasajes',
        'Declaración mensual de viáticos, liquidación del 80% en centavos y regla del día 24',
      )
      .addTag(
        'Evaluaciones',
        'Matriz de evaluación 360° en 5 ejes, catálogo de módulos y formulario F-03',
      )
      .addTag(
        'Prácticas',
        'Aprobación y convalidación institucional de horas de práctica en sistema',
      )
      .addTag(
        'Notificaciones',
        'Bandeja de alertas reactivas, contador de no leídas y push',
      )
      .addTag(
        'Dashboard',
        'Consolidado analítico de horas, presupuesto del 80% y rankings',
      )
      .addTag('PDF', 'Generación headless de reportes oficiales certificados en PDF')
      .build();

    const documento_swagger = SwaggerModule.createDocument(
      app,
      configuracion_swagger,
    );
    SwaggerModule.setup('api/docs', app, documento_swagger, {
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        displayRequestDuration: true,
      },
      customSiteTitle: 'Documentación API BUMAND — Swagger UI',
    });
  }

  return app;
}
