package com.citypulse.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Datos para crear una cuenta de Administrador.
 *
 * @author Santiago Rivas
 */
@Data
public class CrearAdministradorRequest {

    @NotBlank
    @Email
    private String correo;

    @NotBlank
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellido;
}
