/**
 * Solicitud para ser organizador (wireframe "Solicitud para ser Organizador").
 *  - Botón "Enviar solicitud" → POST /usuarios/{id}/solicitar-rol-organizador
 *    (UsuarioController.solicitarRol → UsuarioService.solicitarRolOrganizador).
 *    Crea una SolicitudOrganizador PENDIENTE que el administrador revisa en su panel.
 *  - Los campos son los de SolicitudOrganizadorRequest / OrganizacionInfo.
 *
 * @author Santiago Rivas
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRolOrganizador } from '../../api/usuariosApi';
import { useSesion } from '../../context/SesionContext';
import { Aviso, EncabezadoVolver } from '../../components/Comunes';
import { TIPOS_ORGANIZACION } from '../../utils/formato';

export default function SerOrganizador() {
  const { usuario } = useSesion();
  const [datos, setDatos] = useState({
    nombreEntidad: '',
    tipo: 'GRUPO_LOCAL',
    telefonoContacto: '',
    sitioWeb: '',
    direccion: '',
  });
  const [politicas, setPoliticas] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [error, setError] = useState('');
  const [enviada, setEnviada] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!politicas || !terminos) {
      setError('Debes aceptar las políticas de publicación y los términos (marca las dos casillas).');
      return;
    }
    setOcupado(true);
    try {
      await solicitarRolOrganizador(usuario.id, datos);
      setEnviada(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(false);
    }
  }

  if (enviada)
    return (
      <div className="pantalla">
        <div className="vacio">
          <div className="icono">📨</div>
          <h2>¡Solicitud enviada!</h2>
          <p>
            El equipo administrador revisará tu solicitud. Cuando la aprueben, cierra sesión y vuelve a entrar para
            ver tu panel de organizador.
          </p>
        </div>
        <Link className="boton boton-principal ancho-completo" to="/">
          Volver al inicio
        </Link>
      </div>
    );

  return (
    <form className="pantalla" onSubmit={enviar}>
      <EncabezadoVolver titulo="Ser Organizador" />

      <div className="aviso aviso-info" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 30 }}>📣</span>
        <div>
          <strong>Publica tus eventos en City Pulse</strong>
          <br />
          Completa los datos de tu entidad. Toma menos de 1 minuto.
        </div>
      </div>

      <div className="campo">
        <label htmlFor="entidad">Nombre de la entidad u organización</label>
        <p className="ayuda">Así aparecerá en tus publicaciones</p>
        <input id="entidad" className="entrada" placeholder="Ej. Fundación Cultural Galeras"
          value={datos.nombreEntidad} onChange={cambiar('nombreEntidad')} required />
      </div>

      <div className="campo">
        <label htmlFor="telefono">Teléfono de contacto</label>
        <input id="telefono" className="entrada" placeholder="Ej. +57 312 456 7890"
          value={datos.telefonoContacto} onChange={cambiar('telefonoContacto')} required />
      </div>

      <span className="etiqueta">Tipo de organización</span>
      <div className="chips envolver">
        {Object.entries(TIPOS_ORGANIZACION).map(([valor, texto]) => (
          <button type="button" key={valor} className={`chip ${datos.tipo === valor ? 'activo' : ''}`}
            onClick={() => setDatos({ ...datos, tipo: valor })}>
            {texto}
          </button>
        ))}
      </div>

      <div className="campo">
        <label htmlFor="web">Sitio web (opcional)</label>
        <input id="web" className="entrada" placeholder="https://" value={datos.sitioWeb} onChange={cambiar('sitioWeb')} />
      </div>

      <div className="campo">
        <label htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" className="entrada" placeholder="Calle, barrio, ciudad"
          value={datos.direccion} onChange={cambiar('direccion')} />
      </div>

      <label className="casilla">
        <input type="checkbox" checked={politicas} onChange={(e) => setPoliticas(e.target.checked)} />
        Acepto las políticas de publicación de eventos
      </label>
      <label className="casilla">
        <input type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} />
        Acepto los términos y condiciones
      </label>

      <Aviso tipo="error">{error}</Aviso>

      <button className="boton boton-principal ancho-completo" disabled={ocupado}>
        {ocupado ? 'Enviando…' : '✈️ Enviar solicitud'}
      </button>

      <Aviso tipo="info">
        El equipo administrador revisará tu solicitud y te avisaremos por correo cuando haya respuesta.
      </Aviso>
    </form>
  );
}
