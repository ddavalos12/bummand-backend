import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AlmacenamientoServicio } from './almacenamiento.servicio';

@ApiTags('Sistema')
@Controller(['uploads', 'api/uploads'])
export class AlmacenamientoControlador {
  constructor(
    private readonly almacenamiento_servicio: AlmacenamientoServicio,
  ) {}

  @Get(':carpeta/:nombre')
  @ApiOperation({
    summary: 'Descargar o visualizar archivo almacenado (Cloudflare R2 o Disco Local)',
  })
  @ApiParam({ name: 'carpeta', description: 'Carpeta lógica del archivo' })
  @ApiParam({ name: 'nombre', description: 'Nombre del archivo' })
  @ApiResponse({ status: 200, description: 'Contenido binario del archivo.' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado.' })
  async servirArchivo(
    @Param('carpeta') carpeta: string,
    @Param('nombre') nombre: string,
    @Res() respuesta: Response,
  ): Promise<void> {
    const archivo = await this.almacenamiento_servicio.obtenerArchivo(
      carpeta,
      nombre,
    );

    respuesta.setHeader('Access-Control-Allow-Origin', '*');
    respuesta.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    respuesta.setHeader('Content-Type', archivo.tipo_contenido);
    respuesta.setHeader(
      'Content-Disposition',
      `inline; filename="${archivo.nombre_archivo}"`,
    );
    respuesta.setHeader('Cache-Control', 'public, max-age=3600');
    respuesta.status(200).send(archivo.buffer);
  }
}
