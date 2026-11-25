/**
 * Crear cuenta (wireframe "Crear Cuenta").
 *
 *  - Botón "Crear cuenta" → POST /auth/registro (AuthController.registrar →
 *    AutenticacionService.registrar). Crea un ASISTENTE con el correo sin verificar
 *    y genera un token de verificación.
 *  - 400: correo inválido o contraseña de menos de 8 caracteres (validación de RegistroUsuarioRequest).
 *  - 409: el correo ya está registrado.
 *
 * @author Santiago Rivas
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registrarse } from '../../api/authApi';
import { Aviso, EncabezadoVolver } from '../../components/Comunes';

export default function CrearCuenta() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [creada, setCreada] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirmar) return setError('Las contraseñas no coinciden.');
    setOcupado(true);
    try {
      await registrarse(correo.trim(), password);
      setCreada(true);
    } catch (err) {
      setError(err.status === 409 ? 'Ya existe una cuenta con ese correo.' : err.message);
    } finally {
      setOcupado(false);
    }
  }

  if (creada)
    return (
      <div className="pantalla sin-nav">
        <div className="vacio">
          <div className="icono">📬</div>
          <h2>¡Cuenta creada!</h2>
          <p>
            Te enviamos un enlace de verificación a <strong>{correo}</strong>. Verifica tu correo para poder
            iniciar sesión.
          </p>
        </div>
        <Aviso tipo="info">
          En esta versión los correos se escriben en la Terminal del backend, en una línea que empieza por{' '}
          <code>[NOTIFICACION] Verificación de correo</code>. Copia el valor de <code>token=</code>.
        </Aviso>
        <Link className="boton boton-principal ancho-completo" to="/verificar">
          Verificar mi correo
        </Link>
      </div>
    );

  return (
    <form className="pantalla sin-nav" onSubmit={enviar}>
      <EncabezadoVolver titulo="Crear cuenta" />
      <p className="suave" style={{ marginTop: -8, marginBottom: 22 }}>
        Descubre y guarda los eventos de tu ciudad.
      </p>

      <div className="campo">
        <label htmlFor="correo">Correo electrónico</label>
        <input id="correo" type="email" className="entrada" placeholder="tucorreo@ejemplo.com"
          value={correo} onChange={(e) => setCorreo(e.target.value)} required autoComplete="email" />
      </div>
      <div className="campo">
        <label htmlFor="password">Contraseña</label>
        <p className="ayuda">Mínimo 8 caracteres</p>
        <input id="password" type="password" className="entrada" value={password}
          onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
      </div>
      <div className="campo">
        <label htmlFor="confirmar">Confirmar contraseña</label>
        <input id="confirmar" type="password" className="entrada" value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)} required autoComplete="new-password" />
      </div>

      <label className="casilla">
        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
        Acepto los términos y condiciones
      </label>

      <Aviso tipo="error">{error}</Aviso>

      <button className="boton boton-principal ancho-completo" disabled={ocupado || !acepta}>
        {ocupado ? 'Creando…' : 'Crear cuenta'}
      </button>
      <p className="centrado suave" style={{ marginTop: 20 }}>
        ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>
      </p>
    </form>
  );
}
