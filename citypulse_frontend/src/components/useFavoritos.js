/**
 * Hook de favoritos (botón 🔖 de las tarjetas y del detalle).
 * Solo funciona para ASISTENTE, porque FavoritoController tiene @RequiereRol(ASISTENTE).
 *
 *  - Al cargar:  GET    /usuarios/{id}/favoritos            → FavoritoController.listar()
 *  - Guardar:    POST   /usuarios/{id}/favoritos/{eventoId} → FavoritoController.agregar()
 *  - Quitar:     DELETE /usuarios/{id}/favoritos/{eventoId} → FavoritoController.remover()
 *
 * @author Santiago Rivas
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSesion } from '../context/SesionContext';
import { agregarFavorito, listarFavoritos, quitarFavorito } from '../api/usuariosApi';

export default function useFavoritos() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [ids, setIds] = useState(new Set());
  const esAsistente = usuario?.rol === 'ASISTENTE';

  useEffect(() => {
    if (!esAsistente) return;
    listarFavoritos(usuario.id)
      .then((lista) => setIds(new Set(lista.map((e) => e.id))))
      .catch(() => {});
  }, [esAsistente, usuario]);

  const alternar = useCallback(
    async (eventoId) => {
      if (!usuario) {
        navegar('/iniciar-sesion');
        return;
      }
      const yaEsta = ids.has(eventoId);
      if (yaEsta) await quitarFavorito(usuario.id, eventoId);
      else await agregarFavorito(usuario.id, eventoId);
      setIds((previo) => {
        const nuevo = new Set(previo);
        if (yaEsta) nuevo.delete(eventoId);
        else nuevo.add(eventoId);
        return nuevo;
      });
    },
    [ids, usuario, navegar]
  );

  // Organizadores y administradores no tienen favoritos: no se muestra el botón
  const puedeGuardar = !usuario || esAsistente;
  return { ids, alternar, puedeGuardar };
}
