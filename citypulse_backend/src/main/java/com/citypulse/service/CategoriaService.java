package com.citypulse.service;

import com.citypulse.dto.request.CrearCategoriaRequest;
import com.citypulse.dto.response.CategoriaResponse;

import java.util.List;

public interface CategoriaService {

    CategoriaResponse crear(CrearCategoriaRequest req);

    CategoriaResponse modificar(String id, String nuevoNombre);

    void eliminar(String id);

    List<CategoriaResponse> listarActivas();
}
