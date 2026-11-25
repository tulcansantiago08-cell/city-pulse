/**
 * Perfil (lo usan los tres roles).
 *  - Datos:      GET /usuarios/{id}         → UsuarioController.obtener (lo carga SesionContext)
 *  - Guardar:    PUT /usuarios/{id}/perfil  → UsuarioController.editar → UsuarioService.editarPerfil
 *  - "Quiero ser organizador" (solo ASISTENTE) → pantalla SerOrganizador.jsx
 *  - "Cerrar sesión" borra el token del navegador (SesionContext.cerrarSesion).
 *
 * @author Santiago Rivas
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { editarPerfil } from '../../api/usuariosApi';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Cargando } from '../../components/Comunes';
import { fechaCorta, iniciales } from '../../utils/formato';

const NOMBRE_ROL = { ASISTENTE: 'Asistente', ORGANIZADOR: 'Organizador', ADMINISTRADOR: 'Administrador' };

export default function Perfil() {
  const { usuario, perfil, setPerfil, cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre || '');
      setApellido(perfil.apellido || '');
    }
  }, [perfil]);

  async function guardar(e) {
    e.preventDefault();
    try {
      const actualizado = await editarPerfil(usuario.id, { nombre, apellido, fotoPerfilUrl: perfil?.fotoPerfilUrl });
      setPerfil(actualizado);
      setEditando(false);
      setMensaje({ tipo: 'exito', texto: 'Perfil actualizado.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  }

  function salir() {
    cerrarSesion();
    navegar('/iniciar-sesion');
  }

  if (!perfil) return <Cargando />;
  const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || perfil.correo;

  return (
    <div className="pantalla">
      <div className="encabezado">
        <h1>Perfil</h1>
      </div>

      <div className="tarjeta cabecera-perfil">
        <div className="avatar grande">{iniciales(nombreCompleto)}</div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ overflowWrap: 'anywhere' }}>{nombreCompleto}</h2>
          <div className="suave pequeno" style={{ overflowWrap: 'anywhere' }}>{perfil.correo}</div>
          <span className="insignia-rol">{NOMBRE_ROL[perfil.rol]}</span>
        </div>
      </div>

      <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>

      {editando ? (
        <form className="tarjeta" onSubmit={guardar} style={{ marginBottom: 16 }}>
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" className="entrada" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="campo">
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" className="entrada" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
          </div>
          <div className="fila">
            <button type="button" className="boton boton-claro" onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button className="boton boton-principal">Guardar</button>
          </div>
        </form>
      ) : (
        <button className="opcion-menu" onClick={() => setEditando(true)}>
          ✏️ Editar mis datos <span className="flecha">›</span>
        </button>
      )}

      {usuario.rol === 'ASISTENTE' && (
        <>
          <Link className="opcion-menu" to="/guardados">
            🔖 Mis eventos guardados <span className="flecha">›</span>
          </Link>
          <Link className="opcion-menu" to="/ser-organizador">
            📣 Quiero ser organizador <span className="flecha">›</span>
          </Link>
        </>
      )}
      {usuario.rol === 'ORGANIZADOR' && (
        <Link className="opcion-menu" to="/mi-panel">
          📊 Mi panel de eventos <span className="flecha">›</span>
        </Link>
      )}

      <button className="opcion-menu" onClick={salir} style={{ color: 'var(--rojo)' }}>
        🚪 Cerrar sesión
      </button>

      <p className="centrado suave pequeno" style={{ marginTop: 18 }}>
        Miembro desde {perfil.fechaCreacion ? fechaCorta(perfil.fechaCreacion) : '—'}
      </p>
    </div>
  );
}
