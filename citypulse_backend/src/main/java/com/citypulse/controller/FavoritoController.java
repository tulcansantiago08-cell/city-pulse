package com.citypulse.controller;

import com.citypulse.dto.response.EventoCardResponse;
import com.citypulse.service.FavoritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestión de eventos favoritos de un asistente.
 */
@RestController
@RequestMapping("/api/v1/usuarios/{asistenteId}/favoritos")
@RequiredArgsConstructor
public class FavoritoController {

    private final FavoritoService favoritoService;

    /**
     * Lista los eventos favoritos del asistente con su estado actual.
     *
     * @param asistenteId ID del asistente.
     * @return 200 con lista de cards.
     */
    @GetMapping
    public ResponseEntity<List<EventoCardResponse>> listar(@PathVariable String asistenteId) {
        return ResponseEntity.ok(favoritoService.listar(asistenteId));
    }

    /**
     * Agrega un evento a los favoritos del asistente.
     *
     * @param asistenteId ID del asistente.
     * @param eventoId    ID del evento a agregar.
     * @return 201 sin contenido.
     */
    @PostMapping("/{eventoId}")
    public ResponseEntity<Void> agregar(
            @PathVariable String asistenteId,
            @PathVariable String eventoId) {
        favoritoService.agregar(asistenteId, eventoId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Elimina un evento de los favoritos del asistente.
     *
     * @param asistenteId ID del asistente.
     * @param eventoId    ID del evento a eliminar.
     * @return 204 sin contenido.
     */
    @DeleteMapping("/{eventoId}")
    public ResponseEntity<Void> remover(
            @PathVariable String asistenteId,
            @PathVariable String eventoId) {
        favoritoService.remover(asistenteId, eventoId);
        return ResponseEntity.noContent().build();
    }
}
