/**
 * Tarjeta de un evento en el grid (wireframe "Grid de eventos").
 * Recibe un EventoCardResponse del backend: id, titulo, flyerUrl, fechaInicio,
 * precioFormateado, nombreOrganizador y estado.
 *
 * @author Santiago Rivas
 */
import { useNavigate } from 'react-router-dom';
import IconoGuardar from './IconoGuardar';
import { diaYMes, emojiEvento, fondoEvento, hora, precioDeTarjeta } from '../utils/formato';

export default function TarjetaEvento({ evento, guardado, onGuardar }) {
  const navegar = useNavigate();
  const { dia, mes } = diaYMes(evento.fechaInicio);
  const precio = precioDeTarjeta(evento.precioFormateado);
  const abrir = () => navegar(`/eventos/${evento.id}`);

  return (
    <article className="tarjeta-evento" onClick={abrir}>
      <div className="imagen-evento" style={{ background: fondoEvento(evento) }}>
        <div className="etiqueta-fecha">
          <strong>{dia}</strong>
          <span>{mes}</span>
        </div>
        {onGuardar && (
          <button
            className="boton-guardar"
            title={guardado ? 'Quitar de guardados' : 'Guardar'}
            onClick={(e) => {
              e.stopPropagation(); // no abrir el detalle al guardar
              onGuardar(evento.id);
            }}
          >
            <IconoGuardar lleno={guardado} />
          </button>
        )}
        {emojiEvento(evento)}
      </div>
      <div className="cuerpo-evento">
        <span className="organizador-evento">{evento.nombreOrganizador}</span>
        <h3 className="titulo-evento">{evento.titulo}</h3>
        <span className="hora-evento">🕒 {hora(evento.fechaInicio)}</span>
        <div className="pie-evento">
          <span className={`precio ${precio === 'Gratuito' ? 'gratis' : ''}`}>{precio}</span>
          <button className="boton boton-oscuro boton-pequeno" onClick={abrir}>
            Inscribirme
          </button>
        </div>
      </div>
    </article>
  );
}
