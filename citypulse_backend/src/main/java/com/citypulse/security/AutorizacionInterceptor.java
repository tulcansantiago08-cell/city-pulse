package com.citypulse.security;

import com.citypulse.enums.RolUsuario;
import com.citypulse.exception.CredencialesInvalidasException;
import com.citypulse.exception.OperacionNoPermitidaException;
import com.citypulse.model.Usuario;
import com.citypulse.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

/**
 * Valida el JWT y el rol en los endpoints marcados con {@link RequiereRol} (RNF-011).
 *
 * <ul>
 *   <li>Sin token o con token inválido/expirado: <b>401</b>.</li>
 *   <li>Con token válido pero sin el rol requerido: <b>403</b>.</li>
 * </ul>
 * El rol se lee de la base en cada petición, así un Asistente aprobado como Organizador
 * obtiene los permisos de inmediato sin volver a iniciar sesión (HU003).
 *
 * @author Santiago Rivas
 */
@Component
@RequiredArgsConstructor
public class AutorizacionInterceptor implements HandlerInterceptor {

    /** Atributo de la petición donde queda el {@link UsuarioAutenticado}. */
    public static final String ATRIBUTO = "usuarioAutenticado";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod metodo)) {
            return true;
        }
        RequiereRol regla = AnnotatedElementUtils.findMergedAnnotation(metodo.getMethod(), RequiereRol.class);
        if (regla == null) {
            regla = AnnotatedElementUtils.findMergedAnnotation(metodo.getBeanType(), RequiereRol.class);
        }
        if (regla == null) {
            return true; // endpoint público
        }

        String cabecera = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (cabecera == null || !cabecera.startsWith("Bearer ")) {
            throw new CredencialesInvalidasException("Debes iniciar sesión (falta el token Bearer)");
        }
        UsuarioAutenticado token = jwtService.validar(cabecera.substring(7).trim());
        Usuario usuario = usuarioRepository.findById(token.id())
                .orElseThrow(() -> new CredencialesInvalidasException("La cuenta de la sesión ya no existe"));
        UsuarioAutenticado actual = new UsuarioAutenticado(usuario.getId(), usuario.getRol());

        RolUsuario[] permitidos = regla.value();
        if (permitidos.length > 0 && Arrays.stream(permitidos).noneMatch(r -> r == actual.rol())) {
            throw new OperacionNoPermitidaException("Tu rol (" + actual.rol() + ") no tiene permiso para esta operación");
        }
        request.setAttribute(ATRIBUTO, actual);
        return true;
    }

    /**
     * Exige que la operación sea sobre la propia cuenta, salvo para administradores si {@code permitirAdmin}.
     */
    public static void exigirMismoUsuario(UsuarioAutenticado auth, String idRecurso, boolean permitirAdmin) {
        boolean esPropio = auth.id().equals(idRecurso);
        boolean esAdmin = permitirAdmin && auth.rol() == RolUsuario.ADMINISTRADOR;
        if (!esPropio && !esAdmin) {
            throw new OperacionNoPermitidaException("Solo puedes realizar esta operación sobre tu propia cuenta");
        }
    }
}
