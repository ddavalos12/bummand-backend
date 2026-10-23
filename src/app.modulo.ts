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
import { HorarioApoyo } from './modulos/becarios/entidades/horario-apoyo.entidad';
import { AsignacionPractica } from './modulos/becarios/entidades/asignacion-practica.entidad';
import { ConfiguracionInstitucional } from './modulos/becarios/entidades/configuracion-institucional.entidad';
import { RegistroAsistencia } from './modulos/asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes } from './modulos/pasajes/entidades/solicitud-pasaje.entidad';
import { Recorrido } from './modulos/pasajes/entidades/recorrido.entidad';
import { ModuloEvaluacion } from './modulos/evaluaciones/entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './modulos/evaluaciones/entidades/periodo-evaluacion.entidad';
import { Evaluador } from './modulos/evaluaciones/entidades/evaluador.entidad';
import { Evaluacion } from './modulos/evaluaciones/entidades/evaluacion.entidad';
import { EvaluacionPastor } from './modulos/evaluaciones/entidades/evaluacion-pastor.entidad';
import { PreguntaBienestar } from './modulos/evaluaciones/entidades/pregunta-bienestar.entidad';
import { Cuestionario } from './modulos/evaluaciones/entidades/cuestionario.entidad';
import { PreguntaCuestionario } from './modulos/evaluaciones/entidades/pregunta-cuestionario.entidad';
import { CasoSeguimientoPastoral } from './modulos/evaluaciones/entidades/caso-seguimiento-pastoral.entidad';
import { AprobacionPracticas } from './modulos/practicas/entidades/aprobacion-practicas.entidad';
import { Notificacion } from './modulos/notificaciones/entidades/notificacion.entidad';
import { ReporteGenerado } from './modulos/pdf/entidades/reporte-generado.entidad';
import { TarifaTransporte } from './modulos/pasajes/entidades/tarifa-transporte.entidad';
import { ParadaTransporte } from './modulos/pasajes/entidades/parada-transporte.entidad';
import { Devocional } from './modulos/devocionales/entidades/devocional.entidad';
import { Evento } from './modulos/eventos/entidades/evento.entidad';
import { AsistenciaEvento } from './modulos/eventos/entidades/asistencia-evento.entidad';
import { Justificacion } from './modulos/justificaciones/entidades/justificacion.entidad';
import { Multa } from './modulos/asistencia/entidades/multa.entidad';
import { Refrigerio } from './modulos/refrigerios/entidades/refrigerio.entidad';

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
import { DevocionalesModulo } from './modulos/devocionales/devocionales.modulo';
import { EventosModulo } from './modulos/eventos/eventos.modulo';
import { JustificacionesModulo } from './modulos/justificaciones/justificaciones.modulo';
import { DatosModulo } from './datos/datos.modulo';
import { TiempoRealModulo } from './modulos/tiempo-real/tiempo-real.modulo';
import { BibliaModulo } from './modulos/biblia/biblia.modulo';
import { RefrigeriosModulo } from './modulos/refrigerios/refrigerios.modulo';

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
        HorarioApoyo,
        AsignacionPractica,
        ConfiguracionInstitucional,
        RegistroAsistencia,
        SolicitudPasajes,
        Recorrido,
        ModuloEvaluacion,
        PeriodoEvaluacion,
        Evaluador,
        Evaluacion,
        EvaluacionPastor,
        PreguntaBienestar,
        Cuestionario,
        PreguntaCuestionario,
        CasoSeguimientoPastoral,
        AprobacionPracticas,
        Notificacion,
        ReporteGenerado,
        TarifaTransporte,
        ParadaTransporte,
        Devocional,
        Evento,
        AsistenciaEvento,
        Justificacion,
        Multa,
        Refrigerio,
      ],
      synchronize: process.env.SINCRONIZAR_DB === 'true',
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
    DevocionalesModulo,
    EventosModulo,
    JustificacionesModulo,
    DatosModulo,
    TiempoRealModulo,
    BibliaModulo,
    RefrigeriosModulo,
  ],
  controllers: [AppControlador],
  providers: [AppServicio],
})
export class AppModulo {}
