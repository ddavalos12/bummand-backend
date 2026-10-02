import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfServicio {
  async generarPdf(html: string): Promise<Buffer> {
    const navegador = await puppeteer.launch({ headless: true });
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: 'domcontentloaded' });
    const bufer = await pagina.pdf({ format: 'A4', printBackground: true });
    await navegador.close();
    return Buffer.from(bufer);
  }
}
