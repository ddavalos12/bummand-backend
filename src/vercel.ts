import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AppModulo } from './app.modulo';
import { configurarAplicacion } from './bootstrap-app';

type ManejadorExpress = (req: Request, res: Response) => unknown;

let promesa_servidor_express: Promise<ManejadorExpress> | null = null;

async function inicializarServidorVercel(): Promise<ManejadorExpress> {
  const app = await NestFactory.create<NestExpressApplication>(AppModulo, {
    logger: ['error', 'warn'],
  });
  await configurarAplicacion(app);
  await app.init();
  return app.getHttpAdapter().getInstance() as ManejadorExpress;
}

export async function obtenerServidorVercel(): Promise<ManejadorExpress> {
  if (!promesa_servidor_express) {
    promesa_servidor_express = inicializarServidorVercel().catch((error) => {
      promesa_servidor_express = null;
      throw error;
    });
  }
  return promesa_servidor_express;
}

export default async function manejadorVercel(
  req: Request,
  res: Response,
): Promise<unknown> {
  const instancia_express = await obtenerServidorVercel();
  return instancia_express(req, res);
}
