package com.citypulse.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CrearCategoriaRequest {

    @NotBlank
    private String nombre;
}
