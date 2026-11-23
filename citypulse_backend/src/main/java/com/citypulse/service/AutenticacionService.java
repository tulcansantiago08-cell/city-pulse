package com.citypulse.service;

import com.citypulse.dto.request.LoginGoogleRequest;
import com.citypulse.dto.request.LoginRequest;
import com.citypulse.dto.request.RegistroUsuarioRequest;
import com.citypulse.dto.request.RestablecerPasswordRequest;
import com.citypulse.dto.response.UsuarioResponse;

public interface AutenticacionService {

    /** Registra un nuevo Asistente y envía correo de verificación. Retorna 201. */
    UsuarioResponse registrar(RegistroUsuarioRequest req);

    /** Valida credenciales y retorna un token de sesión simple. */
    String iniciarSesion(LoginRequest req);

    /** Inicia sesión o crea cuenta mediante token OAuth de Google. */
    String iniciarSesionGoogle(LoginGoogleRequest req);

    /** Marca el correo del usuario como verificado. */
    void verificarCorreo(String token);

    /** Genera token con expiración de 60 minutos y envía enlace al correo. */
    void solicitarRecuperacion(String correo);

    /** Valida el token de recuperación y aplica la nueva contraseña. */
    void restablecerPassword(RestablecerPasswordRequest req);
}
