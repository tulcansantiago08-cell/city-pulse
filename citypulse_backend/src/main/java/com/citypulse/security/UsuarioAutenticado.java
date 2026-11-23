package com.citypulse.security;

import com.citypulse.enums.RolUsuario;

/**
 * Identidad extraída de un JWT válido.
 *
 * @param id  id del usuario (claim {@code sub}).
 * @param rol rol del usuario en el momento de iniciar sesión.
 * @author Santiago Rivas
 */
public record UsuarioAutenticado(String id, RolUsuario rol) {
}
