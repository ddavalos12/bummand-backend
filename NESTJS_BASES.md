# Bases de NestJS en el Proyecto Bumand

## 1. Arquitectura Modular
NestJS utiliza módulos para organizar el código en bloques funcionales. En Bumand, cada entidad principal tiene su módulo (ej. `UsuariosModulo`, `BecariosModulo`). Los módulos encapsulan los controladores y los servicios (proveedores).

## 2. Controladores (Controllers)
Los controladores manejan las peticiones HTTP entrantes. Usan decoradores como `@Get()`, `@Post()`, `@Body()`, y `@Param()` para enrutar las solicitudes. 
*En Bumand, los archivos terminan en `.controlador.ts`*.

## 3. Servicios (Providers/Services)
La lógica de negocio reside en los servicios, que son inyectables. Usamos `@Injectable()` para que NestJS se encargue de la inyección de dependencias. 
*En Bumand, los archivos terminan en `.servicio.ts`*.

## 4. DTOs (Data Transfer Objects)
Definen la estructura de los datos enviados a la API. Combinados con `class-validator` y `ValidationPipe`, garantizan que solo se reciba información válida.

## 5. TypeORM
El ORM utilizado para conectarnos a PostgreSQL. Definimos entidades con `@Entity()` y usamos el patrón de `Repository` para interactuar con la base de datos de manera orientada a objetos.
