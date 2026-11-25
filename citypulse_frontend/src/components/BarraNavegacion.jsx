/**
 * Barra de navegación inferior. Cambia según el rol del usuario conectado (wireframes):
 *  - Sin sesión / ASISTENTE: Inicio · Guardados · Perfil
 *  - ORGANIZADOR:            Inicio · Mi panel · (+) Crear evento · Perfil
 *  - ADMINISTRADOR:          Solicitudes · Categorías · Admins · Perfil
 *
 * @author Santiago Rivas
 */
import { NavLink } from 'react-router-dom';
import { useSesion } from '../context/SesionContext';

const MENUS = {
  INVITADO: [
    { a: '/', icono: '🏠', texto: 'Inicio' },
    { a: '/iniciar-sesion', icono: '🔖', texto: 'Guardados' },
    { a: '/iniciar-sesion', icono: '👤', texto: 'Ingresar' },
  ],
  ASISTENTE: [
    { a: '/', icono: '🏠', texto: 'Inicio' },
    { a: '/guardados', icono: '🔖', texto: 'Guardados' },
    { a: '/perfil', icono: '👤', texto: 'Perfil' },
  ],
  ORGANIZADOR: [
    { a: '/', icono: '🏠', texto: 'Inicio' },
    { a: '/mi-panel', icono: '📊', texto: 'Mi panel' },
    { a: '/eventos/nuevo', texto: '+', mas: true },
    { a: '/perfil', icono: '👤', texto: 'Perfil' },
  ],
  ADMINISTRADOR: [
    { a: '/admin/solicitudes', icono: '📥', texto: 'Solicitudes' },
    { a: '/admin/categorias', icono: '🗂️', texto: 'Categorías' },
    { a: '/admin/administradores', icono: '🛡️', texto: 'Admins' },
    { a: '/perfil', icono: '👤', texto: 'Perfil' },
  ],
};

export default function BarraNavegacion() {
  const { usuario } = useSesion();
  const opciones = MENUS[usuario?.rol || 'INVITADO'];

  return (
    <nav className="nav-inferior">
      {opciones.map((op) =>
        op.mas ? (
          <NavLink key={op.a} to={op.a} className="mas" aria-label="Crear evento">
            +
          </NavLink>
        ) : (
          <NavLink key={op.texto} to={op.a} end={op.a === '/'}>
            <span className="icono">{op.icono}</span>
            {op.texto}
          </NavLink>
        )
      )}
    </nav>
  );
}
