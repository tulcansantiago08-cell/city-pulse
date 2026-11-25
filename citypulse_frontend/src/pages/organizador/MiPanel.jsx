/**
 * Panel del organizador (wireframe "Eventos Publicados" / Mi panel).
 *
 *  - Lista "Mis eventos":  GET /eventos/organizador/{id} → EventoController.listarPorOrganizador
 *  - Calendario del mes:   GET /eventos/organizador/{id}/calendario?mes&anio → EventoController.calendario
 *                          (EventoService.obtenerCalendarioMensual). Tocar un día morado filtra la lista.
 *  - Métricas: eventos activos (PROXIMO o EN_CURSO) y suma de contadorClics (intención de inscripción).
 *  - Acciones de cada evento:
 *      ✏️ Editar   → FormularioEvento.jsx → PUT /eventos/{id}
 *      👁️ Ocultar  → PATCH /eventos/{id}/visibilidad?oculto=true|false
 *      ⛔ Cancelar → PATCH /eventos/{id}/cancelar
 *      🗑️ Eliminar → DELETE /eventos/{id}
 *
 * @author Santiago Rivas
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  cambiarVisibilidad,
  cancelarEvento,
  eliminarEvento,
  listarMisEventos,
  obtenerCalendario,
} from '../../api/eventosApi';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Cargando, Confirmacion, Vacio } from '../../components/Comunes';
import { ESTADOS, emojiEvento, fechaCorta, fondoEvento, nombreMes } from '../../utils/formato';

const NOMBRES_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Celdas del mes empezando en lunes; null = hueco antes del día 1 */
function celdasDelMes(anio, mes) {
  const primero = new Date(anio, mes - 1, 1);
  const huecos = (primero.getDay() + 6) % 7; // lunes = 0
  const dias = new Date(anio, mes, 0).getDate();
  return [...Array(huecos).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
}

export default function MiPanel() {
  const { usuario, perfil } = useSesion();
  const navegar = useNavigate();
  const hoy = new Date();
  const [eventos, setEventos] = useState(null);
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [calendario, setCalendario] = useState({});
  const [diaElegido, setDiaElegido] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [confirmar, setConfirmar] = useState(null); // { accion: 'cancelar'|'eliminar', evento }
  const [ocupado, setOcupado] = useState(false);

  // Si se piden datos dos veces seguidas (p. ej. ocultar y luego eliminar), la respuesta vieja
  // puede llegar después de la nueva. Con este contador solo se usa la respuesta más reciente.
  const ultimaPeticion = useRef({ eventos: 0, calendario: 0 });

  const cargarEventos = useCallback(() => {
    const numero = ++ultimaPeticion.current.eventos;
    listarMisEventos(usuario.id)
      .then((lista) => {
        if (numero !== ultimaPeticion.current.eventos) return;
        setEventos([...lista].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio)));
      })
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, [usuario]);

  const cargarCalendario = useCallback(() => {
    const numero = ++ultimaPeticion.current.calendario;
    obtenerCalendario(usuario.id, mes, anio)
      .then((datos) => numero === ultimaPeticion.current.calendario && setCalendario(datos))
      .catch(() => setCalendario({}));
  }, [usuario, mes, anio]);

  useEffect(cargarEventos, [cargarEventos]);
  useEffect(cargarCalendario, [cargarCalendario]);

  // La primera vez, el calendario se abre en el mes del próximo evento
  const mesAjustado = useRef(false);
  useEffect(() => {
    if (!eventos || mesAjustado.current) return;
    mesAjustado.current = true;
    const proximo = eventos
      .filter((e) => new Date(e.fechaInicio) >= new Date())
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))[0];
    if (proximo) {
      const f = new Date(proximo.fechaInicio);
      setMes(f.getMonth() + 1);
      setAnio(f.getFullYear());
    }
  }, [eventos]);

  function moverMes(delta) {
    const fecha = new Date(anio, mes - 1 + delta, 1);
    setMes(fecha.getMonth() + 1);
    setAnio(fecha.getFullYear());
    setDiaElegido(null);
  }

  const activos = (eventos || []).filter((e) => e.estado === 'PROXIMO' || e.estado === 'EN_CURSO').length;
  const clics = (eventos || []).reduce((total, e) => total + (e.contadorClics || 0), 0);

  // El calendario llega como { "2026-12-16": [eventos], ... }
  const diasConEvento = useMemo(() => new Set(Object.keys(calendario).map((f) => Number(f.slice(8, 10)))), [calendario]);

  const visibles = (eventos || []).filter((e) => {
    if (!diaElegido) return true;
    const f = new Date(e.fechaInicio);
    return f.getFullYear() === anio && f.getMonth() + 1 === mes && f.getDate() === diaElegido;
  });

  async function alternarVisibilidad(evento) {
    try {
      const ocultar = evento.estado !== 'OCULTO';
      await cambiarVisibilidad(evento.id, ocultar);
      setMensaje({ tipo: 'exito', texto: ocultar ? 'Evento oculto: ya no sale en la cartelera.' : 'Evento visible de nuevo.' });
      cargarEventos();
      cargarCalendario();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
    }
  }

  async function ejecutarConfirmacion() {
    const { accion, evento } = confirmar;
    setOcupado(true);
    try {
      if (accion === 'eliminar') {
        await eliminarEvento(evento.id);
        setEventos((lista) => lista.filter((e) => e.id !== evento.id)); // se quita al instante
      } else {
        await cancelarEvento(evento.id);
      }
      setMensaje({ tipo: 'exito', texto: accion === 'eliminar' ? 'Evento eliminado.' : 'Evento cancelado.' });
      setConfirmar(null);
      cargarEventos();
      cargarCalendario();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
      setConfirmar(null);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="pantalla">
      <div className="encabezado">
        <div>
          <h1>Mi panel</h1>
          {perfil && <span className="suave">{[perfil.nombre, perfil.apellido].filter(Boolean).join(' ')}</span>}
        </div>
        <Link className="boton boton-principal boton-pequeno" to="/eventos/nuevo">
          + Crear evento
        </Link>
      </div>

      <div className="metricas">
        <div className="metrica destacada">
          <div>Eventos activos</div>
          <div className="numero">{eventos ? activos : '–'}</div>
        </div>
        <div className="metrica">
          <div className="suave">👁️ Intención de inscripción</div>
          <div className="numero">
            {eventos ? clics : '–'} <span style={{ fontSize: 15, color: 'var(--verde)' }}>clics</span>
          </div>
        </div>
      </div>

      <div className="tarjeta calendario">
        <div className="cabecera">
          <h2>
            {nombreMes(mes)} {anio}
          </h2>
          <div className="flechas">
            <button onClick={() => moverMes(-1)} aria-label="Mes anterior">‹</button>
            <button onClick={() => moverMes(1)} aria-label="Mes siguiente">›</button>
          </div>
        </div>
        <div className="dias">
          {NOMBRES_DIA.map((d) => (
            <div key={d} className="nombre-dia">{d}</div>
          ))}
          {celdasDelMes(anio, mes).map((dia, i) =>
            dia ? (
              <button
                key={i}
                className={`${diasConEvento.has(dia) ? 'con-evento' : ''} ${diaElegido === dia ? 'seleccionado' : ''}`}
                onClick={() => diasConEvento.has(dia) && setDiaElegido(diaElegido === dia ? null : dia)}
              >
                {dia}
              </button>
            ) : (
              <span key={i} />
            )
          )}
        </div>
        <p className="suave pequeno" style={{ marginBottom: 0 }}>
          🟪 Días con eventos activos · toca un día para filtrar
        </p>
      </div>

      <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>

      <div className="titulo-seccion">
        <h2>{diaElegido ? `Eventos del ${diaElegido}` : 'Mis eventos'}</h2>
        {diaElegido ? (
          <button className="boton boton-claro boton-pequeno" onClick={() => setDiaElegido(null)}>
            Ver todos
          </button>
        ) : (
          <span className="suave pequeno">Más recientes primero</span>
        )}
      </div>

      {!eventos && <Cargando />}
      {eventos && visibles.length === 0 && (
        <Vacio icono="🎪" titulo="Todavía no tienes eventos">
          Crea el primero con el botón +.
        </Vacio>
      )}

      {visibles.map((evento) => {
        const estado = ESTADOS[evento.estado] || ESTADOS.PROXIMO;
        const editable = evento.estado !== 'CANCELADO' && evento.estado !== 'FINALIZADO';
        return (
          <div key={evento.id} className="tarjeta mi-evento">
            <div
              className="miniatura"
              style={{ background: fondoEvento(evento), cursor: 'pointer' }}
              onClick={() => navegar(`/eventos/${evento.id}`)}
            >
              {emojiEvento(evento)}
            </div>
            <div className="info">
              <h3>{evento.titulo}</h3>
              <div className="suave pequeno">
                {fechaCorta(evento.fechaInicio)} · 👁️ {evento.contadorClics} clics
              </div>
              <div className="acciones-evento">
                <span className={`estado ${estado.clase}`}>{estado.texto}</span>
              </div>
              <div className="acciones-evento">
                {editable && (
                  <>
                    <button className="accion" title="Editar" onClick={() => navegar(`/eventos/${evento.id}/editar`)}>
                      ✏️
                    </button>
                    <button
                      className="accion"
                      title={evento.estado === 'OCULTO' ? 'Mostrar' : 'Ocultar'}
                      onClick={() => alternarVisibilidad(evento)}
                    >
                      {evento.estado === 'OCULTO' ? '👁️' : '🙈'}
                    </button>
                    <button className="accion" title="Cancelar evento" onClick={() => setConfirmar({ accion: 'cancelar', evento })}>
                      ⛔
                    </button>
                  </>
                )}
                <button className="accion peligro" title="Eliminar" onClick={() => setConfirmar({ accion: 'eliminar', evento })}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {confirmar && (
        <Confirmacion
          titulo={confirmar.accion === 'eliminar' ? '¿Eliminar este evento?' : '¿Cancelar este evento?'}
          textoConfirmar={confirmar.accion === 'eliminar' ? 'Eliminar' : 'Cancelar evento'}
          peligro
          ocupado={ocupado}
          onConfirmar={ejecutarConfirmacion}
          onCancelar={() => setConfirmar(null)}
        >
          <strong>{confirmar.evento.titulo}</strong>
          <br />
          {confirmar.accion === 'eliminar'
            ? 'Desaparecerá de la cartelera y de tu panel. No se puede deshacer.'
            : 'Seguirá en tu panel como CANCELADO y los asistentes ya no podrán inscribirse.'}
        </Confirmacion>
      )}
    </div>
  );
}
