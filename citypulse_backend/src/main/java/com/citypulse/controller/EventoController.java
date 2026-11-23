package com.citypulse.controller;

import com.citypulse.dto.request.CrearEventoRequest;
import com.citypulse.dto.request.EditarEventoRequest;
import com.citypulse.dto.request.FiltroEventoRequest;
import com.citypulse.dto.response.EventoCardResponse;
import com.citypulse.dto.response.EventoResponse;
import com.citypulse.enums.Modalidad;
import com.citypulse.service.EventoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Endpoints públicos y privados para la gestión de eventos.
 */
@RestController
@RequestMapping("/api/v1/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    /**
     * Lista eventos públicos con filtros opcionales vía query params.
     *
     * @param categoriaId ID de categoría (opcional).
     * @param modalidad   PRESENCIAL o VIRTUAL (opcional).
     * @param fechaDesde  Inicio del rango de búsqueda (opcional, formato ISO).
     * @param fechaHasta  Fin del rango de búsqueda (opcional, formato ISO).
     * @return 200 con lista de cards de eventos.
     */
    @GetMapping
    public ResponseEntity<List<EventoCardResponse>> listar(
            @RequestParam(required = false) String categoriaId,
            @RequestParam(required = false) Modalidad modalidad,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta) {

        boolean hayFiltros = categoriaId != null || modalidad != null || fechaDesde != null || fechaHasta != null;
        if (hayFiltros) {
            FiltroEventoRequest filtro = new FiltroEventoRequest();
            filtro.setCategoriaId(categoriaId);
            filtro.setModalidad(modalidad);
            filtro.setFechaDesde(fechaDesde);
            filtro.setFechaHasta(fechaHasta);
            return ResponseEntity.ok(eventoService.filtrar(filtro));
        }
        return ResponseEntity.ok(eventoService.listarPublicosOrdenadosPorFecha());
    }

    /**
     * Obtiene el detalle completo de un evento e incrementa su contador de clics.
     *
     * @param id identificador del evento.
     * @return 200 con el detalle del evento.
     */
    @GetMapping("/{id}")
    public ResponseEntity<EventoResponse> detalle(@PathVariable String id) {
        return ResponseEntity.ok(eventoService.obtenerDetalle(id));
    }

    /**
     * Crea un nuevo evento. Solo permitido para Organizadores.
     *
     * @param organizadorId ID del organizador propietario (header o path según seguridad).
     * @param req           datos del evento.
     * @return 201 con el evento creado.
     */
    @PostMapping
    public ResponseEntity<EventoResponse> crear(
            @RequestHeader("X-Organizador-Id") String organizadorId,
            @Valid @RequestBody CrearEventoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventoService.crear(organizadorId, req));
    }

    /**
     * Edita un evento existente. Solo el organizador propietario puede hacerlo.
     *
     * @param id            identificador del evento.
     * @param organizadorId ID del organizador que realiza la edición.
     * @param req           nuevos datos del evento.
     * @return 200 con el evento actualizado.
     */
    @PutMapping("/{id}")
    public ResponseEntity<EventoResponse> editar(
            @PathVariable String id,
            @RequestHeader("X-Organizador-Id") String organizadorId,
            @Valid @RequestBody EditarEventoRequest req) {
        return ResponseEntity.ok(eventoService.editar(organizadorId, id, req));
    }

    /**
     * Elimina lógicamente un evento. Solo el organizador propietario puede hacerlo.
     *
     * @param id            identificador del evento.
     * @param organizadorId ID del organizador propietario.
     * @return 204 sin contenido.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            @RequestHeader("X-Organizador-Id") String organizadorId) {
        eventoService.eliminar(organizadorId, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Cambia la visibilidad (oculto/publicado) de un evento.
     *
     * @param id     identificador del evento.
     * @param oculto true para ocultar, false para publicar.
     * @return 200 con mensaje de confirmación.
     */
    @PatchMapping("/{id}/visibilidad")
    public ResponseEntity<Map<String, String>> cambiarVisibilidad(
            @PathVariable String id,
            @RequestHeader("X-Organizador-Id") String organizadorId,
            @RequestParam boolean oculto) {
        eventoService.cambiarVisibilidad(organizadorId, id, oculto);
        return ResponseEntity.ok(Map.of("mensaje", "Visibilidad actualizada"));
    }

    /**
     * Cancela un evento activo.
     *
     * @param id identificador del evento.
     * @return 200 con mensaje de confirmación.
     */
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<Map<String, String>> cancelar(
            @PathVariable String id,
            @RequestHeader("X-Organizador-Id") String organizadorId) {
        eventoService.cancelar(organizadorId, id);
        return ResponseEntity.ok(Map.of("mensaje", "Evento cancelado"));
    }

    /**
     * Lista todos los eventos (no eliminados) de un organizador específico.
     *
     * @param organizadorId ID del organizador.
     * @return 200 con la lista de eventos.
     */
    @GetMapping("/organizador/{organizadorId}")
    public ResponseEntity<List<EventoResponse>> listarPorOrganizador(@PathVariable String organizadorId) {
        return ResponseEntity.ok(eventoService.listarPorOrganizador(organizadorId));
    }

    /**
     * Obtiene un calendario mensual agrupado por día para un organizador.
     *
     * @param organizadorId ID del organizador.
     * @param mes           mes (1-12).
     * @param anio          año (ej. 2025).
     * @return 200 con mapa de fecha → lista de eventos.
     */
    @GetMapping("/organizador/{organizadorId}/calendario")
    public ResponseEntity<Map<LocalDate, List<EventoResponse>>> calendario(
            @PathVariable String organizadorId,
            @RequestParam int mes,
            @RequestParam int anio) {
        return ResponseEntity.ok(eventoService.obtenerCalendarioMensual(organizadorId, mes, anio));
    }
}
