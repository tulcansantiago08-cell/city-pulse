package com.citypulse.controller;

import com.citypulse.dto.request.*;
import com.citypulse.dto.response.UsuarioResponse;
import com.citypulse.service.AutenticacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints de autenticación y gestión de cuentas.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AutenticacionService autenticacionService;

    /**
     * Registra un nuevo Asistente.
     *
     * @param req correo y contraseña.
     * @return 201 con los datos del usuario creado (sin contraseña).
     */
    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody RegistroUsuarioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(autenticacionService.registrar(req));
    }

    /**
     * Inicia sesión con correo y contraseña.
     *
     * @return 200 con el token de sesión.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest req) {
        String token = autenticacionService.iniciarSesion(req);
        return ResponseEntity.ok(Map.of("token", token));
    }

    /**
     * Inicia sesión o crea cuenta mediante token OAuth de Google.
     *
     * @return 200 con el token de sesión.
     */
    @PostMapping("/login/google")
    public ResponseEntity<Map<String, String>> loginGoogle(@Valid @RequestBody LoginGoogleRequest req) {
        String token = autenticacionService.iniciarSesionGoogle(req);
        return ResponseEntity.ok(Map.of("token", token));
    }

    /**
     * Verifica el correo del usuario mediante el token enviado por email.
     *
     * @param token UUID de verificación.
     * @return 200 si la verificación fue exitosa.
     */
    @GetMapping("/verificar/{token}")
    public ResponseEntity<Map<String, String>> verificar(@PathVariable String token) {
        autenticacionService.verificarCorreo(token);
        return ResponseEntity.ok(Map.of("mensaje", "Correo verificado correctamente"));
    }

    /**
     * Solicita el envío de un enlace de recuperación de contraseña.
     *
     * @return 200 siempre (no revelar si el correo existe o no).
     */
    @PostMapping("/recuperar-password")
    public ResponseEntity<Map<String, String>> recuperar(@Valid @RequestBody RecuperarPasswordRequest req) {
        autenticacionService.solicitarRecuperacion(req.getCorreo());
        return ResponseEntity.ok(Map.of("mensaje", "Si el correo existe, recibirás un enlace de recuperación"));
    }

    /**
     * Restablece la contraseña usando el token de recuperación.
     *
     * @return 200 si la operación fue exitosa.
     */
    @PostMapping("/restablecer-password")
    public ResponseEntity<Map<String, String>> restablecer(@Valid @RequestBody RestablecerPasswordRequest req) {
        autenticacionService.restablecerPassword(req);
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña restablecida correctamente"));
    }
}
