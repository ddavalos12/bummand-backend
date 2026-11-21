import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppServicio } from './app.servicio';
import { AlmacenamientoServicio } from './modulos/almacenamiento/almacenamiento.servicio';

@ApiTags('Sistema')
@Controller()
export class AppControlador {
  constructor(
    private readonly appServicio: AppServicio,
    @Optional()
    private readonly almacenamiento_servicio?: AlmacenamientoServicio,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Comprobar estado del servicio',
    description:
      'Verifica la disponibilidad y el estado operativo del servicio backend BUMAND.',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio activo y respondiendo adecuadamente.',
    type: String,
  })
  getHello(): string {
    return this.appServicio.getHello();
  }

  @Get(['health', 'api/health'])
  @ApiOperation({
    summary: 'Diagnóstico rápido de salud del servidor (Serverless / Local)',
    description:
      'Retorna el estado operativo del backend, entorno de ejecución y modos de Puppeteer y almacenamiento sin invocar base de datos ni navegador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnóstico operativo del sistema.',
  })
  obtenerEstadoSalud() {
    const modo_puppeteer_env = (process.env.PUPPETEER_MODE || '')
      .trim()
      .toLowerCase();
    const modo_puppeteer =
      modo_puppeteer_env === 'cloud' || modo_puppeteer_env === 'nube'
        ? 'cloud'
        : modo_puppeteer_env === 'local' || modo_puppeteer_env === 'desktop'
          ? 'local'
          : process.env.VERCEL === '1'
            ? 'cloud'
            : 'local';

    const modo_almacenamiento =
      this.almacenamiento_servicio?.obtenerModoActual() ??
      ((process.env.STORAGE_MODE || '').trim().toLowerCase() === 'r2'
        ? 'r2'
        : 'local');

    return {
      estado: 'ok',
      servicio: 'bumand-backend',
      entorno: process.env.VERCEL === '1' ? 'vercel' : 'local',
      modo_puppeteer,
      modo_almacenamiento,
      marca_tiempo: new Date().toISOString(),
    };
  }
}
