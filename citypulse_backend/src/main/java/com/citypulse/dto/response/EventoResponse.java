package com.citypulse.dto.response;

import com.citypulse.enums.EstadoEvento;
import com.citypulse.enums.Modalidad;
import com.citypulse.model.CanalInscripcion;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EventoResponse {
    private String id;
    private String titulo;
    private String descripcion;
    private String categoriaId;
    private String organizadorId;
    private String nombreOrganizador;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Modalidad modalidad;
    private String flyerUrl;
    private Double precio;
    private boolean publicado;
    private boolean cancelado;
    private int contadorClics;
    private CanalInscripcion canalInscripcion;
    private EstadoEvento estado;
    private LocalDateTime fechaCreacion;
}
