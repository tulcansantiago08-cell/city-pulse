/**
 * Protege una pantalla según el rol, igual que @RequiereRol en el backend.
 *  - Sin sesión → lleva a "Iniciar sesión".
 *  - Con un rol que no está permitido → muestra "No tienes permiso" (equivale al 403).
 * Aunque alguien se salte esta pantalla, el backend vuelve a validar el token y el rol.
 *
 * @author Santiago Rivas
 */
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useSesion } from '../context/SesionContext';

export default function RutaProtegida({ roles, children }) {
  const { usuario } = useSesion();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ volverA: ubicacion.pathname }} />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="pantalla">
        <div className="vacio">
          <div className="icono">🔒</div>
          <h2>No tienes permiso</h2>
          <p>Esta sección es solo para {roles.join(' o ').toLowerCase()}.</p>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    );
  }
  return children;
}
