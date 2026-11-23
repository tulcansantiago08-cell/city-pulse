package com.citypulse.service.impl;

import com.citypulse.dto.request.LoginGoogleRequest;
import com.citypulse.dto.request.LoginRequest;
import com.citypulse.dto.request.RegistroUsuarioRequest;
import com.citypulse.dto.request.RestablecerPasswordRequest;
import com.citypulse.dto.response.UsuarioResponse;
import com.citypulse.enums.RolUsuario;
import com.citypulse.exception.CredencialesInvalidasException;
import com.citypulse.exception.RecursoDuplicadoException;
import com.citypulse.exception.RecursoNoEncontradoException;
import com.citypulse.exception.TokenExpiradoException;
import com.citypulse.model.Asistente;
import com.citypulse.model.Usuario;
import com.citypulse.repository.UsuarioRepository;
import com.citypulse.security.PasswordHasher;
import com.citypulse.service.AutenticacionService;
import com.citypulse.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutenticacionServiceImpl implements AutenticacionService {

    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final PasswordHasher passwordHasher;

    @Override
    public UsuarioResponse registrar(RegistroUsuarioRequest req) {
        if (usuarioRepository.existsByCorreo(req.getCorreo())) {
            throw new RecursoDuplicadoException("Ya existe un usuario con el correo: " + req.getCorreo());
        }

        String token = UUID.randomUUID().toString();
        Asistente asistente = new Asistente();
        asistente.setCorreo(req.getCorreo());
        asistente.setPasswordHash(hashPassword(req.getPassword()));
        asistente.setRol(RolUsuario.ASISTENTE);
        asistente.setTokenVerificacion(token);
        asistente.setCorreoVerificado(false);
        asistente.setFechaCreacion(LocalDateTime.now());
        asistente.setFechaModificacion(LocalDateTime.now());

        Asistente guardado = (Asistente) usuarioRepository.save(asistente);
        log.info("Nuevo asistente registrado: {}", guardado.getCorreo());
        notificacionService.enviarCorreoVerificacion(guardado.getCorreo(), token);

        return mapToResponse(guardado);
    }

    @Override
    public String iniciarSesion(LoginRequest req) {
        Usuario usuario = usuarioRepository.findByCorreo(req.getCorreo())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales inválidas"));

        if (!passwordHasher.coincide(req.getPassword(), usuario.getPasswordHash())) {
            log.warn("Intento de login fallido para: {}", req.getCorreo());
            throw new CredencialesInvalidasException("Credenciales inválidas");
        }
        if (passwordHasher.esLegado(usuario.getPasswordHash())) {
            // Migración transparente: la contraseña era correcta, se vuelve a guardar con BCrypt.
            usuario.setPasswordHash(passwordHasher.hash(req.getPassword()));
            usuarioRepository.save(usuario);
            log.info("Contraseña migrada a BCrypt para: {}", usuario.getCorreo());
        }

        log.info("Login exitoso: {}", usuario.getCorreo());
        // NOTA DE DISEÑO: Token simple en Base64 para MVP. Reemplazar con JWT (spring-security + jjwt)
        // en la siguiente iteración del proyecto.
        return Base64.getEncoder().encodeToString((usuario.getId() + ":" + usuario.getRol()).getBytes());
    }

    @Override
    public String iniciarSesionGoogle(LoginGoogleRequest req) {
        // NOTA DE DISEÑO: La verificación real del tokenOAuth requiere integración con
        // Google Identity Platform (google-auth-library-oauth2-http). Este stub simula
        // el flujo esperado para facilitar el desarrollo del frontend.
        log.info("Intento de login con Google (token no verificado en MVP)");
        throw new CredencialesInvalidasException("Integración con Google OAuth pendiente de configuración");
    }

    @Override
    public void verificarCorreo(String token) {
        Usuario usuario = usuarioRepository.findByTokenVerificacion(token)
                .orElseThrow(() -> new TokenExpiradoException("Token de verificación inválido o expirado"));

        usuario.setCorreoVerificado(true);
        usuario.setTokenVerificacion(null);
        usuario.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(usuario);
        log.info("Correo verificado para: {}", usuario.getCorreo());
    }

    @Override
    public void solicitarRecuperacion(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe usuario con el correo: " + correo));

        // NOTA DE DISEÑO: Para una expiración real de 60 minutos se recomienda
        // almacenar el token junto a su fecha de expiración en una colección separada
        // (tokens_recuperacion). En MVP usamos el mismo campo tokenVerificacion.
        String token = UUID.randomUUID().toString();
        usuario.setTokenVerificacion(token);
        usuario.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(usuario);

        notificacionService.enviarEnlaceRecuperacion(correo, token);
        log.info("Enlace de recuperación enviado a: {}", correo);
    }

    @Override
    public void restablecerPassword(RestablecerPasswordRequest req) {
        Usuario usuario = usuarioRepository.findByTokenVerificacion(req.getToken())
                .orElseThrow(() -> new TokenExpiradoException("Token de recuperación inválido o expirado"));

        usuario.setPasswordHash(hashPassword(req.getNuevaPassword()));
        usuario.setTokenVerificacion(null);
        usuario.setFechaModificacion(LocalDateTime.now());
        usuarioRepository.save(usuario);
        log.info("Contraseña restablecida para: {}", usuario.getCorreo());
    }

    // ---------------------------------------------------------------
    // Helpers privados
    // ---------------------------------------------------------------

    private String hashPassword(String password) {
        return passwordHasher.hash(password);
    }

    private UsuarioResponse mapToResponse(Usuario u) {
        return UsuarioResponse.builder()
                .id(u.getId())
                .correo(u.getCorreo())
                .nombre(u.getNombre())
                .apellido(u.getApellido())
                .fotoPerfilUrl(u.getFotoPerfilUrl())
                .correoVerificado(u.isCorreoVerificado())
                .rol(u.getRol())
                .fechaCreacion(u.getFechaCreacion())
                .build();
    }
}
