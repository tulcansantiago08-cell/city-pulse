package com.citypulse.dto.response;

import com.citypulse.enums.EstadoSolicitud;
import com.citypulse.model.OrganizacionInfo;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SolicitudOrganizadorResponse {
    private String id;
    private String solicitanteId;
    private OrganizacionInfo infoPropuesta;
    private EstadoSolicitud estado;
    private String motivoRechazo;
    private String revisorId;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaResolucion;
}
