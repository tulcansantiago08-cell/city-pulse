# Probar City Pulse en Postman

**Autor:** Santiago Rivas

Esta carpeta tiene todo lo necesario para probar la API en Postman:

| Archivo | Qué es |
|---|---|
| `CityPulse.postman_collection.json` | La colección: 41 peticiones en 6 carpetas, con pruebas automáticas |
| `CityPulse.postman_environment.json` | El entorno: guarda la dirección del backend (`base_url`) |
| `generar_coleccion.py` | Script que vuelve a generar los dos archivos si cambia la API |

---

## Paso 1. Arrancar el backend

En la Terminal:

```bash
cd /Users/santiago/Desktop/ProyectoFinal/citypulse_backend && ./mvnw spring-boot:run
```

Está listo cuando aparece `Started CityPulseApplication`. **Deja esa ventana abierta** mientras pruebas. Para detenerlo: `Ctrl + C`.

## Paso 2. Importar la colección y el entorno

1. Abre Postman y pulsa **Import** (arriba a la izquierda).
2. Arrastra los dos archivos `.json` de esta carpeta y pulsa **Import**.
3. Arriba a la derecha, en el selector de entornos (dice *No environment*), elige **City Pulse - Local**.

A la izquierda aparecerá la colección **City Pulse API** con 6 carpetas.

## Paso 3. Probar petición por petición

Abre las carpetas **en orden** y pulsa **Send** en cada petición:

| Carpeta | Qué prueba | Quién |
|---|---|---|
| 1. Público | Categorías, grid de eventos, filtros, detalle | Sin iniciar sesión |
| 2. Autenticación | Login de las 3 cuentas, registro, errores de seguridad | — |
| 3. Organizador | Crear, editar y ver eventos en el panel | Daniela |
| 4. Asistente | Perfil y favoritos | Laura |
| 5. Organizador: ocultar y cancelar | Cambiar el estado del evento creado en la carpeta 3 | Daniela |
| 6. Administrador | Solicitudes, categorías, crear administradores | Admin |

**No tienes que copiar tokens ni ids.** Cuando haces login en la carpeta 2, la colección guarda sola el token de cada cuenta y lo usa en las siguientes peticiones. Igual con los ids: el evento que creas en la carpeta 3 se usa en las carpetas 4 y 5.

> Haz primero la carpeta **2. Autenticación**: sin esos logins, las rutas protegidas responden 401.

## Paso 4. Ver los resultados de las pruebas

Cada petición trae pruebas automáticas. Después de pulsar **Send**:

1. En la parte de abajo (la respuesta), abre la pestaña **Test Results**.
2. Verás cada prueba en verde (**PASS**) o rojo (**FAIL**). Ejemplos:
   - `Responde 201`: el evento se creó.
   - `Responde 403`: un asistente no puede crear eventos, y está bien que falle.
   - `El token es de rol ORGANIZADOR`: el login devolvió el rol correcto.

Las peticiones que dicen **"(debe fallar)"** comprueban que la seguridad funciona: la prueba pasa cuando la API **rechaza** la operación con el código correcto (400, 401, 403, 404 o 409).

Para ver las pruebas que tiene una petición, ábrela y entra en la pestaña **Scripts → Post-response**.

## Paso 5. Ejecutar todo de una vez

1. Pasa el ratón sobre **City Pulse API**, pulsa los tres puntos **⋯** y elige **Run collection**.
2. Deja todo marcado y pulsa **Run City Pulse API**.
3. Postman ejecuta las 41 peticiones en orden y muestra el resumen. Resultado esperado: **60 pruebas, todas en verde**.

Se puede ejecutar cuantas veces quieras: los datos que crea llevan una marca de tiempo (`{{marca}}`) para no repetirse, y el evento de prueba se elimina al final de la carpeta 5.

---

## Cuentas de demostración

Todas usan la contraseña `CityPulse2026`.

| Correo | Rol |
|---|---|
| `admin@citypulse.co` | Administrador |
| `daniela.rosero@colectivogaleras.org` | Organizador (Colectivo Galeras) |
| `andres.benavides@produccionessur.co` | Organizador (Producciones Sur) |
| `laura.gomez@citypulse.co` | Asistente |

## Hacer tus propias peticiones

1. Duplica una petición (clic derecho → **Duplicate**) y cámbiala.
2. Para las rutas protegidas, en la pestaña **Authorization** elige **Bearer Token** y escribe `{{token_asistente}}`, `{{token_organizador}}` o `{{token_admin}}`.
3. El resto de rutas, con ejemplos, está en [`../peticiones_postman.md`](../peticiones_postman.md).

## Códigos de respuesta

| Código | Significa |
|---|---|
| 200 / 201 / 204 | Correcto (consultado / creado / eliminado) |
| 400 | Datos inválidos (campo vacío, fechas al revés…) |
| 401 | No has iniciado sesión o el token venció (dura 24 h): vuelve a correr la carpeta 2 |
| 403 | Tu rol no tiene permiso, o el correo no está verificado |
| 404 | No existe |
| 409 | Ya existe (correo o categoría repetidos) |

## Si algo falla

- **`Could not send request` / `ECONNREFUSED`**: el backend no está corriendo (paso 1).
- **Todo responde 401**: no elegiste el entorno *City Pulse - Local*, o no ejecutaste la carpeta 2.
- **Una cuenta nueva no puede iniciar sesión (403)**: primero verifica el correo. El token aparece en la Terminal del backend (`[NOTIFICACION] Verificación de correo … token=…`); úsalo en `GET {{base_url}}/auth/verificar/<token>`.
