package com.citypulse.service;

import com.citypulse.dto.request.EditarPerfilRequest;
import com.citypulse.dto.request.SolicitudOrganizadorRequest;
import com.citypulse.dto.response.SolicitudOrganizadorResponse;
import com.citypulse.dto.response.UsuarioResponse;

public interface UsuarioService {

    UsuarioResponse obtenerPorId(String id);

    UsuarioResponse editarPerfil(String id, EditarPerfilRequest req);

    /** Crea una solicitud de cambio de rol a Organizador. */
    SolicitudOrganizadorResponse solicitarRolOrganizador(String asistenteId, SolicitudOrganizadorRequest req);
}
