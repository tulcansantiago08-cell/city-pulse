/**
 * Pantalla de inicio: grid de eventos (wireframes "Grid de eventos" y "resultados Filtrado").
 *
 * Datos que pide al backend:
 *  - GET /categorias → chips de categorías (CategoriaController.listar)
 *  - GET /eventos    → eventos públicos ordenados por fecha (EventoController.listar →
 *                      EventoService.listarPublicosOrdenadosPorFecha)
 *  - GET /eventos?categoriaId=&modalidad=&fechaDesde=&fechaHasta= → cuando hay filtros
 *                      (EventoService.filtrar). Los filtros llegan en la URL desde Filtrar.jsx.
 * La barra "Buscar eventos…" filtra por título en el navegador (no hay endpoint de búsqueda).
 *
 * @author Santiago Rivas
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listarCategorias } from '../../api/categoriasApi';
import { listarEventos } from '../../api/eventosApi';
import TarjetaEvento from '../../components/TarjetaEvento';
import useFavoritos from '../../components/useFavoritos';
import { Aviso, Cargando, Vacio } from '../../components/Comunes';
import { emojiCategoria } from '../../utils/formato';
import { useSesion } from '../../context/SesionContext';

export default function Inicio() {
  const { perfil } = useSesion();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const [categorias, setCategorias] = useState([]);
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const favoritos = useFavoritos();

  const filtros = useMemo(
    () => ({
      categoriaId: params.get('categoriaId') || undefined,
      modalidad: params.get('modalidad') || undefined,
      fechaDesde: params.get('fechaDesde') || undefined,
      fechaHasta: params.get('fechaHasta') || undefined,
    }),
    [params]
  );
  const hayFiltrosAvanzados = Boolean(filtros.modalidad || filtros.fechaDesde || filtros.fechaHasta);

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    setEventos(null);
    setError('');
    listarEventos(filtros)
      .then(setEventos)
      .catch((e) => setError(e.message));
  }, [filtros]);

  function elegirCategoria(id) {
    const nuevos = new URLSearchParams(params);
    if (id) nuevos.set('categoriaId', id);
    else nuevos.delete('categoriaId');
    setParams(nuevos);
  }

  const visibles = (eventos || []).filter((e) =>
    e.titulo.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <div className="pantalla">
      <div className="encabezado">
        <div>
          <div className="ubicacion">📍 Pasto, Nariño</div>
          <h1>{perfil?.nombre ? `Hola, ${perfil.nombre} ✨` : '¿Qué hay para hoy? ✨'}</h1>
        </div>
      </div>

      <div className="buscador">
        <div className="caja">
          <span>🔍</span>
          <input
            placeholder="Buscar eventos…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button
          className="boton-icono oscuro"
          title="Filtrar eventos"
          onClick={() => navegar(`/filtrar?${params.toString()}`)}
          style={{ width: 54, height: 54, borderRadius: 18 }}
        >
          ⚙️
        </button>
      </div>

      <div className="chips">
        <button className={`chip ${!filtros.categoriaId ? 'activo' : ''}`} onClick={() => elegirCategoria(null)}>
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            className={`chip ${filtros.categoriaId === c.id ? 'activo' : ''}`}
            onClick={() => elegirCategoria(c.id)}
          >
            {emojiCategoria(c.nombre)} {c.nombre}
          </button>
        ))}
      </div>

      {hayFiltrosAvanzados && (
        <Aviso tipo="info">
          Mostrando resultados filtrados. <Link to="/">Quitar filtros</Link>
        </Aviso>
      )}

      <div className="titulo-seccion">
        <h2>{hayFiltrosAvanzados || filtros.categoriaId ? 'Resultados' : 'Próximos eventos'}</h2>
        {eventos && <span className="suave pequeno">{visibles.length} eventos</span>}
      </div>

      <Aviso tipo="error">{error}</Aviso>
      {!eventos && !error && <Cargando texto="Buscando eventos…" />}
      {eventos && visibles.length === 0 && (
        <Vacio icono="🔎" titulo="No hay eventos">
          Prueba con otra categoría u otras fechas.
        </Vacio>
      )}

      <div className="grid-eventos">
        {visibles.map((evento) => (
          <TarjetaEvento
            key={evento.id}
            evento={evento}
            guardado={favoritos.ids.has(evento.id)}
            onGuardar={favoritos.puedeGuardar ? favoritos.alternar : null}
          />
        ))}
      </div>
    </div>
  );
}
