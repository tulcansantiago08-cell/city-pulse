package com.citypulse.service.impl;

import com.citypulse.dto.request.EditarPerfilRequest;
import com.citypulse.dto.request.SolicitudOrganizadorRequest;
import com.citypulse.dto.response.SolicitudOrganizadorResponse;
import com.citypulse.dto.response.UsuarioResponse;
import com.citypulse.enums.EstadoSolicitud;
import com.citypulse.exception.RecursoNoEncontradoException;
import com.citypulse.model.OrganizacionInfo;
import com.citypulse.model.SolicitudOrganizador;
import com.citypulse.model.Usuario;
import com.citypulse.repository.SolicitudOrganizadorRepository;
import com.citypulse.repository.UsuarioRepository;
import com.citypulse.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SolicitudOrganizadorRepository solicitudRepository;

    @Override
    public UsuarioResponse obtenerPorId(String id) {
        return mapToResponse(buscarOFallar(id));
    }

    @Override
    public UsuarioResponse editarPerfil(String id, EditarPerfilRequest req) {
        Usuario usuario = buscarOFallar(id);
        usuario.setNombre(req.getNombre());
        usuario.setApellido(req.getApellido());
        usuario.setFotoPerfilUrl(req.getFotoPerfilUrl());
        usuario.setFechaModificacion(LocalDateTime.now());
        return mapToResponse(usuarioRepository.save(usuario));
    }

    @Override
    public SolicitudOrganizadorResponse solicitarRolOrganizador(String asistenteId, SolicitudOrganizadorRequest req) {
        buscarOFallar(asistenteId);

        OrganizacionInfo info = OrganizacionInfo.builder()
                .nombreEntidad(req.getNombreEntidad())
                .tipo(req.getTipo())
                .telefonoContacto(req.getTelefonoContacto())
                .sitioWeb(req.getSitioWeb())
                .direccion(req.getDireccion())
                .build();

        SolicitudOrganizador solicitud = SolicitudOrganizador.builder()
                .solicitanteId(asistenteId)
                .infoPropuesta(info)
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaCreacion(LocalDateTime.now())
                .build();

        SolicitudOrganizador guardada = solicitudRepository.save(solicitud);
        log.info("Solicitud de organizador creada para asistente: {}", asistenteId);
        return mapSolicitudToResponse(guardada);
    }

    // ---------------------------------------------------------------
    // Helpers privados
    // ---------------------------------------------------------------

    private Usuario buscarOFallar(String id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario con id " + id + " no encontrado"));
    }

    private UsuarioResponse mapToResponse(Usuario u) {
        return UsuarioResponse.builder()
                .id(u.getId())
                .correo(u.getCorreo())
                .nombre(u.getNombre())
                .apellido(u.getApellido())
                .fotoPerfilUrl(u.getFotoPerfilUrl())
                .correoVerificado(u.isCorreoVerificado())
                .rol(u.getRol())
                .fechaCreacion(u.getFechaCreacion())
                .build();
    }

    private SolicitudOrganizadorResponse mapSolicitudToResponse(SolicitudOrganizador s) {
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
