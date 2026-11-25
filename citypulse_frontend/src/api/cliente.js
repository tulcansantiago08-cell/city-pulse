/**
 * Cliente HTTP de City Pulse.
 *
 * Todas las llamadas al backend pasan por aquí. Hace tres cosas:
 *  1. Pone la dirección base (/api/v1). Vite la reenvía a http://localhost:8080 (ver vite.config.js).
 *  2. Si hay sesión, agrega la cabecera "Authorization: Bearer <token>".
 *     Es la cabecera que lee AutorizacionInterceptor.preHandle() en el backend.
 *  3. Convierte las respuestas de error (ApiErrorResponse del backend) en un Error
 *     con el mensaje en español y el código HTTP (400, 401, 403, 404, 409).
 *
 * @author Santiago Rivas
 */

const BASE = '/api/v1';
const CLAVE_TOKEN = 'citypulse_token';

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function leerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
}

/** Error que lleva el código HTTP para que cada pantalla decida qué mostrar. */
export class ErrorApi extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

/**
 * Hace una petición al backend.
 * @param {string} ruta   Ruta después de /api/v1, por ejemplo "/eventos".
 * @param {object} opciones { metodo, cuerpo, params }
 */
export async function peticion(ruta, { metodo = 'GET', cuerpo, params } = {}) {
  let url = BASE + ruta;
  if (params) {
    const consulta = new URLSearchParams();
    Object.entries(params).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') consulta.append(clave, valor);
    });
    const texto = consulta.toString();
    if (texto) url += '?' + texto;
  }

  const cabeceras = {};
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  const token = leerToken();
  if (token) cabeceras.Authorization = 'Bearer ' + token;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. ¿Está corriendo el backend?');
  }

  // 204 No Content (eliminar, quitar favorito) y 201 sin cuerpo (agregar favorito)
  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    const mensaje = datos?.message || datos?.error || `Error ${respuesta.status}`;
    // Token vencido o inválido: se cierra la sesión local
    if (respuesta.status === 401 && token) {
      borrarToken();
      window.dispatchEvent(new Event('citypulse:sesion-expirada'));
    }
    throw new ErrorApi(respuesta.status, mensaje);
  }
  return datos;
}
