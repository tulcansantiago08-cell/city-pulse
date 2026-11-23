package com.citypulse.security;

import com.citypulse.enums.RolUsuario;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca un endpoint (o un controlador completo) como protegido (RNF-011).
 *
 * <p>Exige un JWT válido en {@code Authorization: Bearer <token>}. Si se indican roles,
 * el usuario debe tener alguno de ellos; si la lista está vacía basta con estar autenticado.</p>
 *
 * @author Santiago Rivas
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiereRol {
    RolUsuario[] value() default {};
}
