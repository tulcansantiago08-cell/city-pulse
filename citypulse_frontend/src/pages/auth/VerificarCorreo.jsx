/**
 * Verificar correo.
 * Se abre desde el enlace del correo (/verificar/<token>) o pegando el token a mano (/verificar).
 *  - GET /auth/verificar/{token} → AuthController.verificar → AutenticacionService.verificarCorreo
 *
 * @author Santiago Rivas
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { verificarCorreo } from '../../api/authApi';
import { Aviso, EncabezadoVolver } from '../../components/Comunes';

export default function VerificarCorreo() {
  const { token: tokenUrl } = useParams();
  const [token, setToken] = useState(tokenUrl || '');
  const [estado, setEstado] = useState({ tipo: '', texto: '' });
  const [ocupado, setOcupado] = useState(false);

  async function verificar(valor) {
    setOcupado(true);
    setEstado({ tipo: '', texto: '' });
    try {
      const res = await verificarCorreo(valor.trim());
      setEstado({ tipo: 'exito', texto: res.mensaje });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(false);
    }
  }

  // Si el token viene en la URL, se verifica solo
  useEffect(() => {
    if (tokenUrl) verificar(tokenUrl);
  }, [tokenUrl]);

  return (
    <form
      className="pantalla sin-nav"
      onSubmit={(e) => {
        e.preventDefault();
        verificar(token);
      }}
    >
      <EncabezadoVolver titulo="Verificar correo" />
      <Aviso tipo="info">
        Pega el código de verificación que recibiste. En esta versión aparece en la Terminal del backend
        (<code>[NOTIFICACION] Verificación de correo … token=…</code>).
      </Aviso>
      <div className="campo">
        <label htmlFor="token">Código de verificación</label>
        <input id="token" className="entrada" value={token} onChange={(e) => setToken(e.target.value)} required />
      </div>
      <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>
      {estado.tipo === 'exito' ? (
        <Link className="boton boton-principal ancho-completo" to="/iniciar-sesion">
          Iniciar sesión
        </Link>
      ) : (
        <button className="boton boton-principal ancho-completo" disabled={ocupado}>
          {ocupado ? 'Verificando…' : 'Verificar'}
        </button>
      )}
    </form>
  );
}
