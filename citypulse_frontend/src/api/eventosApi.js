/**
 * Eventos. Cada función llama a un endpoint de EventoController.java
 * (backend: controller/EventoController.java, ruta base /api/v1/eventos).
 *
 * @author Santiago Rivas
 */
import { peticion } from './cliente';

/** GET /eventos → EventoController.listar() → grid público ordenado por fecha (o filtrado) */
export const listarEventos = (filtros = {}) => peticion('/eventos', { params: filtros });

/** GET /eventos/{id} → EventoController.detalle() */
export const obtenerEvento = (id) => peticion(`/eventos/${id}`);

/** POST /eventos → EventoController.crear() (solo ORGANIZADOR) */
export const crearEvento = (datos) => peticion('/eventos', { metodo: 'POST', cuerpo: datos });

/** PUT /eventos/{id} → EventoController.editar() (solo el organizador dueño) */
export const editarEvento = (id, datos) => peticion(`/eventos/${id}`, { metodo: 'PUT', cuerpo: datos });

/** DELETE /eventos/{id} → EventoController.eliminar() */
export const eliminarEvento = (id) => peticion(`/eventos/${id}`, { metodo: 'DELETE' });

/** PATCH /eventos/{id}/visibilidad?oculto=true|false → EventoController.cambiarVisibilidad() */
export const cambiarVisibilidad = (id, oculto) =>
  peticion(`/eventos/${id}/visibilidad`, { metodo: 'PATCH', params: { oculto } });

/** PATCH /eventos/{id}/cancelar → EventoController.cancelar() */
export const cancelarEvento = (id) => peticion(`/eventos/${id}/cancelar`, { metodo: 'PATCH' });

/** GET /eventos/organizador/{id} → EventoController.listarPorOrganizador() (panel "Mis eventos") */
export const listarMisEventos = (organizadorId) => peticion(`/eventos/organizador/${organizadorId}`);

/** GET /eventos/organizador/{id}/calendario?mes&anio → EventoController.calendario() */
export const obtenerCalendario = (organizadorId, mes, anio) =>
  peticion(`/eventos/organizador/${organizadorId}/calendario`, { params: { mes, anio } });
