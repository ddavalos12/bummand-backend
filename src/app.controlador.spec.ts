import { Test, TestingModule } from '@nestjs/testing';
import { AppControlador } from './app.controlador';
import { AppServicio } from './app.servicio';

describe('AppControlador', () => {
  let app_controlador: AppControlador;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppControlador],
      providers: [AppServicio],
    }).compile();

    app_controlador = app.get<AppControlador>(AppControlador);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(app_controlador.getHello()).toBe('Hello World!');
    });
  });
});
