package com.citypulse.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.citypulse.enums.TipoCanal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Jerarquía Strategy para el canal de inscripción de un evento.
 * Serializable de forma polimórfica vía Jackson (campo "tipo").
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "tipo", visible = true)
@JsonSubTypes({
    @JsonSubTypes.Type(value = CanalURL.class,        name = "URL"),
    @JsonSubTypes.Type(value = CanalWhatsApp.class,   name = "WHATSAPP"),
    @JsonSubTypes.Type(value = CanalFormulario.class, name = "FORMULARIO")
})
public abstract class CanalInscripcion {
    private TipoCanal tipo;
    private String destino;

    /** Retorna la URL final a la que se redirige al asistente. */
    public abstract String construirUrl();
}
