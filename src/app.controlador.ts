import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppServicio } from './app.servicio';

@ApiTags('Sistema')
@Controller()
export class AppControlador {
  constructor(private readonly appServicio: AppServicio) {}

  @Get()
  @ApiOperation({
    summary: 'Comprobar estado del servicio',
    description: 'Verifica la disponibilidad y el estado operativo del servicio backend BUMAND.',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio activo y respondiendo adecuadamente.',
    type: String,
  })
  getHello(): string {
    return this.appServicio.getHello();
  }
}
