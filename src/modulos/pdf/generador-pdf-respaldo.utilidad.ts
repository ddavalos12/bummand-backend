import type { OpcionesGeneracionPdf } from './navegador-pdf.servicio';

interface BloqueTextoPdf {
  tipo: 'titulo' | 'subtitulo' | 'fila' | 'texto';
  texto: string;
}

const ENTIDADES_HTML: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&aacute;': 'á',
  '&eacute;': 'é',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&ntilde;': 'ñ',
  '&Aacute;': 'Á',
  '&Eacute;': 'É',
  '&Iacute;': 'Í',
  '&Oacute;': 'Ó',
  '&Uacute;': 'Ú',
  '&Ntilde;': 'Ñ',
  '&uuml;': 'ü',
  '&Uuml;': 'Ü',
  '&deg;': '°',
  '&middot;': '·',
  '&bull;': '-',
  '&mdash;': '-',
  '&ndash;': '-',
};

function decodificarEntidades(texto: string): string {
  let salida = texto;
  for (const [entidad, valor] of Object.entries(ENTIDADES_HTML)) {
    salida = salida.split(entidad).join(valor);
  }
  salida = salida.replace(/&#(\d+);/g, (_, num: string) => {
    const codigo = Number(num);
    return Number.isFinite(codigo) ? String.fromCharCode(codigo) : '';
  });
  return salida.replace(/\s+/g, ' ').trim();
}

function limpiarEtiquetas(html: string): string {
  return decodificarEntidades(html.replace(/<[^>]+>/g, ' '));
}

function extraerBloquesDesdeHtml(html: string): BloqueTextoPdf[] {
  const sin_ruido = html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ');

  const bloques: BloqueTextoPdf[] = [];
  const patron = /<(h1|h2|h3|tr|p|li|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let coincidencia: RegExpExecArray | null;
  let ultimo_indice = 0;

  while ((coincidencia = patron.exec(sin_ruido)) !== null) {
    const etiqueta = coincidencia[1].toLowerCase();
    const contenido = coincidencia[2];

    if (etiqueta === 'div' && /<(h1|h2|h3|tr|p|li|table|div)/i.test(contenido)) {
      continue;
    }

    if (etiqueta === 'tr') {
      const celdas: string[] = [];
      const patron_celda = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
      let celda: RegExpExecArray | null;
      while ((celda = patron_celda.exec(contenido)) !== null) {
        const texto_celda = limpiarEtiquetas(celda[2]);
        if (texto_celda) {
          celdas.push(texto_celda);
        }
      }
      if (celdas.length > 0) {
        bloques.push({ tipo: 'fila', texto: celdas.join('  |  ') });
      }
    } else {
      const texto = limpiarEtiquetas(contenido);
      if (texto) {
        const tipo =
          etiqueta === 'h1'
            ? 'titulo'
            : etiqueta === 'h2' || etiqueta === 'h3'
              ? 'subtitulo'
              : 'texto';
        bloques.push({ tipo, texto });
      }
    }

    ultimo_indice = patron.lastIndex;
  }

  if (bloques.length === 0) {
    const plano = limpiarEtiquetas(sin_ruido);
    if (plano) {
      bloques.push({ tipo: 'texto', texto: plano });
    }
  } else if (ultimo_indice < sin_ruido.length) {
    const cola = limpiarEtiquetas(sin_ruido.slice(ultimo_indice));
    if (cola && cola.length > 3) {
      bloques.push({ tipo: 'texto', texto: cola });
    }
  }

  return bloques;
}

function envolverLinea(texto: string, max_caracteres: number): string[] {
  if (texto.length <= max_caracteres) {
    return [texto];
  }
  const palabras = texto.split(' ');
  const lineas: string[] = [];
  let actual = '';

  for (const palabra of palabras) {
    if (!actual) {
      actual = palabra;
    } else if (actual.length + 1 + palabra.length <= max_caracteres) {
      actual += ` ${palabra}`;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) {
    lineas.push(actual);
  }
  return lineas;
}

function escaparTextoPdfWinAnsi(texto: string): string {
  let resultado = '';
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    if (codigo === 0x28 || codigo === 0x29 || codigo === 0x5c) {
      resultado += '\\' + texto[i];
    } else if (codigo >= 0x20 && codigo <= 0x7e) {
      resultado += texto[i];
    } else if (codigo >= 0xa0 && codigo <= 0xff) {
      resultado += '\\' + codigo.toString(8).padStart(3, '0');
    } else {
      resultado += ' ';
    }
  }
  return resultado;
}

export function generarPdfRespaldoDesdeHtml(
  html: string,
  opciones?: OpcionesGeneracionPdf,
): Buffer {
  const es_landscape = Boolean(opciones?.landscape);
  const ancho = es_landscape ? 842 : 595;
  const alto = es_landscape ? 595 : 842;
  const margen_x = 40;
  const max_chars = es_landscape ? 115 : 82;

  const bloques = extraerBloquesDesdeHtml(html);
  const lineas_render: Array<{ texto: string; tamano: number; negrita: boolean }> = [];

  for (const bloque of bloques) {
    const tamano = bloque.tipo === 'titulo' ? 14 : bloque.tipo === 'subtitulo' ? 11 : 9;
    const negrita = bloque.tipo === 'titulo' || bloque.tipo === 'subtitulo';
    const envueltas = envolverLinea(bloque.texto, bloque.tipo === 'titulo' ? Math.floor(max_chars * 0.75) : max_chars);
    for (const linea of envueltas) {
      lineas_render.push({ texto: linea, tamano, negrita });
    }
    if (bloque.tipo === 'titulo' || bloque.tipo === 'subtitulo') {
      lineas_render.push({ texto: '', tamano: 6, negrita: false });
    }
  }

  if (lineas_render.length === 0) {
    lineas_render.push({ texto: 'Documento BUMAND generado sin contenido tabular.', tamano: 10, negrita: false });
  }

  const paginas_contenido: string[] = [];
  let y = alto - 50;
  let comandos: string[] = [];

  for (const item of lineas_render) {
    const paso = item.tamano + 5;
    if (y - paso < 45) {
      paginas_contenido.push(comandos.join('\n'));
      comandos = [];
      y = alto - 50;
    }
    if (item.texto) {
      const fuente = item.negrita ? '/F2' : '/F1';
      comandos.push(
        `BT ${fuente} ${item.tamano} Tf ${margen_x} ${y} Td (${escaparTextoPdfWinAnsi(item.texto)}) Tj ET`,
      );
    }
    y -= paso;
  }
  if (comandos.length > 0) {
    paginas_contenido.push(comandos.join('\n'));
  }

  const objetos: string[] = [];
  const agregarObjeto = (contenido: string): number => {
    objetos.push(contenido);
    return objetos.length;
  };

  const id_catalogo = agregarObjeto('');
  const id_paginas = agregarObjeto('');
  const id_fuente_regular = agregarObjeto(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  );
  const id_fuente_negrita = agregarObjeto(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  );

  const ids_paginas: number[] = [];
  for (const stream_pagina of paginas_contenido) {
    const longitud = Buffer.byteLength(stream_pagina, 'latin1');
    const id_contenido = agregarObjeto(
      `<< /Length ${longitud} >>\nstream\n${stream_pagina}\nendstream`,
    );
    const id_pagina = agregarObjeto(
      `<< /Type /Page /Parent ${id_paginas} 0 R /MediaBox [0 0 ${ancho} ${alto}] /Resources << /Font << /F1 ${id_fuente_regular} 0 R /F2 ${id_fuente_negrita} 0 R >> >> /Contents ${id_contenido} 0 R >>`,
    );
    ids_paginas.push(id_pagina);
  }

  objetos[id_catalogo - 1] = `<< /Type /Catalog /Pages ${id_paginas} 0 R >>`;
  objetos[id_paginas - 1] = `<< /Type /Pages /Kids [${ids_paginas.map((id) => `${id} 0 R`).join(' ')}] /Count ${ids_paginas.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 0; i < objetos.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${objetos[i]}\nendobj\n`;
  }

  const inicio_xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objetos.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objetos.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root ${id_catalogo} 0 R >>\nstartxref\n${inicio_xref}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}
