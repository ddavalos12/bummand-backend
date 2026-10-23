# Bumand Backend (NestJS)

Este es el backend oficial del proyecto Bumand, migrado desde el código legacy usando **NestJS** y **TypeORM**.

## Estructura del Proyecto

El proyecto sigue una arquitectura modular y en estricto español:
- `src/modulos`: Contiene todos los módulos de la aplicación (usuarios, becarios, etc.).
- `src/main.ts`: Archivo de entrada de la aplicación.
- `app.modulo.ts`: Módulo raíz.

## Comandos

- `npm run compilar`: Compila el proyecto con Nest CLI (utilizando webpack por defecto para optimizar y facilitar el despliegue).
- `npm run sembrar`: Siembra institucional completa (catálogos, cuestionarios, supervisores y 23 becarios).
- `npm run sembrar:limpiar-todo`: Limpieza total (hoja en blanco) y alta del Administrador Primario (.env).
- `npm run sembrar:limpiar-datos`: Limpieza de declaraciones y datos operativos, preservando usuarios y catálogos.
- `npm run sembrar:catalogos`: Siembra exclusiva de catálogos estructurales.
- `npm run sembrar:cuestionarios`: Siembra exclusiva de cuestionarios y preguntas de evaluación.
- `npm run iniciar:desarrollo`: Inicia en modo desarrollo con auto-recarga.
- `npm run iniciar:produccion`: Inicia en modo producción.
- `npm run formatear`: Formatea el código con Prettier.
- `npm run revisar`: Revisa el código con ESLint.
- `npm run pruebas`: Ejecuta las pruebas unitarias.

## Configuración de Base de Datos y Sembradores (Seeders)

Consulta el manual maestro [seeders.md](../seeders.md) para el detalle exhaustivo de todos los modos de limpieza y variables de entorno.

La aplicación usa TypeORM y se conecta usando las variables de entorno definidas en el archivo `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_CONTRASENA`, `DB_DATABASE`.
