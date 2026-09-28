import { Test, TestingModule } from '@nestjs/testing';
import { AppControlador } from './app.controlador';
import { AppServicio } from './app.servicio';

describe('AppControlador', () => {
  let AppControlador: AppControlador;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppControlador],
      providers: [AppServicio],
    }).compile();

    AppControlador = app.get<AppControlador>(AppControlador);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(AppControlador.getHello()).toBe('Hello World!');
    });
  });
});
