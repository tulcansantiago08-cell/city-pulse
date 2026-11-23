package com.citypulse.repository;

import com.citypulse.enums.Modalidad;
import com.citypulse.model.Evento;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface EventoRepository extends MongoRepository<Evento, String> {

    List<Evento> findByEliminadoFalseAndPublicadoTrueAndCanceladoFalseOrderByFechaInicioAsc();

    List<Evento> findByOrganizadorIdAndEliminadoFalse(String organizadorId);

    /**
     * Filtrado combinable: todos los parámetros son opcionales (null los ignora).
     * Se usa SpEL para omitir condiciones cuando el valor es nulo.
     */
    @Query("{ $and: [ " +
           "  { 'eliminado': false }, " +
           "  { 'publicado': true }, " +
           "  { 'cancelado': false }, " +
           "  { $or: [ { $expr: { $eq: [?0, null] } }, { 'categoriaId': ?0 } ] }, " +
           "  { $or: [ { $expr: { $eq: [?1, null] } }, { 'modalidad': ?1 } ] }, " +
           "  { $or: [ { $expr: { $eq: [?2, null] } }, { 'fechaInicio': { $gte: ?2 } } ] }, " +
           "  { $or: [ { $expr: { $eq: [?3, null] } }, { 'fechaFin':   { $lte: ?3 } } ] }  " +
           "] }")
    List<Evento> filtrar(String categoriaId, Modalidad modalidad,
                         LocalDateTime fechaDesde, LocalDateTime fechaHasta);
}
