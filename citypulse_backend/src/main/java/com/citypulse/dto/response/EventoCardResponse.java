package com.citypulse.dto.response;

import com.citypulse.enums.EstadoEvento;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** Vista reducida para el grid/cartelera. */
@Data
@Builder
public class EventoCardResponse {
    private String id;
    private String titulo;
    private String flyerUrl;
    private LocalDateTime fechaInicio;
    private String precioFormateado;
    private String nombreOrganizador;
    private EstadoEvento estado;
}
