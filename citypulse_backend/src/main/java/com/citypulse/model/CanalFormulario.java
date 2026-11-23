package com.citypulse.model;

import com.citypulse.enums.TipoCanal;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CanalFormulario extends CanalInscripcion {

    private String proveedor;

    public CanalFormulario(String urlFormulario, String proveedor) {
        super(TipoCanal.FORMULARIO, urlFormulario);
        this.proveedor = proveedor;
    }

    @Override
    public String construirUrl() {
        return getDestino();
    }
}
