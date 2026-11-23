# Pruebas de la API — City Pulse

**Autor:** Santiago Rivas

`pruebas_api.py` prueba la API de punta a punta contra la base de MongoDB configurada en `citypulse_backend/.env`. Carga datos de ejemplo de City Pulse y revisa cada endpoint, incluidos los casos que deben fallar.

## Cómo ejecutarlas

1. Configura `citypulse_backend/.env` con tu `MONGODB_URI` (ver `.env.example`).
2. Arranca el backend guardando el log, porque los "correos" del MVP solo se escriben ahí:
   ```bash
   cd citypulse_backend
   ./mvnw spring-boot:run > backend.log 2>&1
   ```
3. En otra terminal (necesita `pip install pymongo dnspython`):
   ```bash
   python3 pruebas/pruebas_api.py backend.log
   ```

El script espera una base **vacía**: si la ejecutas dos veces, los registros fallarán con 409 porque los usuarios ya existen. Para repetirlas, vacía antes la base `citypulse_db` desde Atlas (*Browse Collections*).

## Qué cubre (98 verificaciones)

| Área | Casos |
|---|---|
| Autenticación | Registro, verificación de correo, perfil, login, login con Google (pendiente), correo duplicado, contraseña corta, correo inválido, token inválido |
| Recuperación de contraseña | Solicitud, restablecimiento, login con la clave nueva, reutilización del token |
| Categorías | Crear, duplicada, vacía, renombrar, desactivar, listar activas |
| Solicitudes de Organizador | Crear, validación, listar pendientes, aprobar, rechazar con y sin motivo, aprobar una ya procesada |
| Eventos | Crear (URL, WhatsApp, formulario), fechas inválidas, fecha pasada, sin título, editar, editar ajeno, ocultar, cancelar, eliminar, panel y calendario |
| Descubrimiento | Grid ordenado por fecha, filtros por categoría, modalidad y rango, filtro vacío, detalle, evento inexistente |
| Favoritos | Agregar, duplicado, listar, quitar, organizador sin favoritos |

## Resultado (23 nov 2026, contra MongoDB Atlas)

- Primera ejecución: **97/98**. Falló el orden de los resultados filtrados.
- Se corrigió en `EventoServiceImpl.filtrar` (commit `fix(eventos): ordenar por fecha de inicio los resultados del filtro`) y se verificó de nuevo: **98/98**.

## Datos de demostración que quedan en la base

| Cuenta | Rol | Contraseña |
|---|---|---|
| admin@citypulse.co (Santiago Rivas) | Administrador | `CityPulse2026` |
| laura.gomez@citypulse.co | Asistente | `CityPulse2026` |
| daniela.rosero@colectivogaleras.org (Colectivo Galeras) | Organizador | `CityPulse2026` |
| andres.benavides@produccionessur.co (Producciones Sur S.A.S.) | Organizador | `CityPulse2026` |
| valentina.erazo@pasto.gov.co | Asistente (solicitud rechazada) | `CityPulse2026` |
| felipe.guerrero@artelibre.org | Asistente (solicitud pendiente) | `CityPulse2026` |

Eventos de diciembre 2026: Feria Navideña Emprendedora (5 dic), Noche de Velitas en la Plaza (7 dic, oculto), Taller Virtual de Fotografía Navideña (12 dic, cancelado), Novena Navideña Comunitaria (16 dic) y Concierto de Fin de Año 2026 (28 dic).

Son cuentas ficticias solo para demostración. No uses estas contraseñas en un despliegue real.

## Hallazgos pendientes (no corregidos)

1. **No hay control de roles**: cualquiera puede aprobar solicitudes o crear categorías enviando un `X-Admin-Id` o `X-Organizador-Id` cualquiera (incumple RNF-011).
2. **Contraseñas en Base64**, no en hash seguro (incumple RNF-009, que pide Argon2id o bcrypt).
3. **El login no exige correo verificado** (incumple HU001: "no puede iniciar sesión hasta confirmar su correo").
4. **La recuperación revela si el correo existe**: responde 404 a correos no registrados en vez de un mensaje genérico (incumple HU004).
5. **El token de login es Base64 de `id:rol`**, no un JWT firmado (incumple RNF-010).
6. **No existe endpoint para crear administradores**; el script lo inserta directamente en MongoDB.
