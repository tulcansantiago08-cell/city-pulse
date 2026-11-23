package com.citypulse.service.impl;

import com.citypulse.dto.request.RechazoSolicitudRequest;
import com.citypulse.dto.response.SolicitudOrganizadorResponse;
import com.citypulse.enums.EstadoSolicitud;
import com.citypulse.enums.RolUsuario;
import com.citypulse.exception.OperacionNoPermitidaException;
import com.citypulse.exception.RecursoNoEncontradoException;
import com.citypulse.model.Organizador;
import com.citypulse.model.SolicitudOrganizador;
import com.citypulse.model.Usuario;
import com.citypulse.repository.SolicitudOrganizadorRepository;
import com.citypulse.repository.UsuarioRepository;
import com.citypulse.service.NotificacionService;
import com.citypulse.service.SolicitudOrganizadorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SolicitudOrganizadorServiceImpl implements SolicitudOrganizadorService {

    private final SolicitudOrganizadorRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    @Override
    public List<SolicitudOrganizadorResponse> listarPendientes() {
        return solicitudRepository.findByEstado(EstadoSolicitud.PENDIENTE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void aprobar(String adminId, String solicitudId) {
        SolicitudOrganizador solicitud = buscarOFallar(solicitudId);
        validarPendiente(solicitud);

        // Recuperar usuario y promoverlo a Organizador
        Usuario usuario = usuarioRepository.findById(solicitud.getSolicitanteId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario solicitante no encontrado: " + solicitud.getSolicitanteId()));

        Organizador organizador = new Organizador();
        organizador.setId(usuario.getId());
        organizador.setCorreo(usuario.getCorreo());
        organizador.setPasswordHash(usuario.getPasswordHash());
        organizador.setNombre(usuario.getNombre());
        organizador.setApellido(usuario.getApellido());
        organizador.setFotoPerfilUrl(usuario.getFotoPerfilUrl());
        organizador.setCorreoVerificado(usuario.isCorreoVerificado());
        organizador.setFechaCreacion(usuario.getFechaCreacion());
        organizador.setFechaModificacion(LocalDateTime.now());
        organizador.setRol(RolUsuario.ORGANIZADOR);
        organizador.setInfoOrganizacion(solicitud.getInfoPropuesta());
        usuarioRepository.save(organizador);

        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setRevisorId(adminId);
        solicitud.setFechaResolucion(LocalDateTime.now());
        solicitudRepository.save(solicitud);

        notificacionService.notificarResultadoSolicitud(usuario.getCorreo(), true, null);
        log.info("Solicitud {} aprobada por admin {}", solicitudId, adminId);
    }

    @Override
    public void rechazar(String adminId, String solicitudId, RechazoSolicitudRequest req) {
        SolicitudOrganizador solicitud = buscarOFallar(solicitudId);
        validarPendiente(solicitud);

        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setMotivoRechazo(req.getMotivo());
        solicitud.setRevisorId(adminId);
        solicitud.setFechaResolucion(LocalDateTime.now());
        solicitudRepository.save(solicitud);

        usuarioRepository.findById(solicitud.getSolicitanteId()).ifPresent(u ->
                notificacionService.notificarResultadoSolicitud(u.getCorreo(), false, req.getMotivo())
        );
        log.info("Solicitud {} rechazada por admin {}", solicitudId, adminId);
    }

    private SolicitudOrganizador buscarOFallar(String id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud con id " + id + " no encontrada"));
    }

    private void validarPendiente(SolicitudOrganizador s) {
        if (s.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new OperacionNoPermitidaException("La solicitud ya fue procesada con estado: " + s.getEstado());
        }
    }

    private SolicitudOrganizadorResponse mapToResponse(SolicitudOrganizador s) {
        return SolicitudOrganizadorResponse.builder()
                .id(s.getId())
                .solicitanteId(s.getSolicitanteId())
                .infoPropuesta(s.getInfoPropuesta())
                .estado(s.getEstado())
                .motivoRechazo(s.getMotivoRechazo())
                .revisorId(s.getRevisorId())
                .fechaCreacion(s.getFechaCreacion())
                .fechaResolucion(s.getFechaResolucion())
                .build();
    }
}
