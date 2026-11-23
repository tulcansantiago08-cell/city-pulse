package com.citypulse.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EstadisticasEventoResponse {
    private String eventoId;
    private int contadorClics;
}
