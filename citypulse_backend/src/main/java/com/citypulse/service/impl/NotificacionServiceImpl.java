package com.citypulse.service.impl;

import com.citypulse.service.NotificacionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Implementación stub de NotificacionService.
 * NOTA DE DISEÑO: La integración real con SMTP/SendGrid/SES debe configurarse
 * añadiendo spring-boot-starter-mail o un cliente HTTP al proveedor elegido.
 * Esta implementación loguea los envíos para facilitar el desarrollo local.
 */
@Slf4j
@Service
public class NotificacionServiceImpl implements NotificacionService {

    @Override
    public void enviarCorreoVerificacion(String destino, String token) {
        log.info("[NOTIFICACION] Verificación de correo → {} | token={}", destino, token);
    }

    @Override
    public void enviarEnlaceRecuperacion(String destino, String token) {
        log.info("[NOTIFICACION] Recuperación de contraseña → {} | token={}", destino, token);
    }

    @Override
    public void notificarResultadoSolicitud(String destino, boolean aprobada, String motivo) {
        log.info("[NOTIFICACION] Resultado solicitud → {} | aprobada={} | motivo={}", destino, aprobada, motivo);
    }
}
