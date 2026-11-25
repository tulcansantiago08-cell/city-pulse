/**
 * Crear administradores (wireframe "Admin - Administradores", RF-022 / HU0012).
 *  - Botón "Crear administrador" → POST /admin/administradores
 *    (AdminController.crearAdministrador → AutenticacionService.crearAdministrador).
 *    La cuenta nace con el correo verificado y la contraseña cifrada con BCrypt.
 *  - 409 si el correo ya existe; 400 si la contraseña tiene menos de 8 caracteres.
 *
 * @author Santiago Rivas
 */
import { useState } from 'react';
import { crearAdministrador } from '../../api/adminApi';
import { Aviso } from '../../components/Comunes';

const VACIO = { nombre: '', apellido: '', correo: '', password: '' };

export default function Administradores() {
  const [datos, setDatos] = useState(VACIO);
  const [creados, setCreados] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [ocupado, setOcupado] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setOcupado(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const admin = await crearAdministrador({ ...datos, correo: datos.correo.trim() });
      setCreados([admin, ...creados]);
      setMensaje({ tipo: 'exito', texto: `Administrador ${admin.correo} creado. Ya puede iniciar sesión.` });
      setDatos(VACIO);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.status === 409 ? 'Ya existe una cuenta con ese correo.' : err.message });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="pantalla">
      <div className="encabezado">
        <h1>Administradores</h1>
      </div>
      <p className="suave" style={{ marginTop: -8 }}>
        Crea cuentas de administrador para que otras personas te ayuden a revisar solicitudes y categorías.
      </p>

      <form className="tarjeta" onSubmit={enviar} style={{ marginBottom: 18 }}>
        <div className="fila">
          <div className="campo">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" className="entrada" value={datos.nombre} onChange={cambiar('nombre')} required />
          </div>
          <div className="campo">
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" className="entrada" value={datos.apellido} onChange={cambiar('apellido')} required />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="correo">Correo</label>
          <input id="correo" type="email" className="entrada" value={datos.correo} onChange={cambiar('correo')} required />
        </div>
        <div className="campo">
          <label htmlFor="password">Contraseña temporal</label>
          <p className="ayuda">Mínimo 8 caracteres</p>
          <input id="password" type="password" className="entrada" minLength={8} value={datos.password}
            onChange={cambiar('password')} required autoComplete="new-password" />
        </div>
        <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
        <button className="boton boton-principal ancho-completo" disabled={ocupado}>
          {ocupado ? 'Creando…' : '🛡️ Crear administrador'}
        </button>
      </form>

      {creados.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Creados en esta sesión</h2>
          {creados.map((a) => (
            <div key={a.id} className="tarjeta fila-categoria">
              <div className="avatar">{(a.nombre?.[0] || '?') + (a.apellido?.[0] || '')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{a.nombre} {a.apellido}</strong>
                <div className="suave pequeno" style={{ overflowWrap: 'anywhere' }}>{a.correo}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
