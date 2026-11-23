package com.citypulse.repository;

import com.citypulse.enums.EstadoSolicitud;
import com.citypulse.model.SolicitudOrganizador;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SolicitudOrganizadorRepository extends MongoRepository<SolicitudOrganizador, String> {

    List<SolicitudOrganizador> findByEstado(EstadoSolicitud estado);
}
