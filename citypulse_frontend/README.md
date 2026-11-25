# City Pulse — Frontend

**Autor:** Santiago Rivas

SPA mobile-first en **React 18 + Vite**, construida a partir de los wireframes de `wireframes_CityPulse/` y conectada a la API REST de `citypulse_backend/` (Spring Boot + MongoDB Atlas). Es el artefacto *SPA Frontend (Mobile-First)* del diagrama de despliegue y los tres paneles del paquete *Frontend* del diagrama de componentes.

---

## Cómo ejecutarlo

Se necesitan **dos Terminales abiertas**:

```bash
# Terminal 1: backend (puerto 8080)
cd /Users/santiago/Desktop/ProyectoFinal/citypulse_backend
./mvnw spring-boot:run
```

```bash
# Terminal 2: frontend (puerto 5173)
cd /Users/santiago/Desktop/ProyectoFinal/citypulse_frontend
npm install        # solo la primera vez
npm run dev
```

Abre **http://localhost:5173**. Para verlo como celular: en el navegador, `Cmd + Opción + I` y activa la vista de dispositivo móvil.

Cuentas de demostración (contraseña `CityPulse2026`):

| Correo | Rol | Pantalla al entrar |
|---|---|---|
| `laura.gomez@citypulse.co` | Asistente | Inicio (cartelera) |
| `daniela.rosero@colectivogaleras.org` | Organizador | Mi panel |
| `admin@citypulse.co` | Administrador | Solicitudes |

---

## Cómo se conecta con el backend

```
Pantalla (pages/*.jsx)  →  función de api/*.js  →  cliente.js (fetch + token)  →  /api/v1/...  →  Controller del backend
```

- **`vite.config.js`**: el *proxy* reenvía todo lo que empieza por `/api` a `http://localhost:8080`. Por eso no hace falta configurar CORS en el backend.
- **`src/api/cliente.js`**: hace todas las peticiones. Agrega `Authorization: Bearer <token>` (lo que lee `AutorizacionInterceptor`) y convierte los errores del backend (`ApiErrorResponse`) en mensajes.
- **`src/api/*.js`**: **un archivo por controlador** del backend:

| Archivo del frontend | Controlador del backend |
|---|---|
| `api/authApi.js` | `AuthController.java` |
| `api/eventosApi.js` | `EventoController.java` |
| `api/categoriasApi.js` | `CategoriaController.java` |
| `api/usuariosApi.js` | `UsuarioController.java` + `FavoritoController.java` |
| `api/adminApi.js` | `AdminController.java` |

- **`src/context/SesionContext.jsx`**: guarda el JWT y lee su contenido (`sub` = id, `rol`, `correo`, `exp`) para saber quién está conectado y qué menú mostrar.
- **`src/components/RutaProtegida.jsx`**: oculta las pantallas según el rol (el equivalente a `@RequiereRol`). La seguridad de verdad la vuelve a hacer el backend: aunque alguien se salte esta pantalla, recibe 401/403.

---

## Estructura de carpetas

```
citypulse_frontend/
├── index.html                  Página base (carga src/main.jsx)
├── vite.config.js              Puerto 5173 y proxy /api → backend
└── src/
    ├── main.jsx                Arranca React, el enrutador y la sesión
    ├── App.jsx                 MAPA DE RUTAS: qué URL abre qué pantalla y qué rol necesita
    ├── estilos.css             Estilos (colores y formas de los wireframes)
    ├── api/                    Llamadas HTTP al backend (una por endpoint)
    ├── context/SesionContext.jsx  Login, logout y datos del JWT
    ├── components/             Piezas reutilizables
    │   ├── BarraNavegacion.jsx    Menú inferior (cambia según el rol)
    │   ├── TarjetaEvento.jsx      Tarjeta del grid de eventos
    │   ├── RutaProtegida.jsx      Bloquea pantallas por rol
    │   ├── useFavoritos.js        Guardar / quitar favoritos
    │   ├── IconoGuardar.jsx       Icono del marcador
    │   └── Comunes.jsx            Avisos, cargando, confirmación, botón volver
    ├── utils/formato.js        Fechas, precios, estados, enlace de inscripción
    └── pages/
        ├── publico/            Panel de Eventos (sin iniciar sesión)
        ├── auth/               Iniciar sesión, registro, verificación, recuperación
        ├── asistente/          Guardados, perfil, ser organizador
        ├── organizador/        Panel del Organizador
        └── admin/              Panel de Administración
```

---

## ¿Dónde está cada acción? (para la sustentación)

### Público (cualquiera, sin sesión)

| Acción en pantalla | Archivo del frontend | Función → Endpoint | Backend |
|---|---|---|---|
| Ver el grid de eventos | `pages/publico/Inicio.jsx` | `listarEventos()` → `GET /eventos` | `EventoController.listar` → `EventoService.listarPublicosOrdenadosPorFecha` |
| Chips de categorías | `pages/publico/Inicio.jsx` (`elegirCategoria`) | `listarCategorias()` → `GET /categorias`; filtra con `GET /eventos?categoriaId=` | `CategoriaController.listar`, `EventoService.filtrar` |
| Barra "Buscar eventos…" | `pages/publico/Inicio.jsx` (`visibles`) | Filtra por título en el navegador | — |
| Botón ⚙️ y "Ver resultados" | `pages/publico/Filtrar.jsx` (`aplicar`) | Vuelve a Inicio con `?modalidad=&fechaDesde=&fechaHasta=` → `GET /eventos?...` | `EventoService.filtrar(FiltroEventoRequest)` |
| Abrir un evento | `components/TarjetaEvento.jsx` (`abrir`) → `pages/publico/DetalleEvento.jsx` | `obtenerEvento(id)` → `GET /eventos/{id}` | `EventoController.detalle` (suma 1 a `contadorClics`) |
| Botón "Inscribirme ↗" | `pages/publico/DetalleEvento.jsx` + `utils/formato.js` (`enlaceInscripcion`) | Abre el canal externo (URL, formulario o `wa.me`) | Igual que `redirigir()` en `CanalURL` / `CanalFormulario` / `CanalWhatsApp` |
| Botón 🔗 compartir | `pages/publico/DetalleEvento.jsx` (`compartir`) | Copia el enlace | — |

### Autenticación

| Acción | Archivo | Función → Endpoint | Backend |
|---|---|---|---|
| Iniciar sesión | `pages/auth/IniciarSesion.jsx` (`enviar`) → `context/SesionContext.jsx` (`iniciarSesion`) | `POST /auth/login` | `AuthController.login` → `JwtService.generar` |
| Aviso "Verifica tu correo" | `pages/auth/IniciarSesion.jsx` | El backend responde **403** | `AutenticacionServiceImpl.iniciarSesion` (HU001) |
| Crear cuenta | `pages/auth/CrearCuenta.jsx` (`enviar`) | `POST /auth/registro` | `AuthController.registrar` |
| Verificar correo | `pages/auth/VerificarCorreo.jsx` | `GET /auth/verificar/{token}` | `AuthController.verificar` |
| ¿Olvidaste tu contraseña? | `pages/auth/RecuperarContrasena.jsx` (`pedirEnlace`, `cambiar`) | `POST /auth/recuperar-password`, `POST /auth/restablecer-password` | `AuthController.recuperar` / `restablecer` |
| Cerrar sesión | `pages/asistente/Perfil.jsx` (`salir`) | Borra el token del navegador | — (JWT *stateless*) |

### Asistente

| Acción | Archivo | Función → Endpoint | Backend |
|---|---|---|---|
| Guardar / quitar 🔖 | `components/useFavoritos.js` (`alternar`) | `POST` / `DELETE /usuarios/{id}/favoritos/{eventoId}` | `FavoritoController.agregar` / `remover` |
| Pestaña Guardados | `pages/asistente/Guardados.jsx` | `GET /usuarios/{id}/favoritos` | `FavoritoController.listar` |
| Ver y editar perfil | `pages/asistente/Perfil.jsx` (`guardar`) | `GET /usuarios/{id}`, `PUT /usuarios/{id}/perfil` | `UsuarioController.obtener` / `editar` |
| Quiero ser organizador | `pages/asistente/SerOrganizador.jsx` (`enviar`) | `POST /usuarios/{id}/solicitar-rol-organizador` | `UsuarioController.solicitarRol` |

### Organizador

| Acción | Archivo | Función → Endpoint | Backend |
|---|---|---|---|
| Mi panel (lista y métricas) | `pages/organizador/MiPanel.jsx` (`cargarEventos`) | `GET /eventos/organizador/{id}` | `EventoController.listarPorOrganizador` |
| Calendario del mes | `pages/organizador/MiPanel.jsx` (`cargarCalendario`) | `GET /eventos/organizador/{id}/calendario?mes&anio` | `EventoService.obtenerCalendarioMensual` |
| Botón + / "Publicar evento" | `pages/organizador/FormularioEvento.jsx` (`enviar`, `armarCuerpo`) | `POST /eventos` | `EventoController.crear` (`CrearEventoRequest`) |
| ✏️ Editar | `pages/organizador/FormularioEvento.jsx` | `PUT /eventos/{id}` | `EventoController.editar` |
| 🙈 Ocultar / 👁️ Mostrar | `pages/organizador/MiPanel.jsx` (`alternarVisibilidad`) | `PATCH /eventos/{id}/visibilidad?oculto=` | `EventoController.cambiarVisibilidad` |
| ⛔ Cancelar | `pages/organizador/MiPanel.jsx` (`ejecutarConfirmacion`) | `PATCH /eventos/{id}/cancelar` | `EventoController.cancelar` |
| 🗑️ Eliminar | `pages/organizador/MiPanel.jsx` (`ejecutarConfirmacion`) | `DELETE /eventos/{id}` | `EventoController.eliminar` (borrado lógico) |

### Administrador

| Acción | Archivo | Función → Endpoint | Backend |
|---|---|---|---|
| Ver solicitudes pendientes | `pages/admin/Solicitudes.jsx` (`cargar`) | `GET /admin/solicitudes-organizador` (+ `GET /usuarios/{id}` para el nombre) | `AdminController.listarPendientes` |
| ✓ Aprobar | `pages/admin/Solicitudes.jsx` (`aprobar`) | `POST /admin/solicitudes-organizador/{id}/aprobar` | `SolicitudOrganizadorServiceImpl.aprobar` |
| ✕ Rechazar (con motivo) | `pages/admin/Solicitudes.jsx` (`rechazar`) | `POST /admin/solicitudes-organizador/{id}/rechazar` | `SolicitudOrganizadorServiceImpl.rechazar` |
| Crear / renombrar / desactivar categoría | `pages/admin/Categorias.jsx` (`crear`, `guardarNombre`, `confirmarDesactivar`) | `POST`, `PUT ?nombre=`, `DELETE /categorias/{id}` | `CategoriaController.crear` / `modificar` / `eliminar` |
| Crear administrador | `pages/admin/Administradores.jsx` (`enviar`) | `POST /admin/administradores` | `AdminController.crearAdministrador` |

---

## Cómo cambiar algo (ejemplos típicos)

- **Un texto o un botón de una pantalla** → el archivo de esa pantalla en `src/pages/`. Guarda y el navegador se actualiza solo.
- **Colores o tamaños** → `src/estilos.css` (los colores están arriba, en `:root`).
- **Una ruta nueva** → crea la pantalla en `src/pages/...` y añádela en `src/App.jsx`.
- **Un endpoint nuevo del backend** → añade una función en el `src/api/*.js` de su controlador y úsala en la pantalla.
- **Un campo nuevo del evento** (por ejemplo `direccion`) → backend: `Evento.java`, `CrearEventoRequest.java`, `EventoResponse.java`; frontend: `FormularioEvento.jsx` (`VACIO`, `armarCuerpo` y un `<input>`) y `DetalleEvento.jsx` para mostrarlo.

---

## Limitaciones de esta versión (coinciden con el backend)

- **Google**: el botón está desactivado porque `/auth/login/google` aún no está implementado.
- **Correos**: los enlaces de verificación y recuperación se escriben en la Terminal del backend (`[NOTIFICACION] …`); el frontend permite pegar el código.
- **Flyer**: no hay endpoint para subir archivos, así que se pega el enlace de la imagen. Sin flyer, la tarjeta usa un degradado de color.
- **Solicitudes**: el backend solo lista las **pendientes**, así que no hay pestañas de aprobadas ni rechazadas.
- **Dirección del evento** y **"Inscritos"**: los wireframes los muestran, pero el modelo del backend no tiene esos datos.
- **Rol nuevo**: cuando el administrador aprueba una solicitud, el usuario debe cerrar sesión y volver a entrar para recibir un token con el rol `ORGANIZADOR`.
