#!/usr/bin/env python3
"""Genera la colección y el entorno de Postman de City Pulse.

    python3 postman/generar_coleccion.py

Crea CityPulse.postman_collection.json y CityPulse.postman_environment.json en esta carpeta.
La colección se puede ejecutar completa (Run collection) cuantas veces se quiera: los datos
que crea llevan una marca de tiempo para no chocar con ejecuciones anteriores.

Autor: Santiago Rivas
"""
import json
import uuid
from pathlib import Path

AQUI = Path(__file__).resolve().parent
PASS = "CityPulse2026"


def status(codigo, nombre=None):
    return f'pm.test("{nombre or "Responde " + str(codigo)}", () => pm.response.to.have.status({codigo}));'


def req(nombre, metodo, ruta, *, token=None, body=None, tests=(), pre=None, desc=""):
    item = {
        "name": nombre,
        "request": {
            "method": metodo,
            "header": [],
            "url": {"raw": "{{base_url}}" + ruta, "host": ["{{base_url}}"],
                    "path": [p for p in ruta.split("?")[0].strip("/").split("/")]},
            "description": desc,
        },
        "event": [],
    }
    if "?" in ruta:
        q = ruta.split("?", 1)[1]
        item["request"]["url"]["query"] = [{"key": k, "value": v} for k, v in (p.split("=", 1) for p in q.split("&"))]
    if token:
        item["request"]["auth"] = {"type": "bearer", "bearer": [{"key": "token", "value": "{{" + token + "}}", "type": "string"}]}
    else:
        item["request"]["auth"] = {"type": "noauth"}
    if body is not None:
        item["request"]["header"].append({"key": "Content-Type", "value": "application/json"})
        item["request"]["body"] = {"mode": "raw", "raw": json.dumps(body, ensure_ascii=False, indent=2),
                                   "options": {"raw": {"language": "json"}}}
    if tests:
        item["event"].append({"listen": "test", "script": {"type": "text/javascript", "exec": list(tests)}})
    if pre:
        item["event"].append({"listen": "prerequest", "script": {"type": "text/javascript", "exec": list(pre)}})
    return item


def carpeta(nombre, desc, items):
    return {"name": nombre, "description": desc, "item": items}


GUARDAR_SESION = [
    "const token = pm.response.json().token;",
    "pm.test('Devuelve un JWT', () => pm.expect(token.split('.').length).to.eql(3));",
    "const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');",
    "return { token, datos: JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4))) };",
]


def login(nombre, correo, var_token, var_id, rol):
    return req(nombre, "POST", "/auth/login", body={"correo": correo, "password": PASS}, tests=[
        status(200),
        "const sesion = (() => {", *["  " + l for l in GUARDAR_SESION], "})();",
        f"pm.test('El token es de rol {rol}', () => pm.expect(sesion.datos.rol).to.eql('{rol}'));",
        f"pm.collectionVariables.set('{var_token}', sesion.token);",
        f"pm.collectionVariables.set('{var_id}', sesion.datos.sub);",
    ], desc=f"Inicia sesión y guarda el token en `{var_token}` y el id en `{var_id}`.")


evento_nuevo = {
    "titulo": "Taller de Faroles Navideños {{marca}}",
    "descripcion": "Aprende a hacer faroles de papel para la Noche de Velitas.",
    "categoriaId": "{{categoria_id}}",
    "fechaInicio": "2026-12-06T15:00:00",
    "fechaFin": "2026-12-06T17:00:00",
    "modalidad": "PRESENCIAL",
    "precio": None,
    "canalInscripcion": {"tipo": "WHATSAPP", "destino": "+573124567890",
                         "mensajePredefinido": "Hola, quiero inscribirme al taller de faroles"},
}

coleccion = {
    "info": {
        "_postman_id": str(uuid.uuid5(uuid.NAMESPACE_URL, "citypulse-coleccion")),
        "name": "City Pulse API",
        "description": ("Colección de pruebas de la API de City Pulse (autor: Santiago Rivas).\n\n"
                        "1. Arranca el backend (`./mvnw spring-boot:run`).\n"
                        "2. Selecciona el entorno **City Pulse - Local**.\n"
                        "3. Ejecuta las carpetas en orden, o toda la colección con **Run collection**.\n\n"
                        "Los tokens y los ids se guardan solos en las variables de la colección."),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "event": [{"listen": "prerequest", "script": {"type": "text/javascript", "exec": [
        "if (!pm.collectionVariables.get('marca')) pm.collectionVariables.set('marca', Date.now().toString());"]}}],
    "variable": [{"key": k, "value": ""} for k in [
        "marca", "token_asistente", "asistente_id", "token_organizador", "organizador_id",
        "token_admin", "admin_id", "categoria_id", "evento_id", "evento_nuevo_id", "categoria_nueva_id"]],
    "item": [
        carpeta("1. Público (sin iniciar sesión)", "Rutas que cualquiera puede usar.", [
            req("Listar categorías", "GET", "/categorias", tests=[
                status(200),
                "const cats = pm.response.json();",
                "pm.test('Hay categorías activas', () => pm.expect(cats.length).to.be.above(0));",
                "pm.collectionVariables.set('categoria_id', cats[0].id);"]),
            req("Grid de eventos (ordenado por fecha)", "GET", "/eventos", tests=[
                status(200),
                "const evs = pm.response.json();",
                "pm.test('Viene ordenado por fecha', () => {",
                "  const f = evs.map(e => e.fechaInicio);",
                "  pm.expect(f).to.eql([...f].sort());",
                "});",
                "if (evs.length) pm.collectionVariables.set('evento_id', evs[0].id);"]),
            req("Filtrar eventos presenciales de diciembre", "GET",
                "/eventos?modalidad=PRESENCIAL&fechaDesde=2026-12-01T00:00:00&fechaHasta=2026-12-31T23:59:59", tests=[
                status(200),
                "pm.test('Todos son de diciembre 2026', () => pm.response.json().forEach(e => pm.expect(e.fechaInicio.slice(0, 7)).to.eql('2026-12')));"]),
            req("Detalle de un evento", "GET", "/eventos/{{evento_id}}", tests=[
                status(200),
                "pm.test('Trae canal de inscripción', () => pm.expect(pm.response.json().canalInscripcion).to.be.an('object'));"]),
            req("Evento inexistente (debe fallar)", "GET", "/eventos/000000000000000000000000", tests=[status(404, "Responde 404")]),
        ]),
        carpeta("2. Autenticación", "Inicio de sesión de las cuentas de demostración y reglas de seguridad.", [
            login("Login asistente (Laura)", "laura.gomez@citypulse.co", "token_asistente", "asistente_id", "ASISTENTE"),
            login("Login organizador (Daniela)", "daniela.rosero@colectivogaleras.org", "token_organizador", "organizador_id", "ORGANIZADOR"),
            login("Login administrador", "admin@citypulse.co", "token_admin", "admin_id", "ADMINISTRADOR"),
            req("Login con contraseña incorrecta (debe fallar)", "POST", "/auth/login",
                body={"correo": "laura.gomez@citypulse.co", "password": "Equivocada123"}, tests=[status(401)]),
            req("Registrar usuario nuevo", "POST", "/auth/registro",
                body={"correo": "prueba{{marca}}@citypulse.co", "password": PASS}, tests=[
                status(201),
                "pm.test('Queda como ASISTENTE sin verificar', () => {",
                "  pm.expect(pm.response.json().rol).to.eql('ASISTENTE');",
                "  pm.expect(pm.response.json().correoVerificado).to.eql(false);",
                "});"],
                desc="El token de verificación aparece en la Terminal del backend: `[NOTIFICACION] Verificación de correo`."),
            req("Login sin verificar el correo (debe fallar, HU001)", "POST", "/auth/login",
                body={"correo": "prueba{{marca}}@citypulse.co", "password": PASS}, tests=[status(403)]),
            req("Registro con correo repetido (debe fallar)", "POST", "/auth/registro",
                body={"correo": "laura.gomez@citypulse.co", "password": PASS}, tests=[status(409)]),
            req("Registro con contraseña corta (debe fallar)", "POST", "/auth/registro",
                body={"correo": "corta{{marca}}@citypulse.co", "password": "123"}, tests=[status(400)]),
            req("Recuperar contraseña de correo no registrado (respuesta genérica)", "POST", "/auth/recuperar-password",
                body={"correo": "noexiste@citypulse.co"}, tests=[status(200)]),
        ]),
        carpeta("3. Organizador", "Gestión de eventos con la cuenta de Daniela (Colectivo Galeras).", [
            req("Crear evento", "POST", "/eventos", token="token_organizador", body=evento_nuevo, tests=[
                status(201),
                "pm.collectionVariables.set('evento_nuevo_id', pm.response.json().id);",
                "pm.test('Queda como PROXIMO', () => pm.expect(pm.response.json().estado).to.eql('PROXIMO'));"]),
            req("Crear evento sin iniciar sesión (debe fallar)", "POST", "/eventos", body=evento_nuevo, tests=[status(401)]),
            req("Asistente intenta crear evento (debe fallar)", "POST", "/eventos", token="token_asistente",
                body=evento_nuevo, tests=[status(403)]),
            req("Crear evento con fechas invertidas (debe fallar)", "POST", "/eventos", token="token_organizador",
                body={**evento_nuevo, "fechaInicio": "2026-12-06T18:00:00", "fechaFin": "2026-12-06T15:00:00"},
                tests=[status(400)]),
            req("Editar evento (precio)", "PUT", "/eventos/{{evento_nuevo_id}}", token="token_organizador",
                body={**evento_nuevo, "precio": 10000}, tests=[
                status(200),
                "pm.test('Precio actualizado', () => pm.expect(pm.response.json().precio).to.eql(10000));"]),
            req("Mi panel de eventos", "GET", "/eventos/organizador/{{organizador_id}}", token="token_organizador", tests=[
                status(200),
                "pm.test('Incluye el evento nuevo', () => pm.expect(pm.response.json().map(e => e.id)).to.include(pm.collectionVariables.get('evento_nuevo_id')));"]),
            req("Calendario de diciembre 2026", "GET", "/eventos/organizador/{{organizador_id}}/calendario?mes=12&anio=2026",
                token="token_organizador", tests=[status(200)]),
        ]),
        carpeta("4. Asistente", "Favoritos y perfil con la cuenta de Laura.", [
            req("Mi perfil", "GET", "/usuarios/{{asistente_id}}", token="token_asistente", tests=[
                status(200),
                "pm.test('Es Laura', () => pm.expect(pm.response.json().nombre).to.eql('Laura'));"]),
            req("Ver el perfil de otro usuario (debe fallar)", "GET", "/usuarios/{{organizador_id}}", token="token_asistente",
                tests=[status(403)]),
            req("Agregar evento a favoritos", "POST", "/usuarios/{{asistente_id}}/favoritos/{{evento_nuevo_id}}",
                token="token_asistente", tests=[status(201)]),
            req("Agregar el mismo favorito otra vez (debe fallar)", "POST",
                "/usuarios/{{asistente_id}}/favoritos/{{evento_nuevo_id}}", token="token_asistente", tests=[status(400)]),
            req("Listar mis favoritos", "GET", "/usuarios/{{asistente_id}}/favoritos", token="token_asistente", tests=[
                status(200),
                "pm.test('Incluye el evento nuevo', () => pm.expect(pm.response.json().map(e => e.id)).to.include(pm.collectionVariables.get('evento_nuevo_id')));"]),
            req("Quitar de favoritos", "DELETE", "/usuarios/{{asistente_id}}/favoritos/{{evento_nuevo_id}}",
                token="token_asistente", tests=[status(204)]),
        ]),
        carpeta("5. Organizador: ocultar y cancelar", "Cambios de estado del evento creado en la carpeta 3.", [
            req("Ocultar evento", "PATCH", "/eventos/{{evento_nuevo_id}}/visibilidad?oculto=true",
                token="token_organizador", tests=[status(200)]),
            req("El evento oculto no sale en el grid", "GET", "/eventos", tests=[
                status(200),
                "pm.test('No aparece', () => pm.expect(pm.response.json().map(e => e.id)).to.not.include(pm.collectionVariables.get('evento_nuevo_id')));"]),
            req("Volver a mostrar el evento", "PATCH", "/eventos/{{evento_nuevo_id}}/visibilidad?oculto=false",
                token="token_organizador", tests=[status(200)]),
            req("Cancelar evento", "PATCH", "/eventos/{{evento_nuevo_id}}/cancelar", token="token_organizador",
                tests=[status(200)]),
            req("El panel lo muestra CANCELADO", "GET", "/eventos/organizador/{{organizador_id}}", token="token_organizador", tests=[
                status(200),
                "const ev = pm.response.json().find(e => e.id === pm.collectionVariables.get('evento_nuevo_id'));",
                "pm.test('Estado CANCELADO', () => pm.expect(ev.estado).to.eql('CANCELADO'));"]),
            req("Eliminar evento", "DELETE", "/eventos/{{evento_nuevo_id}}", token="token_organizador", tests=[status(204)]),
        ]),
        carpeta("6. Administrador", "Solicitudes, categorías y administradores.", [
            req("Listar solicitudes pendientes", "GET", "/admin/solicitudes-organizador", token="token_admin", tests=[status(200)]),
            req("Asistente intenta ver solicitudes (debe fallar)", "GET", "/admin/solicitudes-organizador",
                token="token_asistente", tests=[status(403)]),
            req("Crear categoría", "POST", "/categorias", token="token_admin", body={"nombre": "Cine {{marca}}"}, tests=[
                status(201),
                "pm.collectionVariables.set('categoria_nueva_id', pm.response.json().id);"]),
            req("Crear categoría repetida (debe fallar)", "POST", "/categorias", token="token_admin",
                body={"nombre": "Cine {{marca}}"}, tests=[status(409)]),
            req("Crear categoría sin iniciar sesión (debe fallar)", "POST", "/categorias",
                body={"nombre": "Teatro {{marca}}"}, tests=[status(401)]),
            req("Renombrar categoría", "PUT", "/categorias/{{categoria_nueva_id}}?nombre=Cine y Series {{marca}}",
                token="token_admin", tests=[status(200)]),
            req("Desactivar categoría", "DELETE", "/categorias/{{categoria_nueva_id}}", token="token_admin", tests=[status(204)]),
            req("Crear otro administrador", "POST", "/admin/administradores", token="token_admin",
                body={"correo": "admin{{marca}}@citypulse.co", "password": PASS, "nombre": "Admin", "apellido": "Pruebas"},
                tests=[status(201), "pm.test('Rol ADMINISTRADOR', () => pm.expect(pm.response.json().rol).to.eql('ADMINISTRADOR'));"]),
        ]),
    ],
}

entorno = {
    "id": str(uuid.uuid5(uuid.NAMESPACE_URL, "citypulse-entorno")),
    "name": "City Pulse - Local",
    "values": [{"key": "base_url", "value": "http://localhost:8080/api/v1", "type": "default", "enabled": True}],
    "_postman_variable_scope": "environment",
}

(AQUI / "CityPulse.postman_collection.json").write_text(json.dumps(coleccion, ensure_ascii=False, indent=2), encoding="utf-8")
(AQUI / "CityPulse.postman_environment.json").write_text(json.dumps(entorno, ensure_ascii=False, indent=2), encoding="utf-8")
total = sum(len(c["item"]) for c in coleccion["item"])
print(f"Colección generada: {len(coleccion['item'])} carpetas, {total} peticiones")
