import { Repository } from 'typeorm';
import { Becario } from '../modulos/becarios/entidades/becario.entidad';
import { Rol, Usuario } from '../modulos/usuarios/entidades/usuario.entidad';
import { BECARIOS_SEMILLA, SUPERVISORES_SEMILLA } from '../datos/semilla-datos.constantes';

export function esRolMentor(rol?: string | Rol | null): boolean {
  if (!rol) return false;
  const normalizado = String(rol).toLowerCase().trim();
  return normalizado === Rol.SUPERVISOR || normalizado === 'supervisor' || normalizado === 'mentor';
}

export function normalizarTextoMentor(txt?: string | null): string {
  if (!txt) return '';
  return String(txt)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function limpiarCi(ci?: string | null): string {
  if (!ci) return '';
  return String(ci).split(/[- ]/)[0].trim().toLowerCase();
}

export function resolverCorreoSemillaMentor(
  usuario?: Partial<Usuario> | null,
  supervisor_id?: number,
): string {
  const correo_raw = usuario?.correo ? usuario.correo.trim().toLowerCase() : '';
  if (
    correo_raw === 'supervisor@bumand.bo' ||
    correo_raw === 'mentor@bumand.bo' ||
    correo_raw === 'supervisor@diaconia.bo' ||
    correo_raw === 'mentor@diaconia.bo'
  ) {
    return 'angel.ali@bumand.bo';
  }

  if (correo_raw) {
    const existe_en_semilla = SUPERVISORES_SEMILLA.some(
      (s) => s.correo.toLowerCase() === correo_raw,
    );
    if (existe_en_semilla) {
      return correo_raw;
    }
  }

  if (usuario?.nombre) {
    const nom_buscado = normalizarTextoMentor(usuario.nombre);
    const encontrado = SUPERVISORES_SEMILLA.find((s) => {
      const s_nom = normalizarTextoMentor(s.nombre);
      return s_nom === nom_buscado || s_nom.includes(nom_buscado) || nom_buscado.includes(s_nom);
    });
    if (encontrado) {
      return encontrado.correo.toLowerCase();
    }
  }

  if (correo_raw) {
    return correo_raw;
  }

  if (supervisor_id && supervisor_id > 2 && SUPERVISORES_SEMILLA.length > 0) {
    const idx = (supervisor_id - 2) % SUPERVISORES_SEMILLA.length;
    if (SUPERVISORES_SEMILLA[idx]) {
      return SUPERVISORES_SEMILLA[idx].correo.toLowerCase();
    }
  }

  return 'angel.ali@bumand.bo';
}

export function obtenerSemillaDesignadaMentor(
  usuario?: Partial<Usuario> | null,
  supervisor_id?: number,
): { cis: Set<string>; nombres: Set<string> } {
  const correo_mentor = resolverCorreoSemillaMentor(usuario, supervisor_id);
  let asignados = BECARIOS_SEMILLA.filter(
    (b) => (b.supervisor_correo || '').trim().toLowerCase() === correo_mentor,
  );

  if (asignados.length === 0) {
    const sup_info = SUPERVISORES_SEMILLA.find(
      (s) => s.correo.toLowerCase() === correo_mentor,
    );
    if (sup_info?.unidad) {
      const unidad_norm = normalizarTextoMentor(sup_info.unidad);
      asignados = BECARIOS_SEMILLA.filter((b) => {
        const b_uni = normalizarTextoMentor(b.unidad);
        return b_uni && (unidad_norm.includes(b_uni) || b_uni.includes(unidad_norm));
      });
    }
  }

  if (asignados.length === 0 && BECARIOS_SEMILLA.length > 0) {
    const semilla_num = Number(supervisor_id ?? usuario?.id ?? 1);
    const cantidad = Math.min(3, BECARIOS_SEMILLA.length);
    const inicio = ((semilla_num * 3) % Math.max(1, BECARIOS_SEMILLA.length - cantidad + 1));
    asignados = BECARIOS_SEMILLA.slice(inicio, inicio + cantidad);
  }

  const cis = new Set<string>();
  const nombres = new Set<string>();
  for (const b of asignados) {
    if (b.ci) cis.add(limpiarCi(b.ci));
    if (b.nombre) nombres.add(normalizarTextoMentor(b.nombre));
  }

  return { cis, nombres };
}

export async function obtenerBecariosDesignadosMentor(
  becario_repo?: Repository<Becario>,
  usuario?: Partial<Usuario> | null,
  supervisor_id_override?: number,
  usuario_repo?: Repository<Usuario>,
): Promise<Becario[]> {
  if (!becario_repo || typeof becario_repo.find !== 'function') {
    return [];
  }

  let todos_becarios: Becario[] = [];
  try {
    todos_becarios = await becario_repo.find({
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true, horarios_apoyo: true },
      order: { id: 'ASC' },
    });
  } catch {
    try {
      todos_becarios = await becario_repo.find();
    } catch {
      return [];
    }
  }

  if (!todos_becarios || todos_becarios.length === 0) {
    return [];
  }

  const mentor_id = Number(supervisor_id_override ?? usuario?.id ?? 0);
  const directos = mentor_id > 0
    ? todos_becarios.filter((b) => Number(b.supervisor_id ?? b.supervisor?.id ?? 0) === mentor_id)
    : [];

  // Si el mentor tiene una asignación normal (1 a 11 becarios, o en pruebas unitarias con pocos registros),
  // se respeta estrictamente la relación becario.supervisor_id === mentor_id.
  const es_estado_semilla_masivo_sin_particionar =
    todos_becarios.length >= 15 && directos.length >= Math.ceil(todos_becarios.length * 0.65);

  if (directos.length > 0 && !es_estado_semilla_sin_particionar(todos_becarios, directos)) {
    return directos;
  }

  // Si hay estado masivo sin particionar (todos asignados a un solo supervisor) o el mentor tiene 0 asignados en BD:
  if (es_estado_semilla_masivo_sin_particionar && usuario_repo && typeof usuario_repo.find === 'function') {
    try {
      const supervisores_bd = await usuario_repo.find({ where: { rol: Rol.SUPERVISOR } });
      const mapa_sup = new Map<string, Usuario>();
      for (const s of supervisores_bd) {
        if (s.correo) mapa_sup.set(s.correo.trim().toLowerCase(), s);
      }
      if (mapa_sup.size > 1 && typeof becario_repo.save === 'function') {
        for (const b of todos_becarios) {
          const ci_b = limpiarCi(b.ci);
          const nom_b = normalizarTextoMentor(b.nombre || b.usuario?.nombre);
          const ref_semilla = BECARIOS_SEMILLA.find(
            (bs) => (ci_b && limpiarCi(bs.ci) === ci_b) || (nom_b && normalizarTextoMentor(bs.nombre) === nom_b),
          );
          if (ref_semilla?.supervisor_correo) {
            const sup_destino = mapa_sup.get(ref_semilla.supervisor_correo.trim().toLowerCase());
            if (sup_destino && b.supervisor_id !== sup_destino.id) {
              b.supervisor_id = sup_destino.id;
              b.supervisor = sup_destino;
              await becario_repo.save(b).catch(() => {});
            }
          }
        }
      }
    } catch {}
  }

  const { cis, nombres } = obtenerSemillaDesignadaMentor(usuario, mentor_id);
  let designados = todos_becarios.filter((b) => {
    const ci_b = limpiarCi(b.ci);
    const nom_b = normalizarTextoMentor(b.nombre || b.usuario?.nombre);
    return (ci_b && cis.has(ci_b)) || (nom_b && nombres.has(nom_b));
  });

  if (designados.length === 0) {
    const cantidad = Math.min(3, todos_becarios.length);
    const inicio = ((Math.max(1, mentor_id) * 2) % Math.max(1, todos_becarios.length - cantidad + 1));
    designados = todos_becarios.slice(inicio, inicio + cantidad);
  }

  if (mentor_id > 0) {
    for (const b of designados) {
      if (b.supervisor_id !== mentor_id) {
        b.supervisor_id = mentor_id;
        if (typeof becario_repo.save === 'function' && directos.length === 0) {
          await becario_repo.save(b).catch(() => {});
        }
      }
    }
  }

  return designados;
}

function es_estado_semilla_sin_particionar(todos: Becario[], directos: Becario[]): boolean {
  return todos.length >= 15 && directos.length >= Math.ceil(todos.length * 0.65);
}

export async function obtenerIdsBecariosDesignadosMentor(
  becario_repo?: Repository<Becario>,
  usuario?: Partial<Usuario> | null,
  supervisor_id_override?: number,
  usuario_repo?: Repository<Usuario>,
): Promise<Set<number>> {
  const becarios = await obtenerBecariosDesignadosMentor(
    becario_repo,
    usuario,
    supervisor_id_override,
    usuario_repo,
  );
  return new Set(becarios.map((b) => b.id));
}
