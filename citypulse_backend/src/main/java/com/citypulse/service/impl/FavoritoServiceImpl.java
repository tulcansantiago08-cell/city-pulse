package com.citypulse.service.impl;

import com.citypulse.dto.response.EventoCardResponse;
import com.citypulse.exception.RecursoNoEncontradoException;
import com.citypulse.exception.ValidacionNegocioException;
import com.citypulse.model.Asistente;
import com.citypulse.model.Evento;
import com.citypulse.model.Favorito;
import com.citypulse.model.Usuario;
import com.citypulse.repository.EventoRepository;
import com.citypulse.repository.UsuarioRepository;
import com.citypulse.service.FavoritoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoritoServiceImpl implements FavoritoService {

    private final UsuarioRepository usuarioRepository;
    private final EventoRepository eventoRepository;
    private final EventoServiceImpl eventoServiceImpl;

    @Override
    public void agregar(String asistenteId, String eventoId) {
        Asistente asistente = buscarAsistente(asistenteId);
        eventoRepository.findById(eventoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Evento con id " + eventoId + " no encontrado"));

        boolean yaExiste = asistente.getFavoritos().stream()
                .anyMatch(f -> f.getEventoId().equals(eventoId));
        if (yaExiste) {
            throw new ValidacionNegocioException("El evento ya está en favoritos");
        }

        asistente.getFavoritos().add(Favorito.builder()
                .eventoId(eventoId)
                .fechaAgregado(LocalDateTime.now())
                .build());
        usuarioRepository.save(asistente);
    }

    @Override
    public void remover(String asistenteId, String eventoId) {
        Asistente asistente = buscarAsistente(asistenteId);
        boolean removido = asistente.getFavoritos().removeIf(f -> f.getEventoId().equals(eventoId));
        if (!removido) {
            throw new RecursoNoEncontradoException("El evento no está en favoritos");
        }
        usuarioRepository.save(asistente);
    }

    @Override
    public List<EventoCardResponse> listar(String asistenteId) {
        Asistente asistente = buscarAsistente(asistenteId);
        return asistente.getFavoritos().stream()
                .map(f -> eventoRepository.findById(f.getEventoId()))
                .filter(opt -> opt.isPresent() && !opt.get().isEliminado())
                .map(opt -> {
                    Evento e = opt.get();
                    String precioStr = (e.getPrecio() == null || e.getPrecio() == 0.0) ? "Gratuito"
                            : String.format("$%.2f", e.getPrecio());
                    String nombreOrg = usuarioRepository.findById(e.getOrganizadorId())
                            .map(u -> (u.getNombre() != null ? u.getNombre() : "") +
                                      (u.getApellido() != null ? " " + u.getApellido() : ""))
                            .orElse("").trim();
                    return EventoCardResponse.builder()
                            .id(e.getId())
                            .titulo(e.getTitulo())
                            .flyerUrl(e.getFlyerUrl())
                            .fechaInicio(e.getFechaInicio())
                            .precioFormateado(precioStr)
                            .nombreOrganizador(nombreOrg)
                            .estado(eventoServiceImpl.calcularEstado(e))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private Asistente buscarAsistente(String id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario con id " + id + " no encontrado"));
        if (!(u instanceof Asistente)) {
            throw new ValidacionNegocioException("El usuario no es un asistente");
        }
        return (Asistente) u;
    }
}
