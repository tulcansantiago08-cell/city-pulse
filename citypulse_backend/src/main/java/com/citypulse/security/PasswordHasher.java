package com.citypulse.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Hash de contraseñas con BCrypt, factor de coste 12 (RNF-009).
 *
 * <p>Las cuentas creadas antes de este cambio guardaban la contraseña en Base64.
 * {@link #coincide(String, String)} las sigue aceptando y {@link #esLegado(String)}
 * permite volver a guardarlas con BCrypt en el siguiente inicio de sesión.</p>
 *
 * @author Santiago Rivas
 */
@Component
public class PasswordHasher {

    private static final int COSTE = 12;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(COSTE);

    public String hash(String password) {
        return encoder.encode(password);
    }

    public boolean coincide(String password, String hashGuardado) {
        if (password == null || hashGuardado == null) {
            return false;
        }
        if (esLegado(hashGuardado)) {
            String legado = Base64.getEncoder().encodeToString(password.getBytes(StandardCharsets.UTF_8));
            return legado.equals(hashGuardado);
        }
        return encoder.matches(password, hashGuardado);
    }

    /** Indica si el hash es del formato anterior (Base64) y debe migrarse a BCrypt. */
    public boolean esLegado(String hashGuardado) {
        return hashGuardado != null && !hashGuardado.startsWith("$2");
    }
}
