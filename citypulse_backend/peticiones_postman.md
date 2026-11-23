# Colección de Peticiones API - City Pulse Backend

Este documento detalla el flujo completo de peticiones HTTP para probar el backend del proyecto **City Pulse**, ideal para importar o copiar en Postman.

> **Nota:** Reemplaza `{{base_url}}` por la URL de tu servidor local (ej: `http://localhost:8080/api`) y `{{token}}` por el JWT devuelto en el Login. Los IDs (`{{usuario_id}}`, `{{evento_id}}`, etc.) deben reemplazarse por los generados en la base de datos.

---

## 1. Flujo de Autenticación (Público)

### 1.1. Registrar un nuevo usuario (Asistente por defecto)
```http
POST {{base_url}}/auth/registrar
Content-Type: application/json

{
  "correo": "usuario@ejemplo.com",
  "password": "Password123!",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```

### 1.2. Iniciar Sesión (Login)
```http
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "correo": "usuario@ejemplo.com",
  "password": "Password123!"
}
```
> **Respuesta esperada:** Un token JWT que debe usarse en las siguientes peticiones en el header `Authorization: Bearer {{token}}`.

---

## 2. Flujo de Solicitud de Rol Organizador (Asistente)

### 2.1. Solicitar convertirse en organizador
```http
POST {{base_url}}/usuarios/{{usuario_id}}/solicitar-rol
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombreEntidad": "Productora de Eventos XYZ",
  "tipo": "EMPRESA",
  "telefonoContacto": "+123456789",
  "sitioWeb": "https://xyz.com",
  "direccion": "Calle Falsa 123"
}
```

---

## 3. Flujo de Administrador (Aprobación y Gestión)

*(Requiere estar logueado con un usuario que tenga Rol ADMIN)*

### 3.1. Listar solicitudes de organizador pendientes
```http
GET {{base_url}}/admin/solicitudes
Authorization: Bearer {{admin_token}}
```

### 3.2. Aprobar solicitud de organizador
```http
POST {{base_url}}/admin/solicitudes/{{solicitud_id}}/aprobar
Authorization: Bearer {{admin_token}}
```
> El usuario que hizo la solicitud ahora tiene rol `ORGANIZADOR`.

### 3.3. Crear una nueva categoría
```http
POST {{base_url}}/categorias
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "nombre": "Conciertos"
}
```

---

## 4. Flujo de Gestión de Eventos (Organizador)

*(Requiere estar logueado con el usuario que ahora es ORGANIZADOR)*

### 4.1. Crear un Evento
```http
POST {{base_url}}/eventos
Authorization: Bearer {{organizador_token}}
Content-Type: application/json

{
  "titulo": "Gran Concierto de Rock",
  "descripcion": "Un concierto increíble con bandas locales.",
  "categoriaId": "{{categoria_id}}",
  "fechaInicio": "2026-06-15T20:00:00",
  "fechaFin": "2026-06-15T23:59:00",
  "modalidad": "PRESENCIAL",
  "precio": 50.00,
  "canalInscripcion": {
    "tipo": "URL",
    "destino": "https://tickets.com/concierto"
  }
}
```

### 4.2. Editar un Evento
```http
PUT {{base_url}}/eventos/{{evento_id}}
Authorization: Bearer {{organizador_token}}
Content-Type: application/json

{
  "titulo": "Gran Concierto de Rock (Actualizado)",
  "descripcion": "Más bandas confirmadas.",
  "categoriaId": "{{categoria_id}}",
  "fechaInicio": "2026-06-15T20:00:00",
  "fechaFin": "2026-06-15T23:59:00",
  "modalidad": "PRESENCIAL",
  "precio": 60.00,
  "flyerUrl": "https://s3.amazonaws.com/flyer.jpg",
  "canalInscripcion": {
    "tipo": "URL",
    "destino": "https://tickets.com/concierto"
  }
}
```

### 4.3. Listar los eventos creados por este organizador
```http
GET {{base_url}}/eventos/organizador/{{usuario_id}}
Authorization: Bearer {{organizador_token}}
```

---

## 5. Flujo del Asistente (Exploración y Favoritos)

### 5.1. Listar todos los eventos públicos (Catálogo)
```http
GET {{base_url}}/eventos
```

### 5.2. Filtrar eventos (Por categoría, fecha, etc.)
```http
POST {{base_url}}/eventos/filtrar
Content-Type: application/json

{
  "categoriaId": "{{categoria_id}}",
  "modalidad": "PRESENCIAL",
  "fechaDesde": "2026-06-01T00:00:00",
  "fechaHasta": "2026-06-30T23:59:59"
}
```

### 5.3. Ver detalle de un Evento específico
```http
GET {{base_url}}/eventos/{{evento_id}}
```

### 5.4. Agregar un evento a Favoritos
```http
POST {{base_url}}/favoritos/{{evento_id}}
Authorization: Bearer {{token_asistente}}
```

### 5.5. Listar mis eventos favoritos
```http
GET {{base_url}}/favoritos
Authorization: Bearer {{token_asistente}}
```

### 5.6. Remover evento de Favoritos
```http
DELETE {{base_url}}/favoritos/{{evento_id}}
Authorization: Bearer {{token_asistente}}
```

---

## 6. Flujos Adicionales

### 6.1. Editar Perfil de Usuario
```http
PUT {{base_url}}/usuarios/{{usuario_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "fotoPerfilUrl": "https://mi-foto.com/perfil.jpg"
}
```

### 6.2. Recuperar Contraseña
```http
POST {{base_url}}/auth/recuperar
Content-Type: application/json

{
  "correo": "usuario@ejemplo.com"
}
```
