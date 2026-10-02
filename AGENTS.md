# Reglas de Backend (Nest.js & TypeScript)

## 1. Rol y Comportamiento
- Priorizar la arquitectura escalable, la inyección de dependencias limpia y el tipado estricto con TypeScript.
- **Cero Comentarios Básicos:** PROHIBIDO generar código con comentarios obvios. El código debe autodocumentarse. Solo añadir 1-3 líneas si la lógica es criptográfica, compleja o de integraciones opacas.
- **Idioma Español Absoluto:** Todo el código (clases, variables, métodos, decoradores personalizados) y TODOS los nombres de archivos (`.ts`) y carpetas DEBEN estar ESTRICTAMENTE en español. (Ej: `src/modulos/pacientes/paciente.servicio.ts`). 
- *Excepción:* Decoradores nativos (`@Controller`), dependencias de `npm`, configuraciones raíz y métodos nativos. NUNCA crear carpetas `modules`, `controllers`, etc.

## 2. Estándar de Código y Nombrado
- **snake_case:** Variables y Atributos.
- **camelCase:** Métodos y funciones.
- **PascalCase (ESPAÑOL):** Clases, Interfaces, DTOs, Entidades.
- **UPPER_SNAKE_CASE:** Constantes.
- **kebab-case:** Nombres de carpetas y archivos (ej. `factura.controlador.ts`), y rutas de red REST (`@Get('nuevo-registro')`).

## 3. Manejo de Errores y Seguridad
- Usar `try-catch` para operaciones asíncronas falibles.
- Lanzar SIEMPRE excepciones integradas de Nest.js (`NotFoundException`). No lanzar `Error()` genéricos en la capa de red.
- Validar TODA entrada con `class-validator` y `class-transformer` en DTOs. PROHIBIDO procesar `Body` sin DTO.
- Proteger endpoints con Guards.

## 4. Prácticas de Nest.js
- Inyección de Dependencias vía constructor exclusivamente.
- Tipado estricto: evitar `any` a toda costa. Usar `unknown` o genéricos si es dinámico.

## 5. Comandos y Flujos de Trabajo
- Instalación de nuevas librerías (investigando siempre 2-3 opciones antes): `npm install <nombre>`
- Formateo y Linter: `npm run format` y `npm run lint`.
- Compilación exhaustiva: `npm run compilar` (o `npm run build`), el cual debe verificar tipado y sintaxis.
- Compilaciones específicas o parciales: `npm run compilar:formax` (para verificaciones rápidas durante desarrollo).
- Modos de ejecución: Iniciar siempre con `npm run start:dev` (Debug/Desarrollo) o `npm run start:prod` (Producción).

## 6. Límites
- NUNCA borrar archivos automáticamente sin orden explícita. Consultar para refactorizaciones masivas.

## 7. Base de Datos (TypeORM)
- **ORM Exclusivo:** Utiliza estrictamente TypeORM para todas las operaciones de base de datos. PROHIBIDO usar Prisma u otro ORM.
