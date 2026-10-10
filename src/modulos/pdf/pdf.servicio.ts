import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Evento } from '../eventos/entidades/evento.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';

@Injectable()
export class PdfServicio {
  constructor(
    @Optional()
    @InjectRepository(Evento)
    private readonly evento_repo?: Repository<Evento>,
    @Optional()
    @InjectRepository(AsistenciaEvento)
    private readonly asistencia_repo?: Repository<AsistenciaEvento>,
  ) {}

  async generarPdf(html: string): Promise<Buffer> {
    const navegador = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: 'domcontentloaded' });
    const bufer = await pagina.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    });
    await navegador.close();
    return Buffer.from(bufer);
  }

  async generarActaEventoPdf(evento_id: number): Promise<Buffer> {
    let evento: Evento | null = null;
    let asistencias: AsistenciaEvento[] = [];

    if (this.evento_repo) {
      evento = await this.evento_repo.findOne({
        where: { id: evento_id },
        relations: { creador: true },
      });
    }

    if (!evento) {
      throw new NotFoundException(`Evento con ID ${evento_id} no encontrado`);
    }

    if (this.asistencia_repo) {
      asistencias = await this.asistencia_repo.find({
        where: { evento_id },
        relations: { becario: { usuario: true } },
        order: { hora_marcacion: 'ASC' },
      });
    }

    const total_registrados = asistencias.length;
    const dentro_radio = asistencias.filter((a) => a.dentro_de_radio).length;
    const fuera_radio = total_registrados - dentro_radio;

    const filas_html =
      asistencias.length > 0
        ? asistencias
            .map((a, index) => {
              const nombre_becario =
                a.becario?.usuario?.nombre || `Becario #${a.becario_id}`;
              const carrera = a.becario?.carrera || 'No registrada';
              const universidad = a.becario?.universidad || 'Universidad';
              const dist =
                a.distancia_m !== undefined && a.distancia_m !== null
                  ? `${Math.round(a.distancia_m)}m`
                  : 'N/A';
              const estado_badge = a.dentro_de_radio
                ? `<span style="color: #0d8050; font-weight: bold;">PRESENTE (${dist})</span>`
                : `<span style="color: #c0392b; font-weight: bold;">FUERA DE RADIO (${dist})</span>`;

              return `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td><strong>${nombre_becario}</strong></td>
              <td>${carrera}<br/><small style="color: #666;">${universidad}</small></td>
              <td style="text-align: center;">${a.hora_marcacion || '--:--'}</td>
              <td style="text-align: center;">${estado_badge}</td>
              <td><small>${a.observaciones || 'Sin observaciones'}</small></td>
            </tr>
          `;
            })
            .join('')
        : `
          <tr>
            <td colspan="6" style="text-align: center; padding: 25px; color: #888;">
              No se han registrado marcaciones de asistencia para este evento aún.
            </td>
          </tr>
        `;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1a2a3a;
              margin: 0;
              padding: 0;
              font-size: 12px;
            }
            .header {
              border-bottom: 3px solid #063A6B;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .logo-title {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            h1 {
              color: #063A6B;
              font-size: 20px;
              margin: 0 0 5px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subtitle {
              color: #17B4C4;
              font-size: 13px;
              font-weight: 600;
              margin: 0;
            }
            .meta-box {
              background-color: #f4f8fb;
              border: 1px solid #d9e6f2;
              border-radius: 6px;
              padding: 12px 16px;
              margin-bottom: 20px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              row-gap: 8px;
              column-gap: 16px;
            }
            .meta-item strong {
              color: #063A6B;
            }
            .stats-container {
              display: flex;
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-card {
              flex: 1;
              background: #fff;
              border: 1px solid #e1e8ed;
              border-radius: 6px;
              padding: 10px;
              text-align: center;
            }
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #063A6B;
            }
            .stat-label {
              font-size: 11px;
              color: #657786;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #d1dbe3;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #063A6B;
              color: #ffffff;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) {
              background-color: #fcfdfe;
            }
            .signatures {
              margin-top: 50px;
              display: flex;
              justify-content: space-around;
            }
            .sign-col {
              width: 220px;
              text-align: center;
              border-top: 1px solid #063A6B;
              padding-top: 8px;
              font-size: 11px;
            }
            .footer-note {
              margin-top: 40px;
              font-size: 10px;
              color: #8899a6;
              text-align: center;
              border-top: 1px dashed #d1dbe3;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Programa de Becas BUMAND</h1>
            <p class="subtitle">Acta Oficial de Asistencia y Control Geodésico a Eventos</p>
          </div>

          <div class="meta-box">
            <div class="meta-grid">
              <div class="meta-item"><strong>Evento:</strong> ${evento.titulo}</div>
              <div class="meta-item"><strong>Tipo:</strong> ${evento.tipo_evento?.toUpperCase()}</div>
              <div class="meta-item"><strong>Fecha:</strong> ${new Date(evento.fecha).toLocaleDateString('es-BO')}</div>
              <div class="meta-item"><strong>Horario:</strong> ${evento.hora_inicio} - ${evento.hora_fin}</div>
              <div class="meta-item"><strong>Lugar:</strong> ${evento.direccion_referencia}</div>
              <div class="meta-item"><strong>Geocerca:</strong> Tolerancia de ${evento.radio_tolerancia_m || 100}m</div>
            </div>
          </div>

          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-value">${total_registrados}</div>
              <div class="stat-label">Total Marcaciones</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #0d8050;">${dentro_radio}</div>
              <div class="stat-label">En Geocerca</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #c0392b;">${fuera_radio}</div>
              <div class="stat-label">Fuera de Radio</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">N°</th>
                <th>Becario / Postulante</th>
                <th>Carrera / Universidad</th>
                <th style="width: 80px; text-align: center;">Hora Marcación</th>
                <th style="width: 130px; text-align: center;">Estado y Distancia</th>
                <th>Observación Técnica</th>
              </tr>
            </thead>
            <tbody>
              ${filas_html}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sign-col">
              <strong>Supervisor Institucional</strong><br/>
              Control y Aprobación
            </div>
            <div class="sign-col">
              <strong>Dirección BUMAND</strong><br/>
              Conformidad y Archivo
            </div>
          </div>

          <div class="footer-note">
            Documento generado digitalmente por el Sistema BUMAND el ${new Date().toLocaleString('es-BO')} con certificación geodésica WGS84.
          </div>
        </body>
      </html>
    `;

    return this.generarPdf(html);
  }
}
