package com.citypulse.security;

import com.citypulse.dto.request.CrearAdministradorRequest;
import com.citypulse.enums.RolUsuario;
import com.citypulse.repository.UsuarioRepository;
import com.citypulse.service.AutenticacionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Crea el primer Administrador al arrancar, solo si la base no tiene ninguno y si están
 * definidas las variables {@code ADMIN_CORREO} y {@code ADMIN_PASSWORD}.
 * Los demás administradores se crean desde {@code POST /api/v1/admin/administradores}.
 *
 * @author Santiago Rivas
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdministradorInicial implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final AutenticacionService autenticacionService;

    @Value("${citypulse.admin.correo:}")
    private String correo;
    @Value("${citypulse.admin.password:}")
    private String password;
    @Value("${citypulse.admin.nombre:Administrador}")
    private String nombre;
    @Value("${citypulse.admin.apellido:City Pulse}")
    private String apellido;

    @Override
    public void run(ApplicationArguments args) {
        if (correo.isBlank() || password.isBlank()) {
            return;
        }
        try {
            if (usuarioRepository.existsByRol(RolUsuario.ADMINISTRADOR)) {
                return;
            }
            CrearAdministradorRequest req = new CrearAdministradorRequest();
            req.setCorreo(correo);
            req.setPassword(password);
            req.setNombre(nombre);
            req.setApellido(apellido);
            autenticacionService.crearAdministrador(req);
            log.info("Administrador inicial creado: {}", correo);
        } catch (RuntimeException e) {
            log.warn("No se pudo crear el administrador inicial: {}", e.getMessage());
        }
    }
}
