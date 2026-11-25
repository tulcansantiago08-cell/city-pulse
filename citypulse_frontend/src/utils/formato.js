/**
 * Utilidades de presentación: fechas, precios, estados y colores de las tarjetas.
 *
 * El backend envía las fechas como LocalDateTime sin zona ("2026-12-16T19:00:00"),
 * así que se leen como hora local de Pasto.
 *
 * @author Santiago Rivas
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const nombreMes = (mes) => MESES_LARGOS[mes - 1];

export const aFecha = (texto) => (texto ? new Date(texto) : null);

/** "05" y "DIC" para la etiqueta de la tarjeta */
export function diaYMes(texto) {
  const f = aFecha(texto);
  return { dia: String(f.getDate()).padStart(2, '0'), mes: MESES[f.getMonth()].toUpperCase() };
}

/** "16 dic 2026" */
export function fechaCorta(texto) {
  const f = aFecha(texto);
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

/** "Miércoles" */
export const diaSemana = (texto) => DIAS[aFecha(texto).getDay()];

/** "07:00 PM" */
export function hora(texto) {
  const f = aFecha(texto);
  let h = f.getHours();
  const sufijo = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')} ${sufijo}`;
}

/** "2 horas" o "45 min" */
export function duracion(inicio, fin) {
  const minutos = Math.round((aFecha(fin) - aFecha(inicio)) / 60000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas} ${horas === 1 ? 'hora' : 'horas'}${resto ? ` ${resto} min` : ''}`;
}

/** Precio: null o 0 → "Gratuito"; si no, "$30.000" */
export function precio(valor) {
  if (valor === null || valor === undefined || Number(valor) === 0) return 'Gratuito';
  return '$' + Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

/** El backend manda "$30000,00" en precioFormateado; lo mostramos como "$30.000" */
export function precioDeTarjeta(texto) {
  if (!texto || texto === 'Gratuito') return 'Gratuito';
  const numero = Number(texto.replace(/[^0-9,]/g, '').replace(',', '.'));
  return Number.isNaN(numero) ? texto : precio(numero);
}

/** Une fecha "2026-12-16" y hora "19:00" en el formato que espera el backend */
export const unirFechaHora = (fecha, horaTexto) => `${fecha}T${horaTexto}:00`;

/** Separa "2026-12-16T19:00:00" en { fecha: "2026-12-16", hora: "19:00" } para los inputs */
export function separarFechaHora(texto) {
  if (!texto) return { fecha: '', hora: '' };
  return { fecha: texto.slice(0, 10), hora: texto.slice(11, 16) };
}

/** Texto y color de cada EstadoEvento del backend */
export const ESTADOS = {
  PROXIMO: { texto: 'Próximo', clase: 'estado-proximo' },
  EN_CURSO: { texto: 'En curso', clase: 'estado-curso' },
  FINALIZADO: { texto: 'Finalizado', clase: 'estado-finalizado' },
  CANCELADO: { texto: 'Cancelado', clase: 'estado-cancelado' },
  OCULTO: { texto: 'Oculto', clase: 'estado-oculto' },
};

/** Tipos de organización (enum TipoOrganizacion del backend) */
export const TIPOS_ORGANIZACION = {
  UNIVERSIDAD: 'Institución educativa',
  ALCALDIA: 'Alcaldía / entidad pública',
  EMPRESA: 'Empresa',
  GRUPO_LOCAL: 'Colectivo / grupo local',
};

/** Emoji por categoría, como en los wireframes */
const EMOJI_CATEGORIA = {
  cultura: '🎭',
  música: '🎵',
  musica: '🎵',
  tecnología: '💻',
  tecnologia: '💻',
  gastronomía: '🍲',
  gastronomia: '🍲',
  'salud y bienestar': '🧘',
};

export const emojiCategoria = (nombre) => EMOJI_CATEGORIA[(nombre || '').toLowerCase()] || '✨';

/** Degradados de las tarjetas (no hay subida de flyer, así que cada evento recibe un color fijo) */
const DEGRADADOS = [
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #db2777, #7c3aed)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #f97316, #f43f5e)',
];
const EMOJIS_EVENTO = ['🎉', '🕯️', '🎄', '🎆', '📸', '🎶', '🛍️', '🎨'];

function numeroDeTexto(texto) {
  let n = 0;
  for (const c of texto || '') n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}

/** Fondo de la imagen del evento: el flyer si existe, si no un degradado según su id */
export function fondoEvento(evento) {
  if (evento.flyerUrl) return `center / cover no-repeat url("${evento.flyerUrl}")`;
  return DEGRADADOS[numeroDeTexto(evento.id) % DEGRADADOS.length];
}

export const emojiEvento = (evento) =>
  evento.flyerUrl ? '' : EMOJIS_EVENTO[numeroDeTexto(evento.id) % EMOJIS_EVENTO.length];

/** Iniciales para los avatares: "Daniela Rosero" → "DR" */
export function iniciales(texto) {
  return (texto || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/**
 * Enlace de inscripción según el canal (mismo criterio que redirigir() en el backend:
 * CanalURL, CanalFormulario → destino; CanalWhatsApp → https://wa.me/<número>?text=<mensaje>).
 */
export function enlaceInscripcion(canal) {
  if (!canal) return null;
  if (canal.tipo === 'WHATSAPP') {
    const numero = (canal.destino || '').replace(/[^0-9]/g, '');
    const mensaje = canal.mensajePredefinido ? `?text=${encodeURIComponent(canal.mensajePredefinido)}` : '';
    return `https://wa.me/${numero}${mensaje}`;
  }
  return canal.destino;
}

export const NOMBRE_CANAL = { URL: 'Página web', WHATSAPP: 'WhatsApp', FORMULARIO: 'Formulario' };
