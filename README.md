# Bumand Backend (NestJS)

Este es el backend oficial del proyecto Bumand, migrado desde el código legacy usando **NestJS** y **TypeORM**.

## Estructura del Proyecto

El proyecto sigue una arquitectura modular y en estricto español:
- `src/modulos`: Contiene todos los módulos de la aplicación (usuarios, becarios, etc.).
- `src/main.ts`: Archivo de entrada de la aplicación.
- `app.modulo.ts`: Módulo raíz.

## Comandos

- `npm run compilar`: Compila el proyecto con Nest CLI.
- `npm run compilar:formax`: Compilación rápida con webpack.
- `npm run start:dev`: Inicia en modo desarrollo con auto-recarga.
- `npm run start:prod`: Inicia en modo producción.
- `npm run format`: Formatea el código.
- `npm run lint`: Revisa el código.

## Configuración de Base de Datos

La aplicación usa TypeORM y se conecta usando las variables de entorno definidas en el archivo `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_CONTRASENA`, `DB_DATABASE`.
