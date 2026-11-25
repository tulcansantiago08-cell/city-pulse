# City Pulse

**Autor:** Santiago Rivas

City Pulse es una plataforma web mobile-first de eventos locales: instituciones, empresas y colectivos publican sus eventos, y los asistentes los descubren en una cartelera y se inscriben por el canal externo que defina cada organizador (formulario, página web o WhatsApp).

## Contenido del repositorio

| Carpeta / archivo | Descripción |
|---|---|
| [`citypulse_backend/`](citypulse_backend/) | API REST en Java 17 + Spring Boot + MongoDB. Ver su [README](citypulse_backend/README.md). |
| [`citypulse_frontend/`](citypulse_frontend/) | SPA mobile-first en React + Vite conectada a la API. Ver su [README](citypulse_frontend/README.md), con la tabla de dónde está cada acción en el código. |
| [`CityPulse.pdf`](CityPulse.pdf) / [`CityPulse.docx`](CityPulse.docx) | Documento del proyecto: requisitos funcionales y no funcionales, historias de usuario, wireframes y diagramas UML. |
| [`wireframes_CityPulse/`](wireframes_CityPulse/) | Pantallas de la aplicación (13 wireframes). |
| [`Diagramas/`](Diagramas/) | Diagramas UML (contexto, componentes, clases, desarrollo y despliegue) en imagen y en Visual Paradigm (`.vpp`). |

## Ejecutar el backend

```bash
cd citypulse_backend
export MONGODB_URI="mongodb+srv://<usuario>:<contraseña>@<cluster>/citypulse_db"   # opcional; por defecto usa MongoDB local
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

## Ejecutar el frontend

En otra Terminal, con el backend ya corriendo:

```bash
cd citypulse_frontend
npm install   # solo la primera vez
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.
