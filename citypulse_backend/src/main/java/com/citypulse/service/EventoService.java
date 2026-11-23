package com.citypulse.service;

import com.citypulse.dto.request.CrearEventoRequest;
import com.citypulse.dto.request.EditarEventoRequest;
import com.citypulse.dto.request.FiltroEventoRequest;
import com.citypulse.dto.response.EventoCardResponse;
import com.citypulse.dto.response.EventoResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface EventoService {

    EventoResponse crear(String organizadorId, CrearEventoRequest req);

    /** Edita un evento activo. Falla si el evento ya finalizó. */
    EventoResponse editar(String organizadorId, String eventoId, EditarEventoRequest req);

    /** Eliminación lógica (campo eliminado = true). */
    void eliminar(String organizadorId, String eventoId);

    void cambiarVisibilidad(String organizadorId, String eventoId, boolean oculto);

    void cancelar(String organizadorId, String eventoId);

    /** Incrementa el contador de clics sin retornar el evento. */
    void registrarClic(String eventoId);

    /** Obtiene el detalle completo e incrementa el contador de clics. */
    EventoResponse obtenerDetalle(String eventoId);

    List<EventoCardResponse> listarPublicosOrdenadosPorFecha();

    List<EventoCardResponse> filtrar(FiltroEventoRequest filtro);

    List<EventoResponse> listarPorOrganizador(String organizadorId);

    /** Agrupa eventos del organizador por día, para el mes y año indicados. */
    Map<LocalDate, List<EventoResponse>> obtenerCalendarioMensual(String organizadorId, int mes, int anio);
}
