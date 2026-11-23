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
   python3 pruebas/pruebas_api.py backend.log --reiniciar
   ```

`--reiniciar` vacía primero la base `citypulse_db` (usuarios, categorías, eventos y solicitudes) y vuelve a cargar los datos de demostración. Sin esa opción, el script espera una base vacía.

También hay pruebas unitarias de seguridad (`PasswordHasherTest`, `JwtServiceTest`):
```bash
./mvnw test
```

## Qué cubre (119 verificaciones)

| Área | Casos |
|---|---|
| Autenticación | Registro, verificación de correo, login con JWT (id, rol y 24 h), login sin verificar, login con Google (pendiente), correo duplicado, contraseña corta, correo inválido |
| Seguridad y roles | Sin token (401), token falso (401), rol sin permiso (403), acceso a la cuenta de otro usuario (403), contraseñas guardadas con BCrypt |
| Recuperación de contraseña | Solicitud, correo no registrado con respuesta genérica, restablecimiento, login con la clave nueva, reutilización del token |
| Administración | Crear otro administrador; un asistente no puede |
| Categorías | Crear, duplicada, vacía, renombrar, desactivar, listar activas |
| Solicitudes de Organizador | Crear, validación, pedirla por otra persona, listar pendientes, aprobar, rechazar con y sin motivo, aprobar una ya procesada |
| Eventos | Crear (URL, WhatsApp, formulario), asistente no puede crear, fechas inválidas, fecha pasada, sin título, editar, editar ajeno, ocultar, cancelar, eliminar, panel, panel ajeno y calendario |
| Descubrimiento | Grid ordenado por fecha, filtros por categoría, modalidad y rango, filtro vacío, detalle, evento inexistente |
| Favoritos | Agregar, duplicado, listar, quitar, organizador sin favoritos, favoritos de otra persona |

## Resultados (23 nov 2026, contra MongoDB Atlas)

1. Primera ejecución: **97/98**. Falló el orden de los resultados filtrados; se corrigió en `EventoServiceImpl.filtrar`.
2. Se corrigieron los 6 problemas de seguridad que encontraron las pruebas (ver abajo).
3. Ejecución final sobre una base vacía: **119/119**, y 8/8 pruebas unitarias.

## Datos de demostración que quedan en la base

| Cuenta | Rol | Contraseña |
|---|---|---|
| admin@citypulse.co (Santiago Rivas) | Administrador | `CityPulse2026` |
| coordinacion@citypulse.co | Administrador | `CityPulse2026` |
| laura.gomez@citypulse.co | Asistente | `CityPulse2026` |
| daniela.rosero@colectivogaleras.org (Colectivo Galeras) | Organizador | `CityPulse2026` |
| andres.benavides@produccionessur.co (Producciones Sur S.A.S.) | Organizador | `CityPulse2026` |
| valentina.erazo@pasto.gov.co | Asistente (solicitud rechazada) | `CityPulse2026` |
| felipe.guerrero@artelibre.org | Asistente (solicitud pendiente) | `CityPulse2026` |
| sin.verificar@citypulse.co | Asistente sin verificar (no puede iniciar sesión) | `CityPulse2026` |

Eventos de diciembre 2026: Feria Navideña Emprendedora (5 dic), Noche de Velitas en la Plaza (7 dic, oculto), Taller Virtual de Fotografía Navideña (12 dic, cancelado), Novena Navideña Comunitaria (16 dic) y Concierto de Fin de Año 2026 (28 dic).

Son cuentas ficticias solo para demostración. No uses estas contraseñas en un despliegue real.

## Problemas de seguridad corregidos

| # | Problema | Corrección |
|---|---|---|
| 1 | Sin control de roles: bastaba con enviar `X-Admin-Id` o `X-Organizador-Id` (RNF-011) | JWT obligatorio en rutas protegidas: 401 sin token, 403 sin rol. La identidad sale del token y cada cuenta solo opera sobre sí misma |
| 2 | Contraseñas en Base64 (RNF-009) | BCrypt con coste 12; las antiguas se migran solas en el siguiente login |
| 3 | Login sin correo verificado (HU001) | El login responde 403 hasta verificar el correo |
| 4 | La recuperación revelaba si el correo existía (HU004) | Siempre responde 200 con el mismo mensaje |
| 5 | Token de login en Base64 de `id:rol` (RNF-010) | JWT firmado HS256 con clave de `JWT_SECRET` (≥ 256 bits), válido 24 horas |
| 6 | No se podían crear administradores | `POST /api/v1/admin/administradores` y administrador inicial con `ADMIN_CORREO`/`ADMIN_PASSWORD` |

## Pendiente

- El login con Google sigue sin integrarse (responde 401).
- Los tokens de verificación y recuperación aún no vencen a los 60 minutos que piden HU001 y HU004.
