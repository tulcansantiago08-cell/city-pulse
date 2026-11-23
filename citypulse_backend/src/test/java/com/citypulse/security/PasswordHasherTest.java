package com.citypulse.security;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class PasswordHasherTest {

    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void generaHashBcryptConCoste12YNoGuardaTextoPlano() {
        String hash = hasher.hash("CityPulse2026");
        assertTrue(hash.startsWith("$2a$12$"), hash);
        assertFalse(hash.contains("CityPulse2026"));
        assertFalse(hasher.esLegado(hash));
    }

    @Test
    void verificaContrasenaCorrectaEIncorrecta() {
        String hash = hasher.hash("CityPulse2026");
        assertTrue(hasher.coincide("CityPulse2026", hash));
        assertFalse(hasher.coincide("otraClave2026", hash));
        assertFalse(hasher.coincide(null, hash));
    }

    @Test
    void aceptaHashesBase64AntiguosParaMigrarlos() {
        String legado = Base64.getEncoder().encodeToString("CityPulse2026".getBytes());
        assertTrue(hasher.esLegado(legado));
        assertTrue(hasher.coincide("CityPulse2026", legado));
        assertFalse(hasher.coincide("otraClave2026", legado));
    }
}
