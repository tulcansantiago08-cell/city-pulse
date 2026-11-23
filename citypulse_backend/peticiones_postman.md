# Colección de Peticiones API - City Pulse Backend

**Autor:** Santiago Rivas

Flujo completo de peticiones HTTP para probar el backend de **City Pulse** en Postman. Todas las rutas fueron verificadas contra la API real (ver [`pruebas/README.md`](pruebas/README.md)).

> **Variables de Postman**
> - `{{base_url}}` = `http://localhost:8080/api/v1`
> - `{{usuario_id}}`, `{{organizador_id}}`, `{{categoria_id}}`, `{{evento_id}}`, `{{solicitud_id}}`: los `id` que devuelve cada respuesta.
> - `{{token}}`, `{{token_organizador}}`, `{{token_admin}}`: el JWT que devuelve el login de cada cuenta.
>
> **Autenticación:** las rutas protegidas exigen la cabecera `Authorization: Bearer {{token}}`. En Postman: pestaña **Authorization → Bearer Token**. Sin token responde **401**; con un rol sin permiso, **403**. El token dura 24 horas.

---

## 1. Autenticación (público)

### 1.1. Registrar usuario (queda como Asistente)
```http
POST {{base_url}}/auth/registro
Content-Type: application/json

{
  "correo": "laura.gomez@citypulse.co",
  "password": "CityPulse2026"
}
```
**201** con el usuario creado. El token de verificación aparece en el log del backend (`[NOTIFICACION] Verificación de correo`). Hasta verificar el correo, el login responde **403**.

### 1.2. Verificar correo
```http
GET {{base_url}}/auth/verificar/{{token_verificacion}}
```

### 1.3. Iniciar sesión
```http
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "correo": "laura.gomez@citypulse.co",
  "password": "CityPulse2026"
}
```
**200** `{ "token": "<jwt>", "tipo": "Bearer" }` · **401** si las credenciales son incorrectas · **403** si el correo no está verificado.

### 1.4. Iniciar sesión con Google (pendiente de integración)
```http
POST {{base_url}}/auth/login/google
Content-Type: application/json

{ "tokenOAuth": "..." }
```
Hoy responde **401**.

### 1.5. Recuperar y restablecer contraseña
```http
POST {{base_url}}/auth/recuperar-password
Content-Type: application/json

{ "correo": "laura.gomez@citypulse.co" }
```
Siempre responde **200** con el mismo mensaje, exista o no el correo.
```http
POST {{base_url}}/auth/restablecer-password
Content-Type: application/json

{
  "token": "{{token_recuperacion}}",
  "nuevaPassword": "CityPulse2026Nueva"
}
```

---

## 2. Usuarios

Cada usuario solo puede ver y editar su propia cuenta (el administrador puede consultar cualquiera).

### 2.1. Consultar usuario
```http
GET {{base_url}}/usuarios/{{usuario_id}}
Authorization: Bearer {{token}}
```

### 2.2. Editar perfil
```http
PUT {{base_url}}/usuarios/{{usuario_id}}/perfil
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "Laura",
  "apellido": "Gómez",
  "fotoPerfilUrl": "https://citypulse.co/fotos/laura.jpg"
}
```

### 2.3. Solicitar el rol de Organizador
```http
POST {{base_url}}/usuarios/{{usuario_id}}/solicitar-rol-organizador
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombreEntidad": "Colectivo Galeras",
  "tipo": "GRUPO_LOCAL",
  "telefonoContacto": "+57 312 456 7890",
  "sitioWeb": "https://colectivogaleras.org",
  "direccion": "Plazoleta UCC, Pasto"
}
```
`tipo`: `UNIVERSIDAD`, `ALCALDIA`, `EMPRESA` o `GRUPO_LOCAL`.

---

## 3. Administración

Todas estas rutas son solo para Administradores. El primer administrador se crea al arrancar con `ADMIN_CORREO` y `ADMIN_PASSWORD` (ver `.env.example`).

### 3.1. Listar solicitudes pendientes
```http
GET {{base_url}}/admin/solicitudes-organizador
Authorization: Bearer {{token_admin}}
```

### 3.2. Aprobar solicitud
```http
POST {{base_url}}/admin/solicitudes-organizador/{{solicitud_id}}/aprobar
Authorization: Bearer {{token_admin}}
```

### 3.3. Rechazar solicitud (motivo obligatorio)
```http
POST {{base_url}}/admin/solicitudes-organizador/{{solicitud_id}}/rechazar
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{ "motivo": "Falta el documento que acredite a la entidad." }
```

### 3.4. Categorías
```http
GET {{base_url}}/categorias
```
```http
POST {{base_url}}/categorias
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{ "nombre": "Cultura" }
```
```http
PUT {{base_url}}/categorias/{{categoria_id}}?nombre=Salud y Bienestar
Authorization: Bearer {{token_admin}}
```
```http
DELETE {{base_url}}/categorias/{{categoria_id}}
Authorization: Bearer {{token_admin}}
```
El `DELETE` desactiva la categoría (eliminación lógica).

### 3.5. Crear otro administrador
```http
POST {{base_url}}/admin/administradores
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{
  "correo": "coordinacion@citypulse.co",
  "password": "CityPulse2026",
  "nombre": "Coordinación",
  "apellido": "City Pulse"
}
```

---

## 4. Eventos (Organizador)

### 4.1. Crear evento
```http
POST {{base_url}}/eventos
Authorization: Bearer {{token_organizador}}
Content-Type: application/json

{
  "titulo": "Novena Navideña Comunitaria",
  "descripcion": "Celebremos la novena de aguinaldos con villancicos, natilla y buñuelos.",
  "categoriaId": "{{categoria_id}}",
  "fechaInicio": "2026-12-16T19:00:00",
  "fechaFin": "2026-12-16T21:00:00",
  "modalidad": "PRESENCIAL",
  "precio": null,
  "canalInscripcion": {
    "tipo": "WHATSAPP",
    "destino": "+573124567890",
    "mensajePredefinido": "Hola, quiero inscribirme a la novena"
  }
}
```
`canalInscripcion.tipo`: `URL` (`destino`), `WHATSAPP` (`destino`, `mensajePredefinido`) o `FORMULARIO` (`destino`, `proveedor`). Sin `precio`, el evento es gratuito.

### 4.2. Editar evento
```http
PUT {{base_url}}/eventos/{{evento_id}}
Authorization: Bearer {{token_organizador}}
Content-Type: application/json
```
Mismo cuerpo que al crear. **403** si el evento es de otro organizador.

### 4.3. Ocultar / mostrar, cancelar y eliminar
```http
PATCH {{base_url}}/eventos/{{evento_id}}/visibilidad?oculto=true
Authorization: Bearer {{token_organizador}}
```
```http
PATCH {{base_url}}/eventos/{{evento_id}}/cancelar
Authorization: Bearer {{token_organizador}}
```
```http
DELETE {{base_url}}/eventos/{{evento_id}}
Authorization: Bearer {{token_organizador}}
```

### 4.4. Panel del organizador (solo el propio organizador o un admin)
```http
GET {{base_url}}/eventos/organizador/{{organizador_id}}
Authorization: Bearer {{token_organizador}}
```
```http
GET {{base_url}}/eventos/organizador/{{organizador_id}}/calendario?mes=12&anio=2026
Authorization: Bearer {{token_organizador}}
```

---

## 5. Descubrimiento (público)

### 5.1. Grid de eventos (ordenado por fecha)
```http
GET {{base_url}}/eventos
```

### 5.2. Filtrar (parámetros combinables)
```http
GET {{base_url}}/eventos?categoriaId={{categoria_id}}&modalidad=PRESENCIAL&fechaDesde=2026-12-01T00:00:00&fechaHasta=2026-12-31T23:59:59
```

### 5.3. Detalle (suma un clic de intención de inscripción)
```http
GET {{base_url}}/eventos/{{evento_id}}
```

---

## 6. Favoritos (solo el propio Asistente)

```http
POST {{base_url}}/usuarios/{{usuario_id}}/favoritos/{{evento_id}}
Authorization: Bearer {{token}}
```
```http
GET {{base_url}}/usuarios/{{usuario_id}}/favoritos
Authorization: Bearer {{token}}
```
```http
DELETE {{base_url}}/usuarios/{{usuario_id}}/favoritos/{{evento_id}}
Authorization: Bearer {{token}}
```
