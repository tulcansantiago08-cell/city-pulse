package com.citypulse.model;

import com.citypulse.enums.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Documento base de la colección "usuarios".
 * La herencia se discrimina por el campo "rol" usando @TypeAlias en las subclases.
 */
@Document(collection = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class Usuario {

    @Id
    private String id;

    @Indexed(unique = true)
    private String correo;

    private String passwordHash;
    private String nombre;
    private String apellido;
    private String fotoPerfilUrl;
    private boolean correoVerificado = false;
    private String tokenVerificacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
    private RolUsuario rol;
}
