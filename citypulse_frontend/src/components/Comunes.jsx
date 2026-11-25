/**
 * Piezas pequeñas que usan varias pantallas: avisos, carga, vacío, encabezado con "volver"
 * y la ventana de confirmación.
 *
 * @author Santiago Rivas
 */
import { useNavigate } from 'react-router-dom';

/** Aviso de color: tipo = error | exito | alerta | info */
export function Aviso({ tipo = 'info', children }) {
  if (!children) return null;
  return <div className={`aviso aviso-${tipo}`}>{children}</div>;
}

export function Cargando({ texto = 'Cargando…' }) {
  return <div className="cargando">{texto}</div>;
}

export function Vacio({ icono = '🗓️', titulo, children }) {
  return (
    <div className="vacio">
      <div className="icono">{icono}</div>
      {titulo && <h3>{titulo}</h3>}
      {children && <p>{children}</p>}
    </div>
  );
}

/** Encabezado con botón "‹" para volver atrás */
export function EncabezadoVolver({ titulo, derecha }) {
  const navegar = useNavigate();
  return (
    <div className="encabezado">
      <div className="encabezado-titulo">
        <button className="boton-icono" onClick={() => navegar(-1)} aria-label="Volver">
          ‹
        </button>
        <h1 style={{ fontSize: 24 }}>{titulo}</h1>
      </div>
      {derecha}
    </div>
  );
}

/** Ventana inferior para confirmar acciones irreversibles (eliminar, cancelar, rechazar) */
export function Confirmacion({ titulo, children, textoConfirmar, peligro, onConfirmar, onCancelar, ocupado }) {
  return (
    <div className="fondo-modal" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        <div className="suave">{children}</div>
        <div className="botones">
          <button className="boton boton-claro" onClick={onCancelar} disabled={ocupado}>
            Volver
          </button>
          <button
            className={`boton ${peligro ? 'boton-peligro' : 'boton-principal'}`}
            onClick={onConfirmar}
            disabled={ocupado}
          >
            {ocupado ? 'Un momento…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
