/**
 * Detalle del evento (wireframe "Detalle del Evento").
 *
 *  - GET /eventos/{id}  → EventoController.detalle() → EventoResponse
 *  - GET /categorias    → para mostrar el nombre de la categoría (el evento solo trae categoriaId)
 *  - Botón 🔖           → favoritos (useFavoritos.js → FavoritoController)
 *  - Botón "Inscribirme" → abre el canal externo del organizador. El enlace se arma igual que
 *    redirigir() en el backend (CanalURL / CanalFormulario / CanalWhatsApp).
 *
 * @author Santiago Rivas
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerEvento } from '../../api/eventosApi';
import { listarCategorias } from '../../api/categoriasApi';
import useFavoritos from '../../components/useFavoritos';
import IconoGuardar from '../../components/IconoGuardar';
import { Aviso, Cargando } from '../../components/Comunes';
import {
  ESTADOS,
  NOMBRE_CANAL,
  diaSemana,
  duracion,
  emojiCategoria,
  emojiEvento,
  enlaceInscripcion,
  fechaCorta,
  fondoEvento,
  hora,
  iniciales,
  precio,
} from '../../utils/formato';

export default function DetalleEvento() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [evento, setEvento] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const favoritos = useFavoritos();

  useEffect(() => {
    obtenerEvento(id)
      .then((ev) => {
        setEvento(ev);
        return listarCategorias().then((lista) => setCategoria(lista.find((c) => c.id === ev.categoriaId)));
      })
      .catch((e) => setError(e.status === 404 ? 'Este evento no existe o fue eliminado.' : e.message));
  }, [id]);

  async function compartir() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* el navegador no permite copiar */
    }
  }

  if (error)
    return (
      <div className="pantalla">
        <Aviso tipo="error">{error}</Aviso>
        <button className="boton boton-claro" onClick={() => navegar('/')}>
          Volver al inicio
        </button>
      </div>
    );
  if (!evento) return <Cargando />;

  const enlace = enlaceInscripcion(evento.canalInscripcion);
  const estado = ESTADOS[evento.estado];
  const inscripcionAbierta = evento.estado === 'PROXIMO' || evento.estado === 'EN_CURSO';

  return (
    <div>
      <div className="portada" style={{ background: fondoEvento(evento) }}>
        <div className="acciones">
          <button className="boton-icono" onClick={() => navegar(-1)} aria-label="Volver">
            ‹
          </button>
          <div>
            <button className="boton-icono" onClick={compartir} title="Copiar enlace">
              {copiado ? '✅' : '🔗'}
            </button>
            {favoritos.puedeGuardar && (
              <button className="boton-icono" onClick={() => favoritos.alternar(evento.id)} title="Guardar">
                <IconoGuardar lleno={favoritos.ids.has(evento.id)} />
              </button>
            )}
          </div>
        </div>
        {emojiEvento(evento)}
      </div>

      <div className="tarjeta ficha">
        <div className="etiquetas">
          {categoria && (
            <span className="etiqueta-morada">
              {emojiCategoria(categoria.nombre)} {categoria.nombre}
            </span>
          )}
          <span className="etiqueta-borde">{evento.modalidad === 'VIRTUAL' ? '💻 Virtual' : '📍 Presencial'}</span>
          {evento.estado !== 'PROXIMO' && <span className={`estado ${estado.clase}`}>{estado.texto}</span>}
        </div>
        <h1>{evento.titulo}</h1>
        <div className="organiza">
          <div className="avatar">{iniciales(evento.nombreOrganizador)}</div>
          <span>
            Organiza <strong style={{ color: 'var(--texto)' }}>{evento.nombreOrganizador}</strong>
          </span>
        </div>
      </div>

      <div className="datos-evento">
        <div className="fila">
          <div className="tarjeta">
            <div style={{ fontSize: 20 }}>📅</div>
            <h3 style={{ marginTop: 8 }}>{fechaCorta(evento.fechaInicio)}</h3>
            <span className="suave pequeno">{diaSemana(evento.fechaInicio)}</span>
          </div>
          <div className="tarjeta">
            <div style={{ fontSize: 20 }}>🕒</div>
            <h3 style={{ marginTop: 8 }}>
              {hora(evento.fechaInicio)} – {hora(evento.fechaFin)}
            </h3>
            <span className="suave pequeno">{duracion(evento.fechaInicio, evento.fechaFin)}</span>
          </div>
        </div>
        <div className="tarjeta dato">
          <div className="icono-dato" style={{ background: 'var(--verde-suave)' }}>
            🏷️
          </div>
          <div>
            <h3>{precio(evento.precio)}</h3>
            <span className="suave pequeno">Precio de inscripción</span>
          </div>
        </div>
      </div>

      <div className="acerca">
        <h2>Acerca del evento</h2>
        <p style={{ whiteSpace: 'pre-line' }}>{evento.descripcion}</p>
      </div>

      <div className="barra-inscripcion">
        <div>
          <span className="suave pequeno">Inscripción por</span>
          <div style={{ fontWeight: 700, color: 'var(--verde)' }}>
            {NOMBRE_CANAL[evento.canalInscripcion?.tipo] || '—'}
          </div>
        </div>
        {inscripcionAbierta && enlace ? (
          <a className="boton boton-principal" href={enlace} target="_blank" rel="noreferrer">
            Inscribirme ↗
          </a>
        ) : (
          <button className="boton boton-claro" disabled>
            Inscripción cerrada
          </button>
        )}
      </div>
    </div>
  );
}
