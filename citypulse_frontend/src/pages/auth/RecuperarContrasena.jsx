/**
 * Recuperar contraseña (wireframe "Recuperar Contraseña"). Tiene dos pasos:
 *  1. POST /auth/recuperar-password → AuthController.recuperar. Responde siempre lo mismo,
 *     exista o no el correo (HU004: no revelar qué correos están registrados).
 *  2. POST /auth/restablecer-password → AuthController.restablecer con el token y la nueva clave.
 *
 * @author Santiago Rivas
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { restablecerPassword, solicitarRecuperacion } from '../../api/authApi';
import { Aviso, EncabezadoVolver } from '../../components/Comunes';

export default function RecuperarContrasena() {
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [token, setToken] = useState('');
  const [nueva, setNueva] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function pedirEnlace(e) {
    e.preventDefault();
    setOcupado(true);
    try {
      const res = await solicitarRecuperacion(correo.trim());
      setMensaje({ tipo: 'exito', texto: res.mensaje });
      setPaso(2);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(false);
    }
  }

  async function cambiar(e) {
    e.preventDefault();
    if (nueva.length < 8) return setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 8 caracteres.' });
    setOcupado(true);
    try {
      const res = await restablecerPassword(token.trim(), nueva);
      setMensaje({ tipo: 'exito', texto: res.mensaje });
      setListo(true);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="pantalla sin-nav">
      <EncabezadoVolver titulo="Recuperar contraseña" />

      {paso === 1 && (
        <form onSubmit={pedirEnlace}>
          <p className="suave" style={{ marginTop: -6 }}>
            Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
          </p>
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input id="correo" type="email" className="entrada" placeholder="tucorreo@ejemplo.com"
              value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </div>
          <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
          <button className="boton boton-principal ancho-completo" disabled={ocupado}>
            {ocupado ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={cambiar}>
          <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
          {!listo && (
            <>
              <Aviso tipo="info">
                En esta versión el enlace aparece en la Terminal del backend
                (<code>[NOTIFICACION] Recuperación de contraseña … token=…</code>).
              </Aviso>
              <div className="campo">
                <label htmlFor="token">Código de recuperación</label>
                <input id="token" className="entrada" value={token} onChange={(e) => setToken(e.target.value)} required />
              </div>
              <div className="campo">
                <label htmlFor="nueva">Nueva contraseña</label>
                <p className="ayuda">Mínimo 8 caracteres</p>
                <input id="nueva" type="password" className="entrada" value={nueva}
                  onChange={(e) => setNueva(e.target.value)} required autoComplete="new-password" />
              </div>
              <button className="boton boton-principal ancho-completo" disabled={ocupado}>
                {ocupado ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </>
          )}
          {listo && (
            <Link className="boton boton-principal ancho-completo" to="/iniciar-sesion">
              Iniciar sesión
            </Link>
          )}
        </form>
      )}
    </div>
  );
}
