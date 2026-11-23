package com.citypulse.model;

import com.citypulse.enums.Modalidad;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "eventos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evento {

    @Id
    private String id;

    private String titulo;
    private String descripcion;
    private String categoriaId;
    private String organizadorId;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Modalidad modalidad;
    private String flyerUrl;
    private Double precio;

    @Builder.Default
    private boolean publicado = true;

    @Builder.Default
    private boolean cancelado = false;

    @Builder.Default
    private boolean eliminado = false;

    @Builder.Default
    private int contadorClics = 0;

    private CanalInscripcion canalInscripcion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
}
