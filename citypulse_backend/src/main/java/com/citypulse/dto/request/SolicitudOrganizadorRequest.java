package com.citypulse.dto.request;

import com.citypulse.enums.TipoOrganizacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SolicitudOrganizadorRequest {

    @NotBlank
    private String nombreEntidad;

    @NotNull
    private TipoOrganizacion tipo;

    @NotBlank
    private String telefonoContacto;

    private String sitioWeb;
    private String direccion;
}
