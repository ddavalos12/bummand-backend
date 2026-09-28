import { Controller, Get } from '@nestjs/common';
import { AppServicio } from './app.servicio';

@Controller()
export class AppControlador {
  constructor(private readonly AppServicio: AppServicio) {}

  @Get()
  getHello(): string {
    return this.AppServicio.getHello();
  }
}
