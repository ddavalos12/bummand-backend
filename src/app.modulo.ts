import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppControlador } from './app.controlador';
import { AppServicio } from './app.servicio';

// 15 Entidades Relacionales Oficiales (BUMAND)
import { Usuario } from './modulos/usuarios/entidades/usuario.entidad';
import { Iglesia } from './modulos/iglesias/entidades/iglesia.entidad';
import { LugarPractica } from './modulos/lugares-practica/entidades/lugar-practica.entidad';
import { Becario } from './modulos/becarios/entidades/becario.entidad';
import { RegistroAsistencia } from './modulos/asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes } from './modulos/pasajes/entidades/solicitud-pasaje.entidad';
import { Recorrido } from './modulos/pasajes/entidades/recorrido.entidad';
import { ModuloEvaluacion } from './modulos/evaluaciones/entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './modulos/evaluaciones/entidades/periodo-evaluacion.entidad';
import { Evaluador } from './modulos/evaluaciones/entidades/evaluador.entidad';
import { Evaluacion } from './modulos/evaluaciones/entidades/evaluacion.entidad';
import { EvaluacionPastor } from './modulos/evaluaciones/entidades/evaluacion-pastor.entidad';
import { AprobacionPracticas } from './modulos/practicas/entidades/aprobacion-practicas.entidad';
import { Notificacion } from './modulos/notificaciones/entidades/notificacion.entidad';
import { ReporteGenerado } from './modulos/pdf/entidades/reporte-generado.entidad';

// Módulos Funcionales
import { UsuariosModulo } from './modulos/usuarios/usuarios.modulo';
import { BecariosModulo } from './modulos/becarios/becarios.modulo';
import { IglesiasModulo } from './modulos/iglesias/iglesias.modulo';
import { LugaresPracticaModulo } from './modulos/lugares-practica/lugares-practica.modulo';
import { AutenticacionModulo } from './modulos/autenticacion/autenticacion.modulo';
import { AsistenciaModulo } from './modulos/asistencia/asistencia.modulo';
import { PasajesModulo } from './modulos/pasajes/pasajes.modulo';
import { PdfModulo } from './modulos/pdf/pdf.modulo';
import { EvaluacionesModulo } from './modulos/evaluaciones/evaluaciones.modulo';
import { PracticasModulo } from './modulos/practicas/practicas.modulo';
import { NotificacionesModulo } from './modulos/notificaciones/notificaciones.modulo';
import { DashboardModulo } from './modulos/dashboard/dashboard.modulo';
import { DatosModulo } from './datos/datos.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_CONTRASENA,
      database: process.env.DB_DATABASE,
      entities: [
        Usuario,
        Iglesia,
        LugarPractica,
        Becario,
        RegistroAsistencia,
        SolicitudPasajes,
        Recorrido,
        ModuloEvaluacion,
        PeriodoEvaluacion,
        Evaluador,
        Evaluacion,
        EvaluacionPastor,
        AprobacionPracticas,
        Notificacion,
        ReporteGenerado,
      ],
      synchronize: false, // Controlado estrictamente por migraciones SQL
    }),
    UsuariosModulo,
    BecariosModulo,
    IglesiasModulo,
    LugaresPracticaModulo,
    AutenticacionModulo,
    AsistenciaModulo,
    PasajesModulo,
    PdfModulo,
    EvaluacionesModulo,
    PracticasModulo,
    NotificacionesModulo,
    DashboardModulo,
    DatosModulo,
  ],
  controllers: [AppControlador],
  providers: [AppServicio],
})
export class AppModulo {}
