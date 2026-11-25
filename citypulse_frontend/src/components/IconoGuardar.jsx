/**
 * Icono de marcador (🔖) para "Guardar en favoritos": contorno si no está guardado, relleno morado si sí.
 *
 * @author Santiago Rivas
 */
export default function IconoGuardar({ lleno }) {
  return (
    <svg className="icono-guardar" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"
        fill={lleno ? '#7c3aed' : 'none'}
        stroke={lleno ? '#7c3aed' : '#1e1b2e'}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
