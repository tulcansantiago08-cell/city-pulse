/**
 * Mapa de pantallas de City Pulse: qué URL abre qué pantalla y qué rol necesita.
 * Los tres paneles del diagrama de componentes (Frontend):
 *   - Panel de Eventos         → pages/publico + pages/asistente
 *   - Panel del Organizador    → pages/organizador
 *   - Panel de Administración  → pages/admin
 *
 * @author Santiago Rivas
 */
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSesion } from './context/SesionContext';
import BarraNavegacion from './components/BarraNavegacion';
import RutaProtegida from './components/RutaProtegida';

import Inicio from './pages/publico/Inicio';
import Filtrar from './pages/publico/Filtrar';
import DetalleEvento from './pages/publico/DetalleEvento';

import IniciarSesion, { INICIO_POR_ROL } from './pages/auth/IniciarSesion';
import CrearCuenta from './pages/auth/CrearCuenta';
import VerificarCorreo from './pages/auth/VerificarCorreo';
import RecuperarContrasena from './pages/auth/RecuperarContrasena';

import Guardados from './pages/asistente/Guardados';
import Perfil from './pages/asistente/Perfil';
import SerOrganizador from './pages/asistente/SerOrganizador';

import MiPanel from './pages/organizador/MiPanel';
import FormularioEvento from './pages/organizador/FormularioEvento';

import Solicitudes from './pages/admin/Solicitudes';
import Categorias from './pages/admin/Categorias';
import Administradores from './pages/admin/Administradores';

/** Pantallas que ocupan todo el alto, sin la barra inferior */
const SIN_BARRA = ['/iniciar-sesion', '/crear-cuenta', '/verificar', '/recuperar-contrasena', '/filtrar'];

export default function App() {
  const { usuario } = useSesion();
  const { pathname } = useLocation();
  const esDetalle = /^\/eventos\/[^/]+$/.test(pathname) && pathname !== '/eventos/nuevo';
  const mostrarBarra = !esDetalle && !SIN_BARRA.some((ruta) => pathname.startsWith(ruta));

  return (
    <div className="app">
      <Routes>
        {/* Públicas: cualquiera puede ver la cartelera */}
        <Route
          path="/"
          element={usuario?.rol === 'ADMINISTRADOR' ? <Navigate to="/admin/solicitudes" replace /> : <Inicio />}
        />
        <Route path="/filtrar" element={<Filtrar />} />
        <Route path="/eventos/:id" element={<DetalleEvento />} />

        {/* Autenticación */}
        <Route
          path="/iniciar-sesion"
          element={usuario ? <Navigate to={INICIO_POR_ROL[usuario.rol]} replace /> : <IniciarSesion />}
        />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/verificar" element={<VerificarCorreo />} />
        <Route path="/verificar/:token" element={<VerificarCorreo />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

        {/* Cualquier usuario con sesión */}
        <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />

        {/* Asistente */}
        <Route path="/guardados" element={<RutaProtegida roles={['ASISTENTE']}><Guardados /></RutaProtegida>} />
        <Route path="/ser-organizador" element={<RutaProtegida roles={['ASISTENTE']}><SerOrganizador /></RutaProtegida>} />

        {/* Organizador */}
        <Route path="/mi-panel" element={<RutaProtegida roles={['ORGANIZADOR']}><MiPanel /></RutaProtegida>} />
        <Route path="/eventos/nuevo" element={<RutaProtegida roles={['ORGANIZADOR']}><FormularioEvento /></RutaProtegida>} />
        <Route path="/eventos/:id/editar" element={<RutaProtegida roles={['ORGANIZADOR']}><FormularioEvento /></RutaProtegida>} />

        {/* Administrador */}
        <Route path="/admin/solicitudes" element={<RutaProtegida roles={['ADMINISTRADOR']}><Solicitudes /></RutaProtegida>} />
        <Route path="/admin/categorias" element={<RutaProtegida roles={['ADMINISTRADOR']}><Categorias /></RutaProtegida>} />
        <Route path="/admin/administradores" element={<RutaProtegida roles={['ADMINISTRADOR']}><Administradores /></RutaProtegida>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {mostrarBarra && <BarraNavegacion />}
    </div>
  );
}
