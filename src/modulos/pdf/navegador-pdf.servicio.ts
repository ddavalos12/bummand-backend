import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as fs from 'fs';
import type { Browser, HTTPRequest, LaunchOptions } from 'puppeteer-core';

export type ModoNavegadorPdf = 'cloud' | 'local';

export interface OpcionesGeneracionPdf {
  landscape?: boolean;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  timeout_ms?: number;
}

interface ModuloPuppeteerCore {
  launch: (opciones?: LaunchOptions) => Promise<Browser>;
}

interface ModuloSparticuzChromium {
  args?: string[];
  headless?: boolean | 'shell';
  setGraphicsMode?: boolean;
  executablePath: (input?: string) => Promise<string>;
}

const ARGUMENTOS_BASE_SEGURIDAD: readonly string[] = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

const RUTAS_NAVEGADOR_LOCAL: readonly string[] = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

const TIPOS_RECURSOS_BLOQUEABLES = new Set<string>([
  'image',
  'font',
  'media',
  'stylesheet',
]);

@Injectable()
export class NavegadorPdfServicio {
  private readonly registrador = new Logger(NavegadorPdfServicio.name);
  private cola_ejecucion: Promise<unknown> = Promise.resolve();
  private cliente_puppeteer_cache: ModuloPuppeteerCore | null = null;
  private cliente_chromium_cache: ModuloSparticuzChromium | null = null;

  obtenerModoActual(): ModoNavegadorPdf {
    const modo_configurado = (process.env.PUPPETEER_MODE || '')
      .trim()
      .toLowerCase();

    if (modo_configurado === 'cloud' || modo_configurado === 'nube') {
      return 'cloud';
    }
    if (modo_configurado === 'local' || modo_configurado === 'desktop') {
      return 'local';
    }
    return process.env.VERCEL === '1' ? 'cloud' : 'local';
  }

  async ejecutarConNavegador<T>(
    trabajo: (navegador: Browser) => Promise<T>,
  ): Promise<T> {
    const tarea_actual = this.cola_ejecucion
      .catch(() => undefined)
      .then(async () => {
        const navegador = await this.lanzarNavegador();
        try {
          return await trabajo(navegador);
        } finally {
          await navegador.close().catch(() => {});
        }
      });

    this.cola_ejecucion = tarea_actual.then(
      () => undefined,
      () => undefined,
    );

    return tarea_actual;
  }

  async generarPdfDesdeHtml(
    html: string,
    opciones?: OpcionesGeneracionPdf,
  ): Promise<Buffer> {
    const tiempo_limite = opciones?.timeout_ms ?? 120000;
    const modo_actual = this.obtenerModoActual();
    const bloquear_externos = this.debeBloquearRecursosExternos(modo_actual);

    try {
      return await this.ejecutarConNavegador(async (navegador) => {
        const pagina = await navegador.newPage();
        try {
          if (typeof pagina.setDefaultTimeout === 'function') {
            pagina.setDefaultTimeout(tiempo_limite);
          }

          if (
            bloquear_externos &&
            typeof pagina.setRequestInterception === 'function' &&
            typeof pagina.on === 'function'
          ) {
            await pagina.setRequestInterception(true);
            pagina.on('request', (solicitud: HTTPRequest) => {
              const url_solicitud = solicitud.url() || '';
              const tipo_recurso = solicitud.resourceType();

              if (
                url_solicitud.startsWith('data:') ||
                url_solicitud.startsWith('about:') ||
                tipo_recurso === 'document'
              ) {
                void solicitud.continue().catch(() => {});
                return;
              }

              const es_http_externo =
                url_solicitud.startsWith('http://') ||
                url_solicitud.startsWith('https://');

              if (
                es_http_externo &&
                TIPOS_RECURSOS_BLOQUEABLES.has(tipo_recurso)
              ) {
                void solicitud.abort().catch(() => {});
                return;
              }

              void solicitud.continue().catch(() => {});
            });
          }

          await pagina.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: tiempo_limite,
          });

          const bufer = await pagina.pdf({
            format: opciones?.format ?? 'A4',
            landscape: opciones?.landscape ?? false,
            printBackground: true,
            margin: opciones?.margin ?? {
              top: '15mm',
              right: '15mm',
              bottom: '15mm',
              left: '15mm',
            },
            timeout: tiempo_limite,
          });

          return Buffer.from(bufer);
        } finally {
          if (typeof pagina.close === 'function') {
            await pagina.close().catch(() => {});
          }
        }
      });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.registrador.error(
        `Fallo en Chromium (${modo_actual}), devolviendo HTTP 503 para activar respaldo estilizado en cliente: ${mensaje}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        `El motor de generación PDF (Chromium) no está disponible en este entorno: ${mensaje}`,
      );
    }
  }

  private debeBloquearRecursosExternos(modo: ModoNavegadorPdf): boolean {
    const configuracion_bloqueo = (
      process.env.PUPPETEER_BLOQUEAR_RECURSOS_EXTERNOS || ''
    )
      .trim()
      .toLowerCase();

    if (configuracion_bloqueo === 'false') {
      return false;
    }
    if (configuracion_bloqueo === 'true') {
      return true;
    }
    return modo === 'cloud';
  }

  private async lanzarNavegador(): Promise<Browser> {
    const modo = this.obtenerModoActual();
    if (modo === 'cloud') {
      return this.lanzarNavegadorCloud();
    }
    return this.lanzarNavegadorLocal();
  }

  private obtenerClientePuppeteerCore(): ModuloPuppeteerCore {
    if (!this.cliente_puppeteer_cache) {
      // Carga diferida para evitar penalizar el arranque en frío cuando no se emiten PDFs
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modulo = require('puppeteer-core') as {
        default?: ModuloPuppeteerCore;
      } & ModuloPuppeteerCore;
      this.cliente_puppeteer_cache = modulo.default || modulo;
    }
    return this.cliente_puppeteer_cache;
  }

  private async obtenerClienteChromium(): Promise<ModuloSparticuzChromium> {
    if (!this.cliente_chromium_cache) {
      let modulo: {
        default?: ModuloSparticuzChromium;
      } & ModuloSparticuzChromium;
      try {
        // Node >= 22.12 soporta require(ESM) de forma nativa y @vercel/nft lo rastrea estáticamente
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        modulo = require('@sparticuz/chromium') as {
          default?: ModuloSparticuzChromium;
        } & ModuloSparticuzChromium;
      } catch (error: unknown) {
        const codigo = (error as { code?: string })?.code;
        if (codigo !== 'ERR_REQUIRE_ESM') {
          throw error;
        }
        modulo = (await import('@sparticuz/chromium')) as unknown as {
          default?: ModuloSparticuzChromium;
        } & ModuloSparticuzChromium;
      }
      this.cliente_chromium_cache = modulo.default || modulo;
    }
    return this.cliente_chromium_cache;
  }

  private async lanzarNavegadorCloud(): Promise<Browser> {
    const cliente_puppeteer = this.obtenerClientePuppeteerCore();
    const cliente_chromium = await this.obtenerClienteChromium();
    if (typeof cliente_chromium.setGraphicsMode === 'boolean') {
      cliente_chromium.setGraphicsMode = false;
    }

    const ruta_override = (process.env.PUPPETEER_EXECUTABLE_PATH || '').trim();
    let ruta_ejecutable: string;

    if (ruta_override && fs.existsSync(ruta_override)) {
      ruta_ejecutable = ruta_override;
    } else {
      const ruta_bin_personalizada = (
        process.env.PUPPETEER_CHROMIUM_PACK_URL || ''
      ).trim();
      ruta_ejecutable = ruta_bin_personalizada
        ? await cliente_chromium.executablePath(ruta_bin_personalizada)
        : await cliente_chromium.executablePath();
    }

    const argumentos_deduplicados = Array.from(
      new Set([
        ...(cliente_chromium.args || []),
        ...ARGUMENTOS_BASE_SEGURIDAD,
      ]),
    );

    return cliente_puppeteer.launch({
      args: argumentos_deduplicados,
      executablePath: ruta_ejecutable,
      headless: cliente_chromium.headless ?? 'shell',
    });
  }

  private async lanzarNavegadorLocal(): Promise<Browser> {
    const cliente_puppeteer = this.obtenerClientePuppeteerCore();
    const rutas_candidatas: (string | undefined)[] = [
      (process.env.PUPPETEER_EXECUTABLE_PATH || '').trim() || undefined,
      (process.env.CHROME_BIN || '').trim() || undefined,
      ...RUTAS_NAVEGADOR_LOCAL,
    ];

    let ruta_ejecutable: string | undefined;

    for (const ruta of rutas_candidatas) {
      if (ruta && fs.existsSync(ruta)) {
        ruta_ejecutable = ruta;
        break;
      }
    }

    const modulo_puppeteer_local = this.cargarPuppeteerLocalOpcional();

    if (!ruta_ejecutable && modulo_puppeteer_local?.executablePath) {
      try {
        const ruta_cache_local = modulo_puppeteer_local.executablePath();
        if (ruta_cache_local && fs.existsSync(ruta_cache_local)) {
          ruta_ejecutable = ruta_cache_local;
        }
      } catch {
        this.registrador.debug(
          'No se pudo resolver executablePath desde puppeteer local opcional',
        );
      }
    }

    const opciones_lanzamiento: LaunchOptions = {
      headless: true,
      args: [...ARGUMENTOS_BASE_SEGURIDAD],
    };

    if (ruta_ejecutable) {
      opciones_lanzamiento.executablePath = ruta_ejecutable;
    }

    try {
      return await cliente_puppeteer.launch(opciones_lanzamiento);
    } catch (error_core) {
      if (modulo_puppeteer_local?.launch) {
        const opciones_fallback = { ...opciones_lanzamiento };
        delete opciones_fallback.executablePath;
        return await modulo_puppeteer_local.launch(opciones_fallback);
      }
      throw error_core;
    }
  }

  private cargarPuppeteerLocalOpcional(): {
    executablePath?: () => string;
    launch?: (opciones?: LaunchOptions) => Promise<Browser>;
  } | null {
    try {
      const requerir_dinamico = eval('require') as NodeRequire;
      const modulo = requerir_dinamico('puppeteer') as {
        default?: {
          executablePath?: () => string;
          launch?: (opciones?: LaunchOptions) => Promise<Browser>;
        };
        executablePath?: () => string;
        launch?: (opciones?: LaunchOptions) => Promise<Browser>;
      };
      return modulo.default || modulo;
    } catch {
      return null;
    }
  }
}
