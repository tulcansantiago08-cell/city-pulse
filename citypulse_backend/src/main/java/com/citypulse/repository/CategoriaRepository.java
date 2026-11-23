package com.citypulse.repository;

import com.citypulse.model.Categoria;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CategoriaRepository extends MongoRepository<Categoria, String> {

    List<Categoria> findByActivaTrue();

    boolean existsByNombre(String nombre);
}
