/**
 * Iniciar sesión (wireframe "Iniciar Sesion").
 *
 *  - Botón "Iniciar sesión" → SesionContext.iniciarSesion() → POST /auth/login
 *    (AuthController.login → AutenticacionService.iniciarSesion → JwtService.generar)
 *  - 401: correo o contraseña incorrectos.
 *  - 403: el correo no está verificado (HU001) → se muestra el aviso amarillo.
 *  - Según el rol del token se abre la pantalla de inicio de cada panel.
 *
 * @author Santiago Rivas
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../../context/SesionContext';
import { Aviso } from '../../components/Comunes';

/** Pantalla a la que va cada rol después de iniciar sesión */
export const INICIO_POR_ROL = {
  ASISTENTE: '/',
  ORGANIZADOR: '/mi-panel',
  ADMINISTRADOR: '/admin/solicitudes',
};

export default function IniciarSesion() {
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [sinVerificar, setSinVerificar] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setSinVerificar(false);
    setOcupado(true);
    try {
      const sesion = await iniciarSesion(correo.trim(), password);
      navegar(ubicacion.state?.volverA || INICIO_POR_ROL[sesion.rol] || '/', { replace: true });
    } catch (err) {
      if (err.status === 403) setSinVerificar(true);
      else setError(err.status === 401 ? 'Correo o contraseña incorrectos.' : err.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form className="pantalla sin-nav" onSubmit={enviar}>
      <div className="banner-login">
        <div className="marca">
          <span className="logo">〰️</span> City Pulse
        </div>
        <h1>
          Lo que pasa hoy
          <br />
          en tu ciudad 🎉
        </h1>
        <p style={{ opacity: 0.9, margin: '10px 0 0' }}>Conciertos, ferias, talleres y más en Pasto.</p>
      </div>

      <h1 style={{ fontSize: 26, marginBottom: 18 }}>Bienvenido de nuevo</h1>

      <button
        type="button"
        className="boton boton-claro ancho-completo"
        disabled
        title="El inicio de sesión con Google está pendiente en el backend"
      >
        <span style={{ fontWeight: 800, color: '#4285f4' }}>G</span> Continuar con Google (próximamente)
      </button>

      <div className="separador">O INGRESA CON TU CORREO</div>

      <div className="campo">
        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          type="email"
          className="entrada"
          placeholder="tucorreo@ejemplo.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="campo">
        <label htmlFor="password">Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            id="password"
            type={verPassword ? 'text' : 'password'}
            className="entrada"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setVerPassword(!verPassword)}
            style={{ position: 'absolute', right: 12, top: 12, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}
            aria-label="Mostrar contraseña"
          >
            {verPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div className="enlace-derecha">
        <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
      </div>

      <Aviso tipo="error">{error}</Aviso>
      {sinVerificar && (
        <Aviso tipo="alerta">
          <strong>Tu cuenta existe, pero falta verificar el correo.</strong> En esta versión el código aparece en la
          Terminal del backend, en la línea <code>[NOTIFICACION] Verificación de correo … token=…</code>.{' '}
          <Link to="/verificar">Pegar el código de verificación</Link>
        </Aviso>
      )}

      <button className="boton boton-principal ancho-completo" disabled={ocupado}>
        {ocupado ? 'Ingresando…' : 'Iniciar sesión'}
      </button>

      <p className="centrado suave" style={{ marginTop: 20 }}>
        ¿No tienes cuenta? <Link to="/crear-cuenta">Regístrate</Link>
      </p>
      <p className="centrado pequeno">
        <Link to="/">Seguir sin iniciar sesión</Link>
      </p>
    </form>
  );
}
