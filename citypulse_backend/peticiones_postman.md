# Colección de Peticiones API - City Pulse Backend

**Autor:** Santiago Rivas

Flujo completo de peticiones HTTP para probar el backend de **City Pulse** en Postman. Todas las rutas fueron verificadas contra la API real (ver [`pruebas/README.md`](pruebas/README.md)).

> **Variables de Postman**
> - `{{base_url}}` = `http://localhost:8080/api/v1`
> - `{{usuario_id}}`, `{{organizador_id}}`, `{{admin_id}}`, `{{categoria_id}}`, `{{evento_id}}`, `{{solicitud_id}}`: los `id` que devuelve cada respuesta.
>
> **Sobre la identificación:** en este MVP no hay JWT. Las acciones de organizador y administrador se identifican con las cabeceras `X-Organizador-Id` y `X-Admin-Id`, y las de usuario con el `id` en la ruta. El login devuelve un token simple (Base64 de `id:rol`).

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
**201** con el usuario creado. El token de verificación aparece en el log del backend (`[NOTIFICACION] Verificación de correo`).

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
**200** `{ "token": "..." }` · **401** si las credenciales son incorrectas.

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

### 2.1. Consultar usuario
```http
GET {{base_url}}/usuarios/{{usuario_id}}
```

### 2.2. Editar perfil
```http
PUT {{base_url}}/usuarios/{{usuario_id}}/perfil
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

### 3.1. Listar solicitudes pendientes
```http
GET {{base_url}}/admin/solicitudes-organizador
```

### 3.2. Aprobar solicitud
```http
POST {{base_url}}/admin/solicitudes-organizador/{{solicitud_id}}/aprobar
X-Admin-Id: {{admin_id}}
```

### 3.3. Rechazar solicitud (motivo obligatorio)
```http
POST {{base_url}}/admin/solicitudes-organizador/{{solicitud_id}}/rechazar
X-Admin-Id: {{admin_id}}
Content-Type: application/json

{ "motivo": "Falta el documento que acredite a la entidad." }
```

### 3.4. Categorías
```http
GET {{base_url}}/categorias
```
```http
POST {{base_url}}/categorias
Content-Type: application/json

{ "nombre": "Cultura" }
```
```http
PUT {{base_url}}/categorias/{{categoria_id}}?nombre=Salud y Bienestar
```
```http
DELETE {{base_url}}/categorias/{{categoria_id}}
```
El `DELETE` desactiva la categoría (eliminación lógica).

---

## 4. Eventos (Organizador)

### 4.1. Crear evento
```http
POST {{base_url}}/eventos
X-Organizador-Id: {{organizador_id}}
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
X-Organizador-Id: {{organizador_id}}
Content-Type: application/json
```
Mismo cuerpo que al crear. **403** si el evento es de otro organizador.

### 4.3. Ocultar / mostrar, cancelar y eliminar
```http
PATCH {{base_url}}/eventos/{{evento_id}}/visibilidad?oculto=true
X-Organizador-Id: {{organizador_id}}
```
```http
PATCH {{base_url}}/eventos/{{evento_id}}/cancelar
X-Organizador-Id: {{organizador_id}}
```
```http
DELETE {{base_url}}/eventos/{{evento_id}}
X-Organizador-Id: {{organizador_id}}
```

### 4.4. Panel del organizador
```http
GET {{base_url}}/eventos/organizador/{{organizador_id}}
```
```http
GET {{base_url}}/eventos/organizador/{{organizador_id}}/calendario?mes=12&anio=2026
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

## 6. Favoritos (Asistente)

```http
POST {{base_url}}/usuarios/{{usuario_id}}/favoritos/{{evento_id}}
```
```http
GET {{base_url}}/usuarios/{{usuario_id}}/favoritos
```
```http
DELETE {{base_url}}/usuarios/{{usuario_id}}/favoritos/{{evento_id}}
```
