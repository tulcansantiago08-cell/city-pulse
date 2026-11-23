package com.citypulse.controller;

import com.citypulse.dto.request.EditarPerfilRequest;
import com.citypulse.dto.request.SolicitudOrganizadorRequest;
import com.citypulse.dto.response.SolicitudOrganizadorResponse;
import com.citypulse.dto.response.UsuarioResponse;
import com.citypulse.service.UsuarioService;
import com.citypulse.enums.RolUsuario;
import com.citypulse.security.AutorizacionInterceptor;
import com.citypulse.security.RequiereRol;
import com.citypulse.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Gestión de perfil de usuario y solicitudes de rol Organizador.
 */
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Obtiene el perfil de un usuario por su ID.
     *
     * @param id identificador del usuario.
     * @return 200 con los datos del usuario.
     */
    @RequiereRol
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtener(@PathVariable String id, @RequestAttribute(AutorizacionInterceptor.ATRIBUTO) UsuarioAutenticado auth) {
        AutorizacionInterceptor.exigirMismoUsuario(auth, id, true);
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    /**
     * Edita nombre, apellido y foto de perfil de un usuario.
     *
     * @param id  identificador del usuario.
     * @param req nuevos datos del perfil.
     * @return 200 con el perfil actualizado.
     */
    @RequiereRol
    @PutMapping("/{id}/perfil")
    public ResponseEntity<UsuarioResponse> editar(
            @PathVariable String id,
            @RequestAttribute(AutorizacionInterceptor.ATRIBUTO) UsuarioAutenticado auth,
            @Valid @RequestBody EditarPerfilRequest req) {
        AutorizacionInterceptor.exigirMismoUsuario(auth, id, false);
        return ResponseEntity.ok(usuarioService.editarPerfil(id, req));
    }

    /**
     * Crea una solicitud para convertirse en Organizador.
     *
     * @param id  identificador del asistente solicitante.
     * @param req datos de la organización propuesta.
     * @return 201 con la solicitud creada.
     */
    @RequiereRol(RolUsuario.ASISTENTE)
    @PostMapping("/{id}/solicitar-rol-organizador")
    public ResponseEntity<SolicitudOrganizadorResponse> solicitarRol(
            @PathVariable String id,
            @RequestAttribute(AutorizacionInterceptor.ATRIBUTO) UsuarioAutenticado auth,
            @Valid @RequestBody SolicitudOrganizadorRequest req) {
        AutorizacionInterceptor.exigirMismoUsuario(auth, id, false);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioService.solicitarRolOrganizador(id, req));
    }
}
