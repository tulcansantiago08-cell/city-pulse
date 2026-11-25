/**
 * Eventos guardados del asistente (pestaña "Guardados").
 *  - GET    /usuarios/{id}/favoritos             → FavoritoController.listar → FavoritoService.listar
 *  - DELETE /usuarios/{id}/favoritos/{eventoId}  → al tocar 🔖 en una tarjeta
 * En MongoDB los favoritos van embebidos dentro del documento del asistente (colección usuarios).
 *
 * @author Santiago Rivas
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarFavoritos, quitarFavorito } from '../../api/usuariosApi';
import { useSesion } from '../../context/SesionContext';
import TarjetaEvento from '../../components/TarjetaEvento';
import { Aviso, Cargando, Vacio } from '../../components/Comunes';

export default function Guardados() {
  const { usuario } = useSesion();
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listarFavoritos(usuario.id)
      .then(setEventos)
      .catch((e) => setError(e.message));
  }, [usuario]);

  async function quitar(eventoId) {
    try {
      await quitarFavorito(usuario.id, eventoId);
      setEventos((lista) => lista.filter((e) => e.id !== eventoId));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="pantalla">
      <div className="encabezado">
        <h1>Guardados</h1>
      </div>
      <Aviso tipo="error">{error}</Aviso>
      {!eventos && !error && <Cargando />}
      {eventos && eventos.length === 0 && (
        <Vacio icono="🔖" titulo="Aún no guardas eventos">
          Toca el marcador en cualquier evento para guardarlo aquí. <Link to="/">Explorar eventos</Link>
        </Vacio>
      )}
      <div className="grid-eventos">
        {(eventos || []).map((evento) => (
          <TarjetaEvento key={evento.id} evento={evento} guardado onGuardar={quitar} />
        ))}
      </div>
    </div>
  );
}
