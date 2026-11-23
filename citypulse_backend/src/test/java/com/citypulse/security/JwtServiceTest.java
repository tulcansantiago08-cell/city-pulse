package com.citypulse.security;

import com.citypulse.enums.RolUsuario;
import com.citypulse.exception.CredencialesInvalidasException;
import com.citypulse.model.Organizador;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRETO = Base64.getEncoder().encodeToString(new byte[64]);

    private Organizador organizador() {
        Organizador o = new Organizador();
        o.setId("abc123");
        o.setCorreo("daniela.rosero@colectivogaleras.org");
        o.setRol(RolUsuario.ORGANIZADOR);
        return o;
    }

    @Test
    void generaYValidaUnTokenConIdYRol() {
        JwtService jwt = new JwtService(SECRETO, 24);
        UsuarioAutenticado u = jwt.validar(jwt.generar(organizador()));
        assertEquals("abc123", u.id());
        assertEquals(RolUsuario.ORGANIZADOR, u.rol());
        assertEquals(24 * 3600, jwt.segundosDeValidez());
    }

    @Test
    void rechazaTokensAlterados() {
        JwtService jwt = new JwtService(SECRETO, 24);
        String token = jwt.generar(organizador());
        String alterado = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");
        assertThrows(CredencialesInvalidasException.class, () -> jwt.validar(alterado));
        assertThrows(CredencialesInvalidasException.class, () -> jwt.validar("no-es-un-jwt"));
    }

    @Test
    void rechazaTokensFirmadosConOtraClave() {
        String token = new JwtService(SECRETO, 24).generar(organizador());
        JwtService otra = new JwtService(Base64.getEncoder().encodeToString("otra-clave-de-al-menos-256-bits-para-pruebas!!".getBytes()), 24);
        assertThrows(CredencialesInvalidasException.class, () -> otra.validar(token));
    }

    @Test
    void laDuracionNuncaSuperaLas24Horas() {
        assertEquals(24 * 3600, new JwtService(SECRETO, 72).segundosDeValidez());
    }
}
