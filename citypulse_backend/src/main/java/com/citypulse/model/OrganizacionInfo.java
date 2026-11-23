package com.citypulse.model;

import com.citypulse.enums.TipoOrganizacion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Objeto embebido — no es colección propia. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizacionInfo {
    private String nombreEntidad;
    private TipoOrganizacion tipo;
    private String telefonoContacto;
    private String sitioWeb;
    private String direccion;
}
