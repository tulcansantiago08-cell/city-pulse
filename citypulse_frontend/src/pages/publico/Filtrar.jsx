/**
 * Filtrar eventos (wireframe "Filtrar Eventos").
 * No llama al backend directamente: arma los filtros y vuelve al inicio con ellos en la URL
 * (/?categoriaId=…&modalidad=…&fechaDesde=…&fechaHasta=…). Inicio.jsx los envía a
 * GET /eventos, que en el backend usa EventoService.filtrar(FiltroEventoRequest).
 *
 * @author Santiago Rivas
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listarCategorias } from '../../api/categoriasApi';
import { EncabezadoVolver } from '../../components/Comunes';
import { emojiCategoria } from '../../utils/formato';

export default function Filtrar() {
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState(params.get('categoriaId') || '');
  const [modalidad, setModalidad] = useState(params.get('modalidad') || '');
  const [desde, setDesde] = useState((params.get('fechaDesde') || '').slice(0, 10));
  const [hasta, setHasta] = useState((params.get('fechaHasta') || '').slice(0, 10));

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  function aplicar(e) {
    e.preventDefault();
    const nuevos = new URLSearchParams();
    if (categoriaId) nuevos.set('categoriaId', categoriaId);
    if (modalidad) nuevos.set('modalidad', modalidad);
    if (desde) nuevos.set('fechaDesde', `${desde}T00:00:00`);
    if (hasta) nuevos.set('fechaHasta', `${hasta}T23:59:59`);
    navegar(`/?${nuevos.toString()}`);
  }

  function limpiar() {
    setCategoriaId('');
    setModalidad('');
    setDesde('');
    setHasta('');
  }

  return (
    <form className="pantalla" onSubmit={aplicar}>
      <EncabezadoVolver
        titulo="Filtrar"
        derecha={
          <button type="button" className="boton boton-claro boton-pequeno" onClick={limpiar}>
            Limpiar
          </button>
        }
      />

      <span className="etiqueta">Categoría</span>
      <div className="chips envolver">
        <button type="button" className={`chip ${!categoriaId ? 'activo' : ''}`} onClick={() => setCategoriaId('')}>
          Todas
        </button>
        {categorias.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`chip ${categoriaId === c.id ? 'activo' : ''}`}
            onClick={() => setCategoriaId(c.id)}
          >
            {emojiCategoria(c.nombre)} {c.nombre}
          </button>
        ))}
      </div>

      <span className="etiqueta">Modalidad</span>
      <div className="segmentado" style={{ marginBottom: 18 }}>
        {[
          ['', 'Todas'],
          ['PRESENCIAL', '📍 Presencial'],
          ['VIRTUAL', '💻 Virtual'],
        ].map(([valor, texto]) => (
          <button
            type="button"
            key={texto}
            className={modalidad === valor ? 'activo' : ''}
            onClick={() => setModalidad(valor)}
          >
            {texto}
          </button>
        ))}
      </div>

      <span className="etiqueta">Rango de fechas</span>
      <div className="fila">
        <div className="campo">
          <label className="suave pequeno">Desde</label>
          <input type="date" className="entrada" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label className="suave pequeno">Hasta</label>
          <input type="date" className="entrada" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <button className="boton boton-principal ancho-completo" type="submit">
        Ver resultados
      </button>
    </form>
  );
}
