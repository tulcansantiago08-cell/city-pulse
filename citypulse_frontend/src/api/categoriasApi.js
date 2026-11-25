/**
 * Categorías. Cada función llama a un endpoint de CategoriaController.java
 * (backend: controller/CategoriaController.java, ruta base /api/v1/categorias).
 *
 * @author Santiago Rivas
 */
import { peticion } from './cliente';

/** GET /categorias → CategoriaController.listar() (público, solo activas) */
export const listarCategorias = () => peticion('/categorias');

/** POST /categorias → CategoriaController.crear() (solo ADMINISTRADOR) */
export const crearCategoria = (nombre) => peticion('/categorias', { metodo: 'POST', cuerpo: { nombre } });

/** PUT /categorias/{id}?nombre= → CategoriaController.modificar() */
export const renombrarCategoria = (id, nombre) =>
  peticion(`/categorias/${id}`, { metodo: 'PUT', params: { nombre } });

/** DELETE /categorias/{id} → CategoriaController.eliminar() (la desactiva) */
export const desactivarCategoria = (id) => peticion(`/categorias/${id}`, { metodo: 'DELETE' });
