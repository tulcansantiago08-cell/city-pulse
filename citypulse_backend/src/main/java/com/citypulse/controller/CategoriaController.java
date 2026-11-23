package com.citypulse.controller;

import com.citypulse.dto.request.CrearCategoriaRequest;
import com.citypulse.dto.response.CategoriaResponse;
import com.citypulse.service.CategoriaService;
import com.citypulse.enums.RolUsuario;
import com.citypulse.security.AutorizacionInterceptor;
import com.citypulse.security.RequiereRol;
import com.citypulse.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestión de categorías de eventos.
 */
@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    /**
     * Lista todas las categorías activas. Endpoint público.
     *
     * @return 200 con lista de categorías activas.
     */
    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar() {
        return ResponseEntity.ok(categoriaService.listarActivas());
    }

    /**
     * Crea una nueva categoría. Solo Administradores.
     *
     * @param req nombre de la nueva categoría.
     * @return 201 con la categoría creada.
     */
    @RequiereRol(RolUsuario.ADMINISTRADOR)
    @PostMapping
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CrearCategoriaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crear(req));
    }

    /**
     * Modifica el nombre de una categoría. Solo Administradores.
     *
     * @param id     identificador de la categoría.
     * @param nombre nuevo nombre.
     * @return 200 con la categoría actualizada.
     */
    @RequiereRol(RolUsuario.ADMINISTRADOR)
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> modificar(
            @PathVariable String id,
            @RequestParam String nombre) {
        return ResponseEntity.ok(categoriaService.modificar(id, nombre));
    }

    /**
     * Desactiva (eliminación lógica) una categoría. Solo Administradores.
     *
     * @param id identificador de la categoría.
     * @return 204 sin contenido.
     */
    @RequiereRol(RolUsuario.ADMINISTRADOR)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        categoriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
