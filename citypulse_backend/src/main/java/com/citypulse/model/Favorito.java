package com.citypulse.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Objeto embebido en Asistente. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorito {
    private String eventoId;
    private LocalDateTime fechaAgregado;
}
