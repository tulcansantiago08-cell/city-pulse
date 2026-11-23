package com.citypulse.service;

import com.citypulse.dto.response.EventoCardResponse;

import java.util.List;

public interface FavoritoService {

    void agregar(String asistenteId, String eventoId);

    void remover(String asistenteId, String eventoId);

    /** Lista favoritos reflejando el estado actual de cada evento. */
    List<EventoCardResponse> listar(String asistenteId);
}
