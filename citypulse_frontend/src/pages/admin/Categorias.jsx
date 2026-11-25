/**
 * Gestión de categorías (wireframe "Admin - Gestión de Categorías").
 *  - Listar:     GET    /categorias            → CategoriaController.listar (solo activas)
 *  - Crear:      POST   /categorias {nombre}   → CategoriaController.crear   (409 si ya existe)
 *  - Renombrar:  PUT    /categorias/{id}?nombre → CategoriaController.modificar
 *  - Desactivar: DELETE /categorias/{id}       → CategoriaController.eliminar (queda activa=false)
 *
 * @author Santiago Rivas
 */
import { useCallback, useEffect, useState } from 'react';
import {
  crearCategoria,
  desactivarCategoria,
  listarCategorias,
  renombrarCategoria,
} from '../../api/categoriasApi';
import { Aviso, Cargando, Confirmacion } from '../../components/Comunes';
import { emojiCategoria } from '../../utils/formato';

export default function Categorias() {
  const [categorias, setCategorias] = useState(null);
  const [nueva, setNueva] = useState('');
  const [editando, setEditando] = useState(null); // { id, nombre }
  const [desactivar, setDesactivar] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => {
    listarCategorias()
      .then(setCategorias)
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, []);

  useEffect(cargar, [cargar]);

  async function crear(e) {
    e.preventDefault();
    try {
      await crearCategoria(nueva.trim());
      setMensaje({ tipo: 'exito', texto: `Categoría "${nueva.trim()}" creada.` });
      setNueva('');
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.status === 409 ? 'Ya existe una categoría con ese nombre.' : err.message });
    }
  }

  async function guardarNombre(e) {
    e.preventDefault();
    try {
      await renombrarCategoria(editando.id, editando.nombre.trim());
      setMensaje({ tipo: 'exito', texto: 'Categoría renombrada.' });
      setEditando(null);
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  }

  async function confirmarDesactivar() {
    setOcupado(true);
    try {
      await desactivarCategoria(desactivar.id);
      setMensaje({ tipo: 'exito', texto: `"${desactivar.nombre}" desactivada: ya no aparece en la cartelera.` });
      setDesactivar(null);
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
      setDesactivar(null);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="pantalla">
      <div className="encabezado">
        <h1>Categorías</h1>
      </div>

      <form className="tarjeta" onSubmit={crear} style={{ marginBottom: 18 }}>
        <label className="etiqueta" htmlFor="nueva">Nueva categoría</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input id="nueva" className="entrada" placeholder="Ej. Deportes" value={nueva}
            onChange={(e) => setNueva(e.target.value)} required />
          <button className="boton boton-oscuro">Crear</button>
        </div>
      </form>

      <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
      {!categorias && <Cargando />}

      {(categorias || []).map((c) => (
        <div key={c.id} className="tarjeta fila-categoria">
          <span style={{ fontSize: 24 }}>{emojiCategoria(c.nombre)}</span>
          {editando?.id === c.id ? (
            <form onSubmit={guardarNombre} style={{ display: 'flex', gap: 8, flex: 1 }}>
              <input className="entrada" value={editando.nombre} autoFocus
                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} required
                style={{ padding: '10px 12px' }} />
              <button className="accion" title="Guardar">✓</button>
              <button type="button" className="accion" title="Cancelar" onClick={() => setEditando(null)}>✕</button>
            </form>
          ) : (
            <>
              <span className="nombre">{c.nombre}</span>
              <button className="accion" title="Renombrar" onClick={() => setEditando({ id: c.id, nombre: c.nombre })}>
                ✏️
              </button>
              <button className="accion peligro" title="Desactivar" onClick={() => setDesactivar(c)}>
                🗑️
              </button>
            </>
          )}
        </div>
      ))}

      {desactivar && (
        <Confirmacion
          titulo={`¿Desactivar "${desactivar.nombre}"?`}
          textoConfirmar="Desactivar"
          peligro
          ocupado={ocupado}
          onConfirmar={confirmarDesactivar}
          onCancelar={() => setDesactivar(null)}
        >
          Dejará de aparecer en la cartelera y al crear eventos. Los eventos que ya la usan no se borran.
        </Confirmacion>
      )}
    </div>
  );
}
