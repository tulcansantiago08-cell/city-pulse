package com.citypulse.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EditarPerfilRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellido;

    private String fotoPerfilUrl;
}
