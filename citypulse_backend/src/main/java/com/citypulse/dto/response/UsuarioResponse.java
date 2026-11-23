package com.citypulse.dto.response;

import com.citypulse.enums.RolUsuario;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UsuarioResponse {
    private String id;
    private String correo;
    private String nombre;
    private String apellido;
    private String fotoPerfilUrl;
    private boolean correoVerificado;
    private RolUsuario rol;
    private LocalDateTime fechaCreacion;
}
