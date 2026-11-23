package com.citypulse.service;

import com.citypulse.dto.request.RechazoSolicitudRequest;
import com.citypulse.dto.response.SolicitudOrganizadorResponse;

import java.util.List;

public interface SolicitudOrganizadorService {

    List<SolicitudOrganizadorResponse> listarPendientes();

    /** Convierte al Asistente en Organizador y marca la solicitud como aprobada. */
    void aprobar(String adminId, String solicitudId);

    /** Rechaza la solicitud y notifica al solicitante por correo. */
    void rechazar(String adminId, String solicitudId, RechazoSolicitudRequest req);
}
