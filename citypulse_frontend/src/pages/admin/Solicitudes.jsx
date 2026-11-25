/**
 * Solicitudes de organizador (wireframes "Admin - Solicitudes Pendientes" y "Admin - Detalle de Solicitud").
 *
 *  - Lista:     GET  /admin/solicitudes-organizador → AdminController.listarPendientes
 *  - Nombre del solicitante: GET /usuarios/{solicitanteId} (el admin puede ver cualquier perfil)
 *  - Aprobar:   POST /admin/solicitudes-organizador/{id}/aprobar  → el asistente pasa a ORGANIZADOR
 *  - Rechazar:  POST /admin/solicitudes-organizador/{id}/rechazar { motivo } (motivo obligatorio)
 * En el backend: SolicitudOrganizadorServiceImpl.aprobar / rechazar, que además avisan por "correo".
 *
 * @author Santiago Rivas
 */
import { useCallback, useEffect, useState } from 'react';
import { aprobarSolicitud, listarSolicitudesPendientes, rechazarSolicitud } from '../../api/adminApi';
import { obtenerUsuario } from '../../api/usuariosApi';
import { Aviso, Cargando, Vacio } from '../../components/Comunes';
import { TIPOS_ORGANIZACION, fechaCorta, iniciales } from '../../utils/formato';

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState(null);
  const [solicitantes, setSolicitantes] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [rechazando, setRechazando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => {
    listarSolicitudesPendientes()
      .then(async (lista) => {
        setSolicitudes(lista);
        // Traer nombre y correo de cada solicitante
        const ids = [...new Set(lista.map((s) => s.solicitanteId))];
        const usuarios = await Promise.all(ids.map((id) => obtenerUsuario(id).catch(() => null)));
        const mapa = {};
        usuarios.forEach((u) => u && (mapa[u.id] = u));
        setSolicitantes(mapa);
      })
      .catch((e) => setMensaje({ tipo: 'error', texto: e.message }));
  }, []);

  useEffect(cargar, [cargar]);

  function nombreDe(s) {
    const u = solicitantes[s.solicitanteId];
    if (!u) return 'Solicitante';
    return [u.nombre, u.apellido].filter(Boolean).join(' ') || u.correo;
  }

  async function aprobar(s) {
    setOcupado(true);
    try {
      const res = await aprobarSolicitud(s.id);
      setMensaje({ tipo: 'exito', texto: `${res.mensaje}. ${nombreDe(s)} ahora es organizador.` });
      setAbierta(null);
      cargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setOcupado(false);
    }
  }

  async function rechazar(s) {
    if (!motivo.trim()) return setMensaje({ tipo: 'error', texto: 'Escribe el motivo del rechazo.' });
    setOcupado(true);
    try {
      const res = await rechazarSolicitud(s.id, motivo.trim());
      setMensaje({ tipo: 'exito', texto: res.mensaje });
      setAbierta(null);
      setRechazando(false);
      setMotivo('');
      cargar();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setOcupado(false);
    }
  }

  const texto = busqueda.trim().toLowerCase();
  const visibles = (solicitudes || []).filter(
    (s) => !texto || nombreDe(s).toLowerCase().includes(texto) || s.infoPropuesta?.nombreEntidad?.toLowerCase().includes(texto)
  );

  return (
    <div className="pantalla">
      <div className="encabezado">
        <h1>Solicitudes</h1>
      </div>

      <div className="buscador">
        <div className="caja">
          <span>🔍</span>
          <input placeholder="Buscar solicitante o entidad…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className="segmentado" style={{ marginBottom: 18 }}>
        <button className="activo">Pendientes · {solicitudes ? solicitudes.length : '–'}</button>
      </div>

      <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
      {!solicitudes && <Cargando />}
      {solicitudes && visibles.length === 0 && (
        <Vacio icono="📭" titulo="No hay solicitudes pendientes">
          Cuando un asistente pida ser organizador aparecerá aquí.
        </Vacio>
      )}

      {visibles.map((s) => {
        const info = s.infoPropuesta || {};
        const abiertaEsta = abierta === s.id;
        return (
          <div key={s.id} className="tarjeta solicitud">
            <div
              className="arriba"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setAbierta(abiertaEsta ? null : s.id);
                setRechazando(false);
                setMotivo('');
              }}
            >
              <div className="avatar" style={{ width: 54, height: 54 }}>{iniciales(nombreDe(s))}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{nombreDe(s)}</h3>
                <div className="suave">{info.nombreEntidad}</div>
              </div>
              <span className="suave" style={{ fontSize: 22 }}>{abiertaEsta ? '⌄' : '›'}</span>
            </div>
            <div className="abajo">
              <span className="etiqueta-borde">{TIPOS_ORGANIZACION[info.tipo] || info.tipo}</span>
              <span className="suave pequeno">📅 {s.fechaCreacion ? fechaCorta(s.fechaCreacion) : '—'}</span>
              <span className="estado estado-pendiente">Pendiente</span>
            </div>

            {abiertaEsta && (
              <>
                <dl className="lista-datos">
                  <div><dt>Correo</dt><dd>{solicitantes[s.solicitanteId]?.correo || '—'}</dd></div>
                  <div><dt>Entidad</dt><dd>{info.nombreEntidad}</dd></div>
                  <div><dt>Teléfono</dt><dd>{info.telefonoContacto}</dd></div>
                  <div><dt>Sitio web</dt><dd>{info.sitioWeb || '—'}</dd></div>
                  <div><dt>Dirección</dt><dd>{info.direccion || '—'}</dd></div>
                </dl>
                {rechazando ? (
                  <>
                    <div className="campo">
                      <label htmlFor={`motivo-${s.id}`}>Motivo del rechazo</label>
                      <textarea id={`motivo-${s.id}`} className="entrada" value={motivo}
                        onChange={(e) => setMotivo(e.target.value)} placeholder="Se le enviará al solicitante" />
                    </div>
                    <div className="fila">
                      <button className="boton boton-claro" onClick={() => setRechazando(false)} disabled={ocupado}>
                        Volver
                      </button>
                      <button className="boton boton-peligro" onClick={() => rechazar(s)} disabled={ocupado}>
                        Rechazar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="fila">
                    <button className="boton boton-peligro" onClick={() => setRechazando(true)} disabled={ocupado}>
                      ✕ Rechazar
                    </button>
                    <button className="boton boton-exito" onClick={() => aprobar(s)} disabled={ocupado}>
                      ✓ Aprobar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
