import 'reflect-metadata';
import * as pg from 'pg';
import * as plataforma_socketio from '@nestjs/platform-socket.io';
import express, { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { AppModulo } from './app.modulo';
import { configurarAplicacion } from './bootstrap-app';

void pg;
void plataforma_socketio;

let promesa_servidor_express: Promise<Express> | null = null;

function sanitizarMensajeError(mensaje: string): string {
  return (mensaje || 'Error interno al inicializar el servidor')
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, 'postgresql://[REDACTADO]')
    .replace(/(password|contrasena|secret)=[^\s&;]+/gi, '$1=[REDACTADO]');
}

async function inicializarServidorVercel(): Promise<Express> {
  const servidor_express = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModulo,
    new ExpressAdapter(servidor_express),
    { logger: ['error', 'warn'], abortOnError: false },
  );
  await configurarAplicacion(app);
  await app.init();
  return servidor_express;
}

export async function obtenerServidorVercel(): Promise<Express> {
  if (!promesa_servidor_express) {
    promesa_servidor_express = inicializarServidorVercel().catch((error) => {
      promesa_servidor_express = null;
      throw error;
    });
  }
  return promesa_servidor_express;
}

export default async function manejadorVercel(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.url === '/favicon.ico' || req.url?.startsWith('/favicon.ico?')) {
    res.statusCode = 204;
    res.end();
    return;
  }

  let instancia_express: Express;
  try {
    instancia_express = await obtenerServidorVercel();
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error('[BUMAND_VERCEL_ERROR]', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          estado: 'error',
          mensaje: 'Error al inicializar el backend BUMAND en Vercel',
          detalle: sanitizarMensajeError(err?.message || String(error)),
          codigo: err?.code || 'ERR_VERCEL_INIT',
        }),
      );
    }
    return;
  }

  await new Promise<void>((resolver) => {
    if (res.writableEnded) {
      resolver();
      return;
    }
    res.once('finish', resolver);
    res.once('close', resolver);
    instancia_express(req as Parameters<Express>[0], res as Parameters<Express>[1]);
  });
}
