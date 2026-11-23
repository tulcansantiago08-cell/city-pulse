package com.citypulse.model;

import com.citypulse.enums.TipoCanal;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CanalURL extends CanalInscripcion {

    public CanalURL(String destino) {
        super(TipoCanal.URL, destino);
    }

    @Override
    public String construirUrl() {
        return getDestino();
    }
}
