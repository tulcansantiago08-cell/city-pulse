package com.citypulse.security;

import com.citypulse.enums.RolUsuario;
import com.citypulse.exception.CredencialesInvalidasException;
import com.citypulse.exception.TokenExpiradoException;
import com.citypulse.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

/**
 * Emite y valida tokens JWT firmados con HMAC-SHA256 (RNF-010).
 *
 * <p>La clave se lee de {@code JWT_SECRET} (mínimo 256 bits). Si no está definida,
 * se genera una clave aleatoria al arrancar: sirve para desarrollo, pero los tokens
 * dejan de valer cada vez que se reinicia la aplicación.</p>
 *
 * @author Santiago Rivas
 */
@Slf4j
@Service
public class JwtService {

    private static final int BYTES_MINIMOS = 32; // 256 bits
    private final SecretKey clave;
    private final Duration duracion;

    public JwtService(@Value("${citypulse.jwt.secret:}") String secreto,
                      @Value("${citypulse.jwt.expiracion-horas:24}") long horas) {
        this.clave = Keys.hmacShaKeyFor(obtenerBytes(secreto));
        this.duracion = Duration.ofHours(Math.min(horas, 24));
    }

    public String generar(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(usuario.getId())
                .claim("rol", usuario.getRol().name())
                .claim("correo", usuario.getCorreo())
                .issuer("citypulse")
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(duracion)))
                .signWith(clave)
                .compact();
    }

    public UsuarioAutenticado validar(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(clave).requireIssuer("citypulse").build()
                    .parseSignedClaims(token).getPayload();
            return new UsuarioAutenticado(c.getSubject(), RolUsuario.valueOf(c.get("rol", String.class)));
        } catch (ExpiredJwtException e) {
            throw new TokenExpiradoException("La sesión expiró. Inicia sesión de nuevo.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new CredencialesInvalidasException("Token de sesión inválido");
        }
    }

    public long segundosDeValidez() {
        return duracion.toSeconds();
    }

    private static byte[] obtenerBytes(String secreto) {
        if (secreto != null && !secreto.isBlank()) {
            byte[] bytes;
            try {
                bytes = Base64.getDecoder().decode(secreto.trim());
            } catch (IllegalArgumentException e) {
                bytes = secreto.trim().getBytes(StandardCharsets.UTF_8);
            }
            if (bytes.length >= BYTES_MINIMOS) {
                return bytes;
            }
            log.warn("JWT_SECRET tiene menos de 256 bits; se usará una clave aleatoria temporal.");
        } else {
            log.warn("JWT_SECRET no está definido; se usará una clave aleatoria temporal (solo para desarrollo).");
        }
        byte[] aleatoria = new byte[64];
        new SecureRandom().nextBytes(aleatoria);
        return aleatoria;
    }
}
