package com.citypulse.controller;

import com.citypulse.dto.request.RechazoSolicitudRequest;
import com.citypulse.dto.response.SolicitudOrganizadorResponse;
import com.citypulse.service.SolicitudOrganizadorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints de administración — gestión de solicitudes de rol Organizador.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SolicitudOrganizadorService solicitudService;

    /**
     * Lista todas las solicitudes de rol Organizador en estado PENDIENTE.
     *
     * @return 200 con la lista de solicitudes pendientes.
     */
    @GetMapping("/solicitudes-organizador")
    public ResponseEntity<List<SolicitudOrganizadorResponse>> listarPendientes() {
        return ResponseEntity.ok(solicitudService.listarPendientes());
    }

    /**
     * Aprueba una solicitud y convierte al asistente en Organizador.
     *
     * @param id      identificador de la solicitud.
     * @param adminId ID del administrador que aprueba (header).
     * @return 200 con mensaje de confirmación.
     */
    @PostMapping("/solicitudes-organizador/{id}/aprobar")
    public ResponseEntity<Map<String, String>> aprobar(
            @PathVariable String id,
            @RequestHeader("X-Admin-Id") String adminId) {
        solicitudService.aprobar(adminId, id);
        return ResponseEntity.ok(Map.of("mensaje", "Solicitud aprobada correctamente"));
    }

    /**
     * Rechaza una solicitud e informa al solicitante por correo.
     *
     * @param id      identificador de la solicitud.
     * @param adminId ID del administrador que rechaza (header).
     * @param req     motivo del rechazo.
     * @return 200 con mensaje de confirmación.
     */
    @PostMapping("/solicitudes-organizador/{id}/rechazar")
    public ResponseEntity<Map<String, String>> rechazar(
            @PathVariable String id,
            @RequestHeader("X-Admin-Id") String adminId,
            @Valid @RequestBody RechazoSolicitudRequest req) {
        solicitudService.rechazar(adminId, id, req);
        return ResponseEntity.ok(Map.of("mensaje", "Solicitud rechazada correctamente"));
    }
}
