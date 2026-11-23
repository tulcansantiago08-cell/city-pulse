package com.citypulse.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "usuarios")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Organizador extends Usuario {

    private OrganizacionInfo infoOrganizacion;
}
