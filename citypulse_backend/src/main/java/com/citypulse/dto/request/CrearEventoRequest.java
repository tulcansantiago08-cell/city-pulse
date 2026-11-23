package com.citypulse.dto.request;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.citypulse.enums.Modalidad;
import com.citypulse.enums.TipoCanal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CrearEventoRequest {

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

    @NotNull
    @Valid
    private CanalInscripcionRequest canalInscripcion;

    // ---------------------------------------------------------------
    // DTO interno polimórfico para el canal de inscripción
    // ---------------------------------------------------------------

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "tipo", visible = true)
    @JsonSubTypes({
        @JsonSubTypes.Type(value = CanalURLRequest.class,        name = "URL"),
        @JsonSubTypes.Type(value = CanalWhatsAppRequest.class,   name = "WHATSAPP"),
        @JsonSubTypes.Type(value = CanalFormularioRequest.class, name = "FORMULARIO")
    })
    @Data
    public abstract static class CanalInscripcionRequest {
        @NotNull
        private TipoCanal tipo;

        @NotBlank
        private String destino;
    }

    @Data
    public static class CanalURLRequest extends CanalInscripcionRequest {}

    @Data
    public static class CanalWhatsAppRequest extends CanalInscripcionRequest {
        private String mensajePredefinido;
    }

    @Data
    public static class CanalFormularioRequest extends CanalInscripcionRequest {
        private String proveedor;
    }
}
