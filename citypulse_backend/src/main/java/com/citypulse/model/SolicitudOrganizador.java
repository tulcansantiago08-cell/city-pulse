package com.citypulse.model;

import com.citypulse.enums.EstadoSolicitud;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "solicitudes_organizador")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudOrganizador {

    @Id
    private String id;

    private String solicitanteId;
    private OrganizacionInfo infoPropuesta;

    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    private String motivoRechazo;
    private String revisorId;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaResolucion;
}
