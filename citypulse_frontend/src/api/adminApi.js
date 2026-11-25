/**
 * Administración. Cada función llama a un endpoint de AdminController.java
 * (backend: controller/AdminController.java, ruta base /api/v1/admin, solo ADMINISTRADOR).
 *
 * @author Santiago Rivas
 */
import { peticion } from './cliente';

/** GET /admin/solicitudes-organizador → AdminController.listarPendientes() */
export const listarSolicitudesPendientes = () => peticion('/admin/solicitudes-organizador');

/** POST /admin/solicitudes-organizador/{id}/aprobar → AdminController.aprobar() */
export const aprobarSolicitud = (id) =>
  peticion(`/admin/solicitudes-organizador/${id}/aprobar`, { metodo: 'POST' });

/** POST /admin/solicitudes-organizador/{id}/rechazar → AdminController.rechazar() (motivo obligatorio) */
export const rechazarSolicitud = (id, motivo) =>
  peticion(`/admin/solicitudes-organizador/${id}/rechazar`, { metodo: 'POST', cuerpo: { motivo } });

/** POST /admin/administradores → AdminController.crearAdministrador() */
export const crearAdministrador = (datos) =>
  peticion('/admin/administradores', { metodo: 'POST', cuerpo: datos });
