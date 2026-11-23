package com.citypulse.service;

public interface NotificacionService {

    void enviarCorreoVerificacion(String destino, String token);

    void enviarEnlaceRecuperacion(String destino, String token);

    void notificarResultadoSolicitud(String destino, boolean aprobada, String motivo);
}
