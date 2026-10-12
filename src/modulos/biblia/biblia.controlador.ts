import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BibliaServicio, VersiculoBiblico } from './biblia.servicio';

@ApiTags('Biblia')
@Controller(['biblia', 'api/biblia'])
export class BibliaControlador {
  constructor(private readonly biblia_servicio: BibliaServicio) {}

  @Get('versiculo-diario')
  @ApiOperation({
    summary: 'Obtener versículo bíblico del día',
    description: 'Retorna el versículo bíblico oficial Reina-Valera 1960 asignado para la fecha, con texto y reflexión diaconal.',
  })
  @ApiQuery({ name: 'fecha', required: false, description: 'Fecha de consulta (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Versículo del día obtenido con éxito.' })
  obtenerVersiculoDiario(@Query('fecha') fecha?: string): Promise<VersiculoBiblico> {
    return this.biblia_servicio.obtenerVersiculoDiario(fecha);
  }

  @Get('paquete-offline')
  @ApiOperation({
    summary: 'Descargar paquete completo de versículos para uso offline',
    description: 'Provee un paquete de versículos devocionales precargados para almacenamiento en caché local del dispositivo móvil.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de versículos offline descargado con éxito.' })
  obtenerPaqueteOffline(): VersiculoBiblico[] {
    return this.biblia_servicio.obtenerPaqueteOffline();
  }

  @Get('pasaje')
  @ApiOperation({
    summary: 'Consultar pasaje bíblico por cita o referencia',
    description: 'Busca el texto bíblico en la API Reina-Valera 1960 para autocompletar formularios devocionales.',
  })
  @ApiQuery({ name: 'cita', required: true, example: 'Filipenses 4:13', description: 'Cita bíblica con libro, capítulo y versículo' })
  @ApiResponse({ status: 200, description: 'Texto del pasaje bíblico retornado.' })
  buscarPasaje(@Query('cita') cita: string): Promise<VersiculoBiblico> {
    return this.biblia_servicio.buscarPasaje(cita || 'Filipenses 4:13');
  }
}
