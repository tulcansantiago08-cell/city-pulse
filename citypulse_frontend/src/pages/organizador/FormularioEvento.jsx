/**
 * Crear o editar un evento (wireframe "Crear Evento").
 *  - /eventos/nuevo        → botón "Publicar evento" → POST /eventos (EventoController.crear)
 *  - /eventos/{id}/editar  → carga GET /eventos/{id} y guarda con PUT /eventos/{id} (EventoController.editar)
 *
 * El cuerpo que se envía es CrearEventoRequest / EditarEventoRequest:
 *   titulo, descripcion, categoriaId, fechaInicio, fechaFin, modalidad, flyerUrl, precio,
 *   canalInscripcion: { tipo: URL | WHATSAPP | FORMULARIO, destino, mensajePredefinido?, proveedor? }
 * El backend valida (400): campos obligatorios, fechas futuras (@Future) y que fin sea después de inicio.
 *
 * @author Santiago Rivas
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearEvento, editarEvento, obtenerEvento } from '../../api/eventosApi';
import { listarCategorias } from '../../api/categoriasApi';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Cargando, EncabezadoVolver } from '../../components/Comunes';
import { emojiCategoria, separarFechaHora, unirFechaHora } from '../../utils/formato';

const CANALES = [
  { tipo: 'URL', texto: '🔗 URL', ayuda: 'Enlace a la página del evento', marcador: 'https://' },
  { tipo: 'WHATSAPP', texto: '💬 WhatsApp', ayuda: 'Número con indicativo', marcador: '+57 312 456 7890' },
  { tipo: 'FORMULARIO', texto: '📝 Formulario', ayuda: 'Enlace al formulario (Google Forms, etc.)', marcador: 'https://forms.gle/…' },
];

const VACIO = {
  titulo: '',
  descripcion: '',
  categoriaId: '',
  fechaInicio: '',
  horaInicio: '',
  fechaFin: '',
  horaFin: '',
  modalidad: 'PRESENCIAL',
  flyerUrl: '',
  precio: '',
  canalTipo: 'URL',
  canalDestino: '',
  mensajePredefinido: '',
  proveedor: '',
};

export default function FormularioEvento() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [f, setF] = useState(VACIO);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(esEdicion);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  // En edición, rellenar el formulario con el evento actual
  useEffect(() => {
    if (!esEdicion) return;
    obtenerEvento(id)
      .then((ev) => {
        if (ev.organizadorId !== usuario.id) {
          setError('Solo puedes editar tus propios eventos.');
          return;
        }
        const inicio = separarFechaHora(ev.fechaInicio);
        const fin = separarFechaHora(ev.fechaFin);
        setF({
          titulo: ev.titulo,
          descripcion: ev.descripcion,
          categoriaId: ev.categoriaId,
          fechaInicio: inicio.fecha,
          horaInicio: inicio.hora,
          fechaFin: fin.fecha,
          horaFin: fin.hora,
          modalidad: ev.modalidad,
          flyerUrl: ev.flyerUrl || '',
          precio: ev.precio ?? '',
          canalTipo: ev.canalInscripcion?.tipo || 'URL',
          canalDestino: ev.canalInscripcion?.destino || '',
          mensajePredefinido: ev.canalInscripcion?.mensajePredefinido || '',
          proveedor: ev.canalInscripcion?.proveedor || '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [esEdicion, id, usuario]);

  const cambiar = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  /** Convierte el formulario en el JSON que espera el backend */
  function armarCuerpo() {
    const canal = { tipo: f.canalTipo, destino: f.canalDestino.trim() };
    if (f.canalTipo === 'WHATSAPP' && f.mensajePredefinido) canal.mensajePredefinido = f.mensajePredefinido;
    if (f.canalTipo === 'FORMULARIO' && f.proveedor) canal.proveedor = f.proveedor;
    return {
      titulo: f.titulo.trim(),
      descripcion: f.descripcion.trim(),
      categoriaId: f.categoriaId,
      fechaInicio: unirFechaHora(f.fechaInicio, f.horaInicio),
      fechaFin: unirFechaHora(f.fechaFin, f.horaFin),
      modalidad: f.modalidad,
      flyerUrl: f.flyerUrl.trim() || null,
      precio: f.precio === '' ? null : Number(f.precio),
      canalInscripcion: canal,
    };
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    const cuerpo = armarCuerpo();
    if (new Date(cuerpo.fechaFin) <= new Date(cuerpo.fechaInicio)) {
      setError('La finalización debe ser después del inicio.');
      return;
    }
    setOcupado(true);
    try {
      const guardado = esEdicion ? await editarEvento(id, cuerpo) : await crearEvento(cuerpo);
      navegar(`/eventos/${guardado.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  }

  if (cargando) return <Cargando />;
  const canal = CANALES.find((c) => c.tipo === f.canalTipo);

  return (
    <form className="pantalla" onSubmit={enviar}>
      <EncabezadoVolver titulo={esEdicion ? 'Editar evento' : 'Crear evento'} />

      <div className="campo">
        <label htmlFor="flyer">Imagen del flyer (opcional)</label>
        <p className="ayuda">Pega el enlace de la imagen (JPG, PNG o WebP). Si lo dejas vacío se usa un color.</p>
        <input id="flyer" type="url" className="entrada" placeholder="https://…/flyer.jpg"
          value={f.flyerUrl} onChange={cambiar('flyerUrl')} />
      </div>

      <div className="campo">
        <label htmlFor="titulo">Título</label>
        <input id="titulo" className="entrada" placeholder="Ej. Novena Navideña Comunitaria" maxLength={100}
          value={f.titulo} onChange={cambiar('titulo')} required />
        <div className="contador">{f.titulo.length}/100</div>
      </div>

      <div className="campo">
        <label htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" className="entrada" placeholder="Cuéntale a la gente de qué trata tu evento…"
          maxLength={1000} value={f.descripcion} onChange={cambiar('descripcion')} required />
        <div className="contador">{f.descripcion.length}/1000</div>
      </div>

      <div className="campo">
        <label htmlFor="categoria">Categoría</label>
        <select id="categoria" className="entrada" value={f.categoriaId} onChange={cambiar('categoriaId')} required>
          <option value="">Selecciona una categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {emojiCategoria(c.nombre)} {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="fila">
        <div className="campo">
          <label htmlFor="fi">Inicio</label>
          <input id="fi" type="date" className="entrada" value={f.fechaInicio} onChange={cambiar('fechaInicio')} required />
        </div>
        <div className="campo">
          <label htmlFor="hi">Hora</label>
          <input id="hi" type="time" className="entrada" value={f.horaInicio} onChange={cambiar('horaInicio')} required />
        </div>
      </div>
      <div className="fila">
        <div className="campo">
          <label htmlFor="ff">Finalización</label>
          <input id="ff" type="date" className="entrada" value={f.fechaFin} onChange={cambiar('fechaFin')} required />
        </div>
        <div className="campo">
          <label htmlFor="hf">Hora</label>
          <input id="hf" type="time" className="entrada" value={f.horaFin} onChange={cambiar('horaFin')} required />
        </div>
      </div>

      <span className="etiqueta">Modalidad</span>
      <div className="segmentado" style={{ marginBottom: 18 }}>
        <button type="button" className={f.modalidad === 'PRESENCIAL' ? 'activo' : ''}
          onClick={() => setF({ ...f, modalidad: 'PRESENCIAL' })}>
          📍 Presencial
        </button>
        <button type="button" className={f.modalidad === 'VIRTUAL' ? 'activo' : ''}
          onClick={() => setF({ ...f, modalidad: 'VIRTUAL' })}>
          💻 Virtual
        </button>
      </div>

      <div className="campo">
        <label htmlFor="precio">
          Precio de inscripción <span className="suave">(opcional)</span>
        </label>
        <input id="precio" type="number" min="0" step="100" className="entrada" placeholder="$ 0"
          value={f.precio} onChange={cambiar('precio')} />
        <p className="ayuda" style={{ marginTop: 6 }}>ⓘ Si lo dejas vacío, se publicará como <strong>Gratuito</strong></p>
      </div>

      <span className="etiqueta">Canal de inscripción</span>
      <div className="chips envolver">
        {CANALES.map((c) => (
          <button type="button" key={c.tipo} className={`chip ${f.canalTipo === c.tipo ? 'activo' : ''}`}
            onClick={() => setF({ ...f, canalTipo: c.tipo })}>
            {c.texto}
          </button>
        ))}
      </div>
      <div className="campo">
        <p className="ayuda">{canal.ayuda}</p>
        <input className="entrada" placeholder={canal.marcador} value={f.canalDestino}
          onChange={cambiar('canalDestino')} required aria-label="Destino de inscripción" />
      </div>
      {f.canalTipo === 'WHATSAPP' && (
        <div className="campo">
          <label htmlFor="mensaje">Mensaje predefinido (opcional)</label>
          <input id="mensaje" className="entrada" placeholder="Hola, quiero inscribirme…"
            value={f.mensajePredefinido} onChange={cambiar('mensajePredefinido')} />
        </div>
      )}
      {f.canalTipo === 'FORMULARIO' && (
        <div className="campo">
          <label htmlFor="proveedor">Proveedor (opcional)</label>
          <input id="proveedor" className="entrada" placeholder="Google Forms" value={f.proveedor}
            onChange={cambiar('proveedor')} />
        </div>
      )}

      <Aviso tipo="error">{error}</Aviso>

      <button className="boton boton-publicar ancho-completo" disabled={ocupado}>
        {ocupado ? 'Guardando…' : esEdicion ? 'Guardar cambios →' : 'Publicar evento →'}
      </button>
      {!esEdicion && (
        <p className="centrado suave pequeno">Tu evento aparecerá de inmediato en la cartelera.</p>
      )}
    </form>
  );
}
