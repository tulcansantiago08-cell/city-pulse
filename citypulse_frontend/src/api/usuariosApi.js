/**
 * Usuarios y favoritos.
 *  - Perfil y solicitud de rol → UsuarioController.java (/api/v1/usuarios)
 *  - Favoritos                 → FavoritoController.java (/api/v1/usuarios/{id}/favoritos)
 *
 * @author Santiago Rivas
 */
import { peticion } from './cliente';

/** GET /usuarios/{id} → UsuarioController.obtener() */
export const obtenerUsuario = (id) => peticion(`/usuarios/${id}`);

/** PUT /usuarios/{id}/perfil → UsuarioController.editar() */
export const editarPerfil = (id, datos) => peticion(`/usuarios/${id}/perfil`, { metodo: 'PUT', cuerpo: datos });

/** POST /usuarios/{id}/solicitar-rol-organizador → UsuarioController.solicitarRol() (solo ASISTENTE) */
export const solicitarRolOrganizador = (id, datos) =>
  peticion(`/usuarios/${id}/solicitar-rol-organizador`, { metodo: 'POST', cuerpo: datos });

/** GET /usuarios/{id}/favoritos → FavoritoController.listar() */
export const listarFavoritos = (asistenteId) => peticion(`/usuarios/${asistenteId}/favoritos`);

/** POST /usuarios/{id}/favoritos/{eventoId} → FavoritoController.agregar() */
export const agregarFavorito = (asistenteId, eventoId) =>
  peticion(`/usuarios/${asistenteId}/favoritos/${eventoId}`, { metodo: 'POST' });

/** DELETE /usuarios/{id}/favoritos/{eventoId} → FavoritoController.remover() */
export const quitarFavorito = (asistenteId, eventoId) =>
  peticion(`/usuarios/${asistenteId}/favoritos/${eventoId}`, { metodo: 'DELETE' });
