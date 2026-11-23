package com.citypulse.dto.request;

import com.citypulse.enums.Modalidad;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FiltroEventoRequest {
    private String categoriaId;
    private Modalidad modalidad;
    private LocalDateTime fechaDesde;
    private LocalDateTime fechaHasta;
}
