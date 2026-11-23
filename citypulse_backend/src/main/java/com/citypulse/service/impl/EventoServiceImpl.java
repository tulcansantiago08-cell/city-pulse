package com.citypulse.service.impl;

import com.citypulse.dto.request.CrearEventoRequest;
import com.citypulse.dto.request.EditarEventoRequest;
import com.citypulse.dto.request.FiltroEventoRequest;
import com.citypulse.dto.response.EventoCardResponse;
import com.citypulse.dto.response.EventoResponse;
import com.citypulse.enums.EstadoEvento;
import com.citypulse.exception.OperacionNoPermitidaException;
import com.citypulse.exception.RecursoNoEncontradoException;
import com.citypulse.exception.ValidacionNegocioException;
import com.citypulse.model.*;
import com.citypulse.repository.EventoRepository;
import com.citypulse.repository.UsuarioRepository;
import com.citypulse.service.EventoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventoServiceImpl implements EventoService {

    private final EventoRepository eventoRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public EventoResponse crear(String organizadorId, CrearEventoRequest req) {
        validarFechas(req.getFechaInicio(), req.getFechaFin());

        Evento evento = Evento.builder()
                .organizadorId(organizadorId)
                .titulo(req.getTitulo())
                .descripcion(req.getDescripcion())
                .categoriaId(req.getCategoriaId())
                .fechaInicio(req.getFechaInicio())
                .fechaFin(req.getFechaFin())
                .modalidad(req.getModalidad())
                .flyerUrl(req.getFlyerUrl())
                .precio(req.getPrecio())
                .canalInscripcion(mapCanal(req.getCanalInscripcion()))
                .fechaCreacion(LocalDateTime.now())
                .fechaModificacion(LocalDateTime.now())
                .build();

        Evento guardado = eventoRepository.save(evento);
        log.info("Evento creado: {} por organizador: {}", guardado.getId(), organizadorId);
        return mapToResponse(guardado, resolverNombreOrganizador(organizadorId));
    }

    @Override
    public EventoResponse editar(String organizadorId, String eventoId, EditarEventoRequest req) {
        Evento evento = buscarOFallar(eventoId);
        validarPropietario(evento, organizadorId);
        validarFechas(req.getFechaInicio(), req.getFechaFin());

        EstadoEvento estado = calcularEstado(evento);
        if (estado == EstadoEvento.FINALIZADO || estado == EstadoEvento.CANCELADO) {
            throw new OperacionNoPermitidaException("No se puede editar un evento finalizado o cancelado");
        }

        evento.setTitulo(req.getTitulo());
        evento.setDescripcion(req.getDescripcion());
        evento.setCategoriaId(req.getCategoriaId());
        evento.setFechaInicio(req.getFechaInicio());
        evento.setFechaFin(req.getFechaFin());
        evento.setModalidad(req.getModalidad());
        evento.setFlyerUrl(req.getFlyerUrl());
        evento.setPrecio(req.getPrecio());
        if (req.getCanalInscripcion() != null) {
            evento.setCanalInscripcion(mapCanal(req.getCanalInscripcion()));
        }
        evento.setFechaModificacion(LocalDateTime.now());

        return mapToResponse(eventoRepository.save(evento), resolverNombreOrganizador(organizadorId));
    }

    @Override
    public void eliminar(String organizadorId, String eventoId) {
        Evento evento = buscarOFallar(eventoId);
        validarPropietario(evento, organizadorId);
        evento.setEliminado(true);
        evento.setFechaModificacion(LocalDateTime.now());
        eventoRepository.save(evento);
        log.info("Evento eliminado (lógico): {}", eventoId);
    }

    @Override
    public void cambiarVisibilidad(String organizadorId, String eventoId, boolean oculto) {
        Evento evento = buscarOFallar(eventoId);
        validarPropietario(evento, organizadorId);
        evento.setPublicado(!oculto);
        evento.setFechaModificacion(LocalDateTime.now());
        eventoRepository.save(evento);
    }

    @Override
    public void cancelar(String organizadorId, String eventoId) {
        Evento evento = buscarOFallar(eventoId);
        validarPropietario(evento, organizadorId);
        if (calcularEstado(evento) == EstadoEvento.FINALIZADO) {
            throw new OperacionNoPermitidaException("No se puede cancelar un evento que ya finalizó");
        }
        evento.setCancelado(true);
        evento.setFechaModificacion(LocalDateTime.now());
        eventoRepository.save(evento);
        log.info("Evento cancelado: {}", eventoId);
    }

    @Override
    public void registrarClic(String eventoId) {
        Evento evento = buscarOFallar(eventoId);
        evento.setContadorClics(evento.getContadorClics() + 1);
        eventoRepository.save(evento);
    }

    @Override
    public EventoResponse obtenerDetalle(String eventoId) {
        Evento evento = buscarOFallar(eventoId);
        evento.setContadorClics(evento.getContadorClics() + 1);
        eventoRepository.save(evento);
        return mapToResponse(evento, resolverNombreOrganizador(evento.getOrganizadorId()));
    }

    @Override
    public List<EventoCardResponse> listarPublicosOrdenadosPorFecha() {
        return eventoRepository.findByEliminadoFalseAndPublicadoTrueAndCanceladoFalseOrderByFechaInicioAsc()
                .stream()
                .map(e -> mapToCard(e, resolverNombreOrganizador(e.getOrganizadorId())))
                .collect(Collectors.toList());
    }

    @Override
    public List<EventoCardResponse> filtrar(FiltroEventoRequest filtro) {
        return eventoRepository.filtrar(
                        filtro.getCategoriaId(),
                        filtro.getModalidad(),
                        filtro.getFechaDesde(),
                        filtro.getFechaHasta())
                .stream()
                .map(e -> mapToCard(e, resolverNombreOrganizador(e.getOrganizadorId())))
                .collect(Collectors.toList());
    }

    @Override
    public List<EventoResponse> listarPorOrganizador(String organizadorId) {
        String nombreOrg = resolverNombreOrganizador(organizadorId);
        return eventoRepository.findByOrganizadorIdAndEliminadoFalse(organizadorId)
                .stream()
                .map(e -> mapToResponse(e, nombreOrg))
                .collect(Collectors.toList());
    }

    @Override
    public Map<LocalDate, List<EventoResponse>> obtenerCalendarioMensual(String organizadorId, int mes, int anio) {
        String nombreOrg = resolverNombreOrganizador(organizadorId);
        return eventoRepository.findByOrganizadorIdAndEliminadoFalse(organizadorId).stream()
                .filter(e -> e.getFechaInicio().getMonthValue() == mes
                        && e.getFechaInicio().getYear() == anio)
                .collect(Collectors.groupingBy(
                        e -> e.getFechaInicio().toLocalDate(),
                        Collectors.mapping(e -> mapToResponse(e, nombreOrg), Collectors.toList())
                ));
    }

    // ---------------------------------------------------------------
    // Cálculo dinámico del EstadoEvento — no se persiste
    // ---------------------------------------------------------------

    EstadoEvento calcularEstado(Evento e) {
        if (e.isEliminado()) return EstadoEvento.OCULTO;
        if (e.isCancelado()) return EstadoEvento.CANCELADO;
        if (!e.isPublicado()) return EstadoEvento.OCULTO;

        LocalDateTime ahora = LocalDateTime.now();
        if (ahora.isBefore(e.getFechaInicio())) return EstadoEvento.PROXIMO;
        if (ahora.isAfter(e.getFechaFin())) return EstadoEvento.FINALIZADO;
        return EstadoEvento.EN_CURSO;
    }

    // ---------------------------------------------------------------
    // Mappers privados
    // ---------------------------------------------------------------

    private EventoResponse mapToResponse(Evento e, String nombreOrg) {
        return EventoResponse.builder()
                .id(e.getId())
                .titulo(e.getTitulo())
                .descripcion(e.getDescripcion())
                .categoriaId(e.getCategoriaId())
                .organizadorId(e.getOrganizadorId())
                .nombreOrganizador(nombreOrg)
                .fechaInicio(e.getFechaInicio())
                .fechaFin(e.getFechaFin())
                .modalidad(e.getModalidad())
                .flyerUrl(e.getFlyerUrl())
                .precio(e.getPrecio())
                .publicado(e.isPublicado())
                .cancelado(e.isCancelado())
                .contadorClics(e.getContadorClics())
                .canalInscripcion(e.getCanalInscripcion())
                .estado(calcularEstado(e))
                .fechaCreacion(e.getFechaCreacion())
                .build();
    }

    private EventoCardResponse mapToCard(Evento e, String nombreOrg) {
        String precioStr = (e.getPrecio() == null || e.getPrecio() == 0.0) ? "Gratuito"
                : String.format("$%.2f", e.getPrecio());
        return EventoCardResponse.builder()
                .id(e.getId())
                .titulo(e.getTitulo())
                .flyerUrl(e.getFlyerUrl())
                .fechaInicio(e.getFechaInicio())
                .precioFormateado(precioStr)
                .nombreOrganizador(nombreOrg)
                .estado(calcularEstado(e))
                .build();
    }

    private CanalInscripcion mapCanal(CrearEventoRequest.CanalInscripcionRequest req) {
        return switch (req.getTipo()) {
            case URL -> new CanalURL(req.getDestino());
            case WHATSAPP -> {
                CrearEventoRequest.CanalWhatsAppRequest wa = (CrearEventoRequest.CanalWhatsAppRequest) req;
                yield new CanalWhatsApp(req.getDestino(), wa.getMensajePredefinido());
            }
            case FORMULARIO -> {
                CrearEventoRequest.CanalFormularioRequest f = (CrearEventoRequest.CanalFormularioRequest) req;
                yield new CanalFormulario(req.getDestino(), f.getProveedor());
            }
        };
    }

    private String resolverNombreOrganizador(String organizadorId) {
        return usuarioRepository.findById(organizadorId)
                .map(u -> (u.getNombre() != null ? u.getNombre() : "") +
                          (u.getApellido() != null ? " " + u.getApellido() : ""))
                .orElse("Organizador desconocido")
                .trim();
    }

    private Evento buscarOFallar(String eventoId) {
        return eventoRepository.findById(eventoId)
                .filter(e -> !e.isEliminado())
                .orElseThrow(() -> new RecursoNoEncontradoException("Evento con id " + eventoId + " no encontrado"));
    }

    private void validarPropietario(Evento evento, String organizadorId) {
        if (!evento.getOrganizadorId().equals(organizadorId)) {
            throw new OperacionNoPermitidaException("No tiene permiso para modificar este evento");
        }
    }

    private void validarFechas(LocalDateTime inicio, LocalDateTime fin) {
        if (!fin.isAfter(inicio)) {
            throw new ValidacionNegocioException("La fecha de fin debe ser posterior a la fecha de inicio");
        }
    }
}
