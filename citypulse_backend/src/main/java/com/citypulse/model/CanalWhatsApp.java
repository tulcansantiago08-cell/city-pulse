package com.citypulse.model;

import com.citypulse.enums.TipoCanal;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CanalWhatsApp extends CanalInscripcion {

    private String mensajePredefinido;

    public CanalWhatsApp(String numeroTelefono, String mensajePredefinido) {
        super(TipoCanal.WHATSAPP, numeroTelefono);
        this.mensajePredefinido = mensajePredefinido;
    }

    @Override
    public String construirUrl() {
        String mensaje = (mensajePredefinido != null && !mensajePredefinido.isBlank())
                ? URLEncoder.encode(mensajePredefinido, StandardCharsets.UTF_8)
                : "";
        return "https://wa.me/" + getDestino() + (mensaje.isBlank() ? "" : "?text=" + mensaje);
    }
}
