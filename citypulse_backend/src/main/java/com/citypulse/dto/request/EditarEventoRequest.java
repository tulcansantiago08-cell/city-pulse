package com.citypulse.dto.request;

import com.citypulse.enums.Modalidad;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EditarEventoRequest {

    @NotBlank
    private String titulo;

    @NotBlank
    private String descripcion;

    @NotBlank
    private String categoriaId;

    @NotNull
    @Future
    private LocalDateTime fechaInicio;

    @NotNull
    @Future
    private LocalDateTime fechaFin;

    @NotNull
    private Modalidad modalidad;

    private String flyerUrl;
    private Double precio;

    @Valid
    private CrearEventoRequest.CanalInscripcionRequest canalInscripcion;
}
