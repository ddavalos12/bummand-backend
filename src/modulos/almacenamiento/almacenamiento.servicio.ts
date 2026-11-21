import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

export type ModoAlmacenamiento = 'r2' | 'local';

export interface ArchivoSubidoEntrada {
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  path?: string;
}

export interface ResultadoGuardarArchivo {
  url: string;
  clave: string;
  nombre_archivo: string;
  modo: ModoAlmacenamiento;
}

export interface ResultadoObtenerArchivo {
  buffer: Buffer;
  tipo_contenido: string;
  nombre_archivo: string;
}

const MAPA_TIPOS_MIME: Readonly<Record<string, string>> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain; charset=utf-8',
};

@Injectable()
export class AlmacenamientoServicio {
  private readonly registrador = new Logger(AlmacenamientoServicio.name);
  private cliente_s3: S3Client | null = null;

  obtenerModoActual(): ModoAlmacenamiento {
    const modo_configurado = (process.env.STORAGE_MODE || '')
      .trim()
      .toLowerCase();

    if (
      modo_configurado === 'r2' ||
      modo_configurado === 'cloud' ||
      modo_configurado === 'nube'
    ) {
      return 'r2';
    }

    if (modo_configurado === 'local' || modo_configurado === 'desktop') {
      return 'local';
    }

    if (this.tieneCredencialesR2()) {
      return 'r2';
    }

    return 'local';
  }

  obtenerDirectorioBaseLocal(): string {
    if (process.env.VERCEL === '1') {
      return '/tmp/bumand-uploads';
    }
    return path.join(process.cwd(), 'uploads');
  }

  async guardarArchivo(
    archivo: ArchivoSubidoEntrada,
    carpeta: string,
    prefijo: string,
  ): Promise<ResultadoGuardarArchivo> {
    if (!archivo) {
      throw new BadRequestException('No se proporcionó un archivo válido');
    }

    const carpeta_limpia = this.sanitizarSegmento(carpeta);
    const prefijo_limpio =
      (prefijo || 'archivo').replace(/[^a-zA-Z0-9_-]/g, '') || 'archivo';

    const extension_original = path
      .extname(archivo.originalname || archivo.filename || '')
      .toLowerCase();
    const extension_segura = /^[.][a-z0-9]{1,10}$/.test(extension_original)
      ? extension_original
      : '';

    const sufijo_unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const nombre_archivo = archivo.filename
      ? this.sanitizarSegmento(archivo.filename)
      : `${prefijo_limpio}-${sufijo_unico}${extension_segura}`;

    const clave = `${carpeta_limpia}/${nombre_archivo}`;
    const contenido_buffer = this.extraerBufferArchivo(archivo);
    const tipo_contenido =
      archivo.mimetype || this.inferirTipoContenido(nombre_archivo);
    const modo = this.obtenerModoActual();

    if (modo === 'r2' && this.tieneCredencialesR2()) {
      const cliente = this.obtenerClienteR2();
      const nombre_bucket = (process.env.R2_BUCKET_NAME || '').trim();

      await cliente.send(
        new PutObjectCommand({
          Bucket: nombre_bucket,
          Key: clave,
          Body: contenido_buffer,
          ContentType: tipo_contenido,
        }),
      );

      const url_publica = (process.env.R2_PUBLIC_URL || '')
        .trim()
        .replace(/\/+$/, '');
      const url = url_publica
        ? `${url_publica}/${clave}`
        : `/uploads/${carpeta_limpia}/${nombre_archivo}`;

      return {
        url,
        clave,
        nombre_archivo,
        modo: 'r2',
      };
    }

    if (modo === 'r2' && !this.tieneCredencialesR2()) {
      this.registrador.warn(
        'STORAGE_MODE=r2 activo sin credenciales completas de R2; almacenando en directorio temporal local.',
      );
    }

    const directorio_base = this.obtenerDirectorioBaseLocal();
    const directorio_destino = path.join(directorio_base, carpeta_limpia);
    if (!fs.existsSync(directorio_destino)) {
      fs.mkdirSync(directorio_destino, { recursive: true });
    }

    const ruta_destino = path.join(directorio_destino, nombre_archivo);
    if (!archivo.path || path.resolve(archivo.path) !== path.resolve(ruta_destino)) {
      fs.writeFileSync(ruta_destino, contenido_buffer);
    }

    return {
      url: `/uploads/${carpeta_limpia}/${nombre_archivo}`,
      clave,
      nombre_archivo,
      modo,
    };
  }

  async obtenerArchivo(
    carpeta: string,
    nombre: string,
  ): Promise<ResultadoObtenerArchivo> {
    const carpeta_limpia = this.sanitizarSegmento(carpeta);
    const nombre_limpio = this.sanitizarSegmento(nombre);
    const clave = `${carpeta_limpia}/${nombre_limpio}`;
    const tipo_por_defecto = this.inferirTipoContenido(nombre_limpio);

    if (this.obtenerModoActual() === 'r2' && this.tieneCredencialesR2()) {
      try {
        const cliente = this.obtenerClienteR2();
        const nombre_bucket = (process.env.R2_BUCKET_NAME || '').trim();
        const respuesta = await cliente.send(
          new GetObjectCommand({
            Bucket: nombre_bucket,
            Key: clave,
          }),
        );

        if (respuesta.Body) {
          const bytes = await respuesta.Body.transformToByteArray();
          return {
            buffer: Buffer.from(bytes),
            tipo_contenido: respuesta.ContentType || tipo_por_defecto,
            nombre_archivo: nombre_limpio,
          };
        }
      } catch {
        this.registrador.debug(
          `Archivo ${clave} no encontrado en R2, verificando respaldo local.`,
        );
      }
    }

    const directorios_candidatos = [
      this.obtenerDirectorioBaseLocal(),
      path.join(process.cwd(), 'uploads'),
    ];

    for (const directorio_base of directorios_candidatos) {
      const raiz_resuelta = path.resolve(directorio_base);
      const ruta_archivo = path.resolve(
        directorio_base,
        carpeta_limpia,
        nombre_limpio,
      );

      if (
        !ruta_archivo.startsWith(`${raiz_resuelta}${path.sep}`) &&
        ruta_archivo !== raiz_resuelta
      ) {
        throw new BadRequestException('Ruta de archivo inválida');
      }

      if (fs.existsSync(ruta_archivo) && fs.statSync(ruta_archivo).isFile()) {
        return {
          buffer: fs.readFileSync(ruta_archivo),
          tipo_contenido: tipo_por_defecto,
          nombre_archivo: nombre_limpio,
        };
      }
    }

    throw new NotFoundException(
      `El archivo solicitado (${carpeta_limpia}/${nombre_limpio}) no existe`,
    );
  }

  private tieneCredencialesR2(): boolean {
    const endpoint = (process.env.R2_ENDPOINT || '').trim();
    const access_key_id = (process.env.R2_ACCESS_KEY_ID || '').trim();
    const secret_access_key = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
    const bucket_name = (process.env.R2_BUCKET_NAME || '').trim();

    return Boolean(
      endpoint && access_key_id && secret_access_key && bucket_name,
    );
  }

  private obtenerClienteR2(): S3Client {
    if (!this.cliente_s3) {
      this.cliente_s3 = new S3Client({
        region: 'auto',
        endpoint: (process.env.R2_ENDPOINT || '').trim(),
        credentials: {
          accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
          secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
        },
      });
    }
    return this.cliente_s3;
  }

  private sanitizarSegmento(segmento: string): string {
    const valor = (segmento || '').trim();
    if (
      !valor ||
      valor.includes('..') ||
      valor.includes('/') ||
      valor.includes('\\') ||
      valor.includes('\0')
    ) {
      throw new BadRequestException('Segmento de ruta no permitido');
    }
    const limpio = path.basename(valor).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!limpio || limpio === '.' || limpio === '..') {
      throw new BadRequestException('Nombre de archivo o carpeta inválido');
    }
    return limpio;
  }

  private extraerBufferArchivo(archivo: ArchivoSubidoEntrada): Buffer {
    if (Buffer.isBuffer(archivo.buffer)) {
      return archivo.buffer;
    }
    if (archivo.path && fs.existsSync(archivo.path)) {
      return fs.readFileSync(archivo.path);
    }
    return Buffer.alloc(0);
  }

  private inferirTipoContenido(nombre_archivo: string): string {
    const extension = path.extname(nombre_archivo || '').toLowerCase();
    return MAPA_TIPOS_MIME[extension] || 'application/octet-stream';
  }
}
