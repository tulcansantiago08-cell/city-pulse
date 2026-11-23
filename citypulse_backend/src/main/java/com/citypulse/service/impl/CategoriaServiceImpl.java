package com.citypulse.service.impl;

import com.citypulse.dto.request.CrearCategoriaRequest;
import com.citypulse.dto.response.CategoriaResponse;
import com.citypulse.exception.RecursoDuplicadoException;
import com.citypulse.exception.RecursoNoEncontradoException;
import com.citypulse.model.Categoria;
import com.citypulse.repository.CategoriaRepository;
import com.citypulse.service.CategoriaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Override
    public CategoriaResponse crear(CrearCategoriaRequest req) {
        if (categoriaRepository.existsByNombre(req.getNombre())) {
            throw new RecursoDuplicadoException("Ya existe una categoría con el nombre: " + req.getNombre());
        }
        Categoria cat = Categoria.builder()
                .nombre(req.getNombre())
                .activa(true)
                .build();
        return mapToResponse(categoriaRepository.save(cat));
    }

    @Override
    public CategoriaResponse modificar(String id, String nuevoNombre) {
        Categoria cat = buscarOFallar(id);
        if (categoriaRepository.existsByNombre(nuevoNombre) && !cat.getNombre().equals(nuevoNombre)) {
            throw new RecursoDuplicadoException("Ya existe una categoría con el nombre: " + nuevoNombre);
        }
        cat.setNombre(nuevoNombre);
        return mapToResponse(categoriaRepository.save(cat));
    }

    @Override
    public void eliminar(String id) {
        Categoria cat = buscarOFallar(id);
        cat.setActiva(false);
        categoriaRepository.save(cat);
        log.info("Categoría desactivada: {}", id);
    }

    @Override
    public List<CategoriaResponse> listarActivas() {
        return categoriaRepository.findByActivaTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Categoria buscarOFallar(String id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría con id " + id + " no encontrada"));
    }

    private CategoriaResponse mapToResponse(Categoria c) {
        return CategoriaResponse.builder()
                .id(c.getId())
                .nombre(c.getNombre())
                .activa(c.isActiva())
                .build();
    }
}
