/**
 * Sesión del usuario en el frontend.
 *
 * Al iniciar sesión, el backend devuelve un JWT (JwtService.generar()). El token tiene tres partes
 * separadas por puntos; la del medio (payload) trae:
 *   sub    → id del usuario en MongoDB
 *   rol    → ASISTENTE | ORGANIZADOR | ADMINISTRADOR
 *   correo → correo del usuario
 *   exp    → cuándo vence (24 h)
 * Aquí se lee ese payload para saber quién está conectado y qué menú mostrar.
 * La seguridad real la hace el backend: el frontend solo decide qué pantallas enseña.
 *
 * @author Santiago Rivas
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { borrarToken, guardarToken, leerToken } from '../api/cliente';
import { iniciarSesion as loginApi } from '../api/authApi';
import { obtenerUsuario } from '../api/usuariosApi';

const SesionContext = createContext(null);

/** Decodifica la parte del medio del JWT (Base64URL → JSON). */
function leerPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function sesionDesdeToken(token) {
  const datos = token ? leerPayload(token) : null;
  if (!datos || datos.exp * 1000 < Date.now()) return null;
  return { id: datos.sub, rol: datos.rol, correo: datos.correo };
}

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(() => sesionDesdeToken(leerToken()));
  const [perfil, setPerfil] = useState(null);

  // Si el token se borra porque venció (cliente.js recibe un 401), cerramos la sesión
  useEffect(() => {
    const alExpirar = () => {
      setUsuario(null);
      setPerfil(null);
    };
    window.addEventListener('citypulse:sesion-expirada', alExpirar);
    return () => window.removeEventListener('citypulse:sesion-expirada', alExpirar);
  }, []);

  // Carga nombre y apellido del usuario conectado (GET /usuarios/{id})
  useEffect(() => {
    if (!usuario) return;
    obtenerUsuario(usuario.id).then(setPerfil).catch(() => setPerfil(null));
  }, [usuario]);

  async function iniciarSesion(correo, password) {
    const { token } = await loginApi(correo, password);
    guardarToken(token);
    const nueva = sesionDesdeToken(token);
    setUsuario(nueva);
    return nueva;
  }

  function cerrarSesion() {
    borrarToken();
    setUsuario(null);
    setPerfil(null);
  }

  return (
    <SesionContext.Provider value={{ usuario, perfil, setPerfil, iniciarSesion, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export const useSesion = () => useContext(SesionContext);
