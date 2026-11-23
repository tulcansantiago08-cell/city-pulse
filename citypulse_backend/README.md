# City Pulse — API Backend

**Autor:** Santiago Rivas

Backend REST de la plataforma **City Pulse**, una cartelera digital mobile-first donde organizadores publican eventos locales y asistentes los descubren, guardan y comparten.

---

## Tabla de contenidos

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura y estructura del proyecto](#3-arquitectura-y-estructura-del-proyecto)
4. [Modelo de dominio](#4-modelo-de-dominio)
5. [Roles de usuario](#5-roles-de-usuario)
6. [Referencia de la API](#6-referencia-de-la-api)
7. [Canales de inscripción](#7-canales-de-inscripción)
8. [Estado de los eventos](#8-estado-de-los-eventos)
9. [Manejo de errores](#9-manejo-de-errores)
10. [Configuración y variables de entorno](#10-configuración-y-variables-de-entorno)
11. [Cómo ejecutar el proyecto](#11-cómo-ejecutar-el-proyecto)
12. [Decisiones de diseño](#12-decisiones-de-diseño)
13. [Pendientes para producción](#13-pendientes-para-producción)

---

## 1. Descripción del proyecto

City Pulse conecta a tres tipos de actores:

| Actor | Qué hace |
|-------|----------|
| **Asistente** | Descubre eventos en el grid, guarda favoritos, es redirigido al canal de inscripción externo |
| **Organizador** | Publica y gestiona eventos (universidad, alcaldía, empresa, grupo local) |
| **Administrador** | Aprueba o rechaza solicitudes de rol Organizador y gestiona categorías |

La plataforma no maneja inscripciones directas: redirige al canal que el organizador configure (URL, WhatsApp o formulario externo).

---

## 2. Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Java | 17 | Lenguaje principal |
| Spring Boot | 3.5.14 | Framework base |
| Spring Web | — | API REST |
| Spring Data MongoDB | — | Persistencia NoSQL |
| Spring Boot Validation | — | Validaciones Jakarta |
| Lombok | — | Reducción de boilerplate |
| MongoDB Atlas | — | Base de datos en la nube |

---

## 3. Arquitectura y estructura del proyecto

El proyecto sigue una **arquitectura en capas estricta** con separación total entre responsabilidades:

```
src/main/java/com/citypulse/
│
├── controller/          # Recibe peticiones HTTP, delega al service, retorna ResponseEntity
├── service/             # Interfaces del dominio (contratos)
│   └── impl/            # Implementaciones con la lógica de negocio
├── repository/          # Interfaces MongoRepository (acceso a datos)
├── model/               # Documentos MongoDB (@Document)
├── dto/
│   ├── request/         # Objetos de entrada (con validaciones Jakarta)
│   └── response/        # Objetos de salida (nunca expone modelos directamente)
├── enums/               # Enumeraciones del dominio
└── exception/           # Excepciones personalizadas + handler global
```

**Principios SOLID aplicados:**
- **SRP** — cada clase tiene una única responsabilidad; los controllers no tienen lógica de negocio.
- **OCP** — `CanalInscripcion` es extensible sin modificar código existente (patrón Strategy).
- **DIP** — los services dependen de interfaces, no de implementaciones concretas (ej. `NotificacionService`).

---

## 4. Modelo de dominio

### Colecciones en MongoDB

| Colección | Documento | Descripción |
|-----------|-----------|-------------|
| `usuarios` | `Usuario` (+ subclases) | Asistentes, Organizadores y Administradores en una sola colección |
| `eventos` | `Evento` | Eventos con eliminación lógica |
| `categorias` | `Categoria` | Categorías de eventos (con baja lógica) |
| `solicitudes_organizador` | `SolicitudOrganizador` | Solicitudes de cambio de rol |

### Jerarquía de Usuario (herencia polimórfica)

```
Usuario (abstracto)
├── Asistente        → tiene lista de Favorito[] embebidos
├── Organizador      → tiene OrganizacionInfo embebido
└── Administrador    → sin campos adicionales
```

Todos se guardan en la colección `usuarios`. Spring Data MongoDB discrimina el tipo mediante el campo `_class`.

### Objetos embebidos (no son colecciones)

- **`OrganizacionInfo`** — datos de la entidad organizadora (nombre, tipo, teléfono, web, dirección).
- **`Favorito`** — referencia a un eventoId con fecha de guardado, embebido en `Asistente`.
- **`CanalInscripcion`** — canal de inscripción polimórfico (ver sección 7).

---

## 5. Roles de usuario

| Rol | Descripción |
|-----|-------------|
| `ASISTENTE` | Rol por defecto al registrarse. Puede explorar eventos y gestionar favoritos. |
| `ORGANIZADOR` | Aprobado por un Administrador. Puede crear y gestionar sus propios eventos. |
| `ADMINISTRADOR` | Gestiona solicitudes de rol y categorías. |

Un `ASISTENTE` solicita el rol de `ORGANIZADOR` enviando datos de su organización. Un `ADMINISTRADOR` revisa y aprueba o rechaza la solicitud. Al aprobarla, el documento del asistente se convierte en `Organizador` preservando su ID.

---

## 6. Referencia de la API

Base URL: `http://localhost:8080/api/v1`

> **Seguridad.** Los endpoints protegidos exigen `Authorization: Bearer <token>` con el JWT que devuelve `POST /auth/login` (firmado con HS256, válido 24 horas).
> - Sin token, o con un token inválido o vencido: **401**.
> - Con un rol que no tiene permiso: **403**.
> - El rol se consulta en la base en cada petición, así que un Organizador recién aprobado tiene permisos de inmediato.
> - Las contraseñas se guardan con **BCrypt** (coste 12) y para iniciar sesión hay que haber verificado el correo.

---

### Autenticación — `/auth`

| Método | Ruta | Body | Respuesta | Descripción |
|--------|------|------|-----------|-------------|
| `POST` | `/auth/registro` | `RegistroUsuarioRequest` | `201 UsuarioResponse` | Registra un nuevo asistente |
| `POST` | `/auth/login` | `LoginRequest` | `200 { token }` | Inicia sesión con correo y contraseña |
| `POST` | `/auth/login/google` | `LoginGoogleRequest` | `200 { token }` | Login con OAuth de Google |
| `GET` | `/auth/verificar/{token}` | — | `200` | Verifica el correo del usuario |
| `POST` | `/auth/recuperar-password` | `RecuperarPasswordRequest` | `200` | Envía enlace de recuperación |
| `POST` | `/auth/restablecer-password` | `RestablecerPasswordRequest` | `200` | Aplica la nueva contraseña |

**Ejemplo — Registro:**
```json
POST /api/v1/auth/registro
{
  "correo": "juan@ejemplo.com",
  "password": "miPassword123"
}
```

---

### Usuarios — `/usuarios`

| Método | Ruta | Header requerido | Descripción |
|--------|------|-----------------|-------------|
| `GET` | `/usuarios/{id}` | — | Obtiene perfil de usuario |
| `PUT` | `/usuarios/{id}/perfil` | — | Edita nombre, apellido y foto |
| `POST` | `/usuarios/{id}/solicitar-rol-organizador` | — | Crea solicitud de rol Organizador |

**Ejemplo — Solicitar rol Organizador:**
```json
POST /api/v1/usuarios/{id}/solicitar-rol-organizador
{
  "nombreEntidad": "Universidad Nacional",
  "tipo": "UNIVERSIDAD",
  "telefonoContacto": "+573001234567",
  "sitioWeb": "https://unal.edu.co",
  "direccion": "Carrera 45 # 26-85, Bogotá"
}
```

Tipos de organización válidos: `UNIVERSIDAD`, `ALCALDIA`, `EMPRESA`, `GRUPO_LOCAL`

---

### Eventos — `/eventos`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `GET` | `/eventos` | Público | Lista pública con filtros opcionales, ordenada por fecha |
| `GET` | `/eventos/{id}` | Público | Detalle del evento (incrementa clics) |
| `POST` | `/eventos` | Organizador | Crea un nuevo evento |
| `PUT` | `/eventos/{id}` | Organizador dueño | Edita un evento |
| `DELETE` | `/eventos/{id}` | Organizador dueño | Eliminación lógica |
| `PATCH` | `/eventos/{id}/visibilidad?oculto=true` | Organizador dueño | Oculta o publica el evento |
| `PATCH` | `/eventos/{id}/cancelar` | Organizador dueño | Cancela el evento |
| `GET` | `/eventos/organizador/{organizadorId}` | El propio organizador o Admin | Panel del organizador |
| `GET` | `/eventos/organizador/{organizadorId}/calendario?mes=12&anio=2026` | El propio organizador o Admin | Vista de calendario mensual |

**Filtros disponibles en `GET /eventos`:**

| Query param | Tipo | Ejemplo |
|-------------|------|---------|
| `categoriaId` | String | `?categoriaId=abc123` |
| `modalidad` | `PRESENCIAL` \| `VIRTUAL` | `?modalidad=VIRTUAL` |
| `fechaDesde` | ISO-8601 | `?fechaDesde=2026-06-01T00:00:00` |
| `fechaHasta` | ISO-8601 | `?fechaHasta=2026-06-30T23:59:59` |

**Ejemplo — Crear evento:**
```json
POST /api/v1/eventos
Authorization: Bearer <token_del_organizador>

{
  "titulo": "Feria de Emprendimiento 2026",
  "descripcion": "Exposición de proyectos estudiantiles.",
  "categoriaId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "fechaInicio": "2026-07-15T09:00:00",
  "fechaFin": "2026-07-15T17:00:00",
  "modalidad": "PRESENCIAL",
  "flyerUrl": "https://cdn.ejemplo.com/flyer.jpg",
  "precio": null,
  "canalInscripcion": {
    "tipo": "WHATSAPP",
    "destino": "573001234567",
    "mensajePredefinido": "Hola, quiero inscribirme a la Feria de Emprendimiento"
  }
}
```

---

### Favoritos — `/usuarios/{asistenteId}/favoritos`

Solo el propio Asistente (`Authorization: Bearer <token>`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/usuarios/{asistenteId}/favoritos` | Lista favoritos con estado actual de cada evento |
| `POST` | `/usuarios/{asistenteId}/favoritos/{eventoId}` | Agrega evento a favoritos |
| `DELETE` | `/usuarios/{asistenteId}/favoritos/{eventoId}` | Elimina evento de favoritos |

---

### Categorías — `/categorias`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/categorias` | Lista categorías activas (público) |
| `POST` | `/categorias` | Crea categoría (solo Admin) |
| `PUT` | `/categorias/{id}?nombre=NuevoNombre` | Modifica nombre (solo Admin) |
| `DELETE` | `/categorias/{id}` | Desactiva categoría (solo Admin) |

---

### Administración — `/admin`

Todo `/admin` es solo para Administradores (`Authorization: Bearer <token>`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/admin/solicitudes-organizador` | Lista solicitudes pendientes |
| `POST` | `/admin/solicitudes-organizador/{id}/aprobar` | Aprueba y promueve al usuario |
| `POST` | `/admin/solicitudes-organizador/{id}/rechazar` | Rechaza con motivo (obligatorio) |
| `POST` | `/admin/administradores` | Crea otra cuenta de Administrador |

El **primer** administrador se crea al arrancar si la base no tiene ninguno y están definidas `ADMIN_CORREO` y `ADMIN_PASSWORD` (ver `.env.example`).

**Ejemplo — Rechazar solicitud:**
```json
POST /api/v1/admin/solicitudes-organizador/{id}/rechazar
Authorization: Bearer <token_del_admin>

{
  "motivo": "La información de la organización está incompleta."
}
```

---

## 7. Canales de inscripción

Cada evento define un canal al que se redirige al asistente. El campo `tipo` discrimina la subclase:

### URL directa
```json
{
  "tipo": "URL",
  "destino": "https://eventbrite.com/mi-evento"
}
```

### WhatsApp
```json
{
  "tipo": "WHATSAPP",
  "destino": "573001234567",
  "mensajePredefinido": "Hola, quiero inscribirme al evento"
}
```
La URL resultante tiene el formato `https://wa.me/573001234567?text=...`

### Formulario externo
```json
{
  "tipo": "FORMULARIO",
  "destino": "https://forms.google.com/mi-formulario",
  "proveedor": "Google Forms"
}
```

---

## 8. Estado de los eventos

El estado **no se persiste** en la base de datos. Se calcula dinámicamente en cada consulta según las fechas y banderas del evento:

| Estado | Condición |
|--------|-----------|
| `PROXIMO` | `publicado=true`, `cancelado=false`, `ahora < fechaInicio` |
| `EN_CURSO` | `publicado=true`, `cancelado=false`, `fechaInicio <= ahora <= fechaFin` |
| `FINALIZADO` | `publicado=true`, `cancelado=false`, `ahora > fechaFin` |
| `CANCELADO` | `cancelado=true` |
| `OCULTO` | `publicado=false` o `eliminado=true` |

---


## 9. Cómo ejecutar el proyecto

### Requisitos previos

- Java 17 o superior
- Maven 3.8+ (o usar el wrapper incluido `mvnw`)
- Acceso a una instancia de MongoDB (local o Atlas)

> **Configuración (`.env`).** Copia `.env.example` como `.env` dentro de `citypulse_backend/` y completa:
> - `MONGODB_URI`: tu cadena de conexión de MongoDB Atlas. Si no la defines, se usa `mongodb://localhost:27017/citypulse_db`.
> - `JWT_SECRET`: clave de al menos 256 bits para firmar los tokens (`openssl rand -base64 64`).
> - `ADMIN_CORREO` / `ADMIN_PASSWORD` (opcional): crea el primer administrador si la base no tiene ninguno.
>
> El archivo `.env` está en `.gitignore` y nunca se sube a GitHub.

### Pasos

**1. Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd citypulse_backend
```

**2. Compilar el proyecto**
```bash
./mvnw compile        # Linux / macOS
.\mvnw.cmd compile    # Windows
```

**3. Ejecutar la aplicación**
```bash
./mvnw spring-boot:run        # Linux / macOS
.\mvnw.cmd spring-boot:run    # Windows
```

La API quedará disponible en: `http://localhost:8080`

**4. Verificar que esté activa**
```bash
curl http://localhost:8080/api/v1/categorias
```

### Configuración del IDE (IntelliJ IDEA)

Si aparece el error `package jakarta.validation.constraints does not exist` en el IDE:

1. Abrir el panel **Maven** (Vista → Tool Windows → Maven).
2. Hacer clic en **Reload All Maven Projects** (`Ctrl+Shift+O` en Windows).
3. Esperar a que se descarguen las dependencias.

---
