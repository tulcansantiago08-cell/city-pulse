package com.citypulse.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "usuarios")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Asistente extends Usuario {

    private List<Favorito> favoritos = new ArrayList<>();
}
