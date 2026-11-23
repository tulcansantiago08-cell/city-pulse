#!/usr/bin/env python3
"""Pruebas de punta a punta de la API de City Pulse contra la base configurada en .env.

Carga datos de ejemplo de City Pulse (usuarios, categorías, solicitudes y eventos de
diciembre 2026) y verifica cada endpoint, incluidos los casos que deben fallar.

Uso (con el backend corriendo en http://localhost:8080):
    python3 pruebas/pruebas_api.py <ruta-al-log-del-backend> [--reiniciar]

--reiniciar vacía antes la base citypulse_db (usuarios, categorías, eventos y solicitudes).

El log se usa para leer los tokens de verificación y recuperación que el backend
"envía" por correo (en el MVP solo se escriben en el log).

Autor: Santiago Rivas
"""
import base64
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "http://localhost:8080/api/v1"
LOG = Path(sys.argv[1]) if len(sys.argv) > 1 else None
REINICIAR = "--reiniciar" in sys.argv
ENV = Path(__file__).resolve().parent.parent / ".env"
PASSWORD_DEMO = "CityPulse2026"   # contraseña de las cuentas de demostración

resultados = []


def req(metodo, ruta, cuerpo=None, headers=None, params=None):
    url = BASE + ruta + ("?" + urllib.parse.urlencode(params) if params else "")
    data = json.dumps(cuerpo).encode() if cuerpo is not None else None
    h = {"Content-Type": "application/json", **(headers or {})}
    r = urllib.request.Request(url, data=data, headers=h, method=metodo)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except ValueError:
            return e.code, txt


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def prueba(nombre, metodo, ruta, esperado, **kw):
    codigo, cuerpo = req(metodo, ruta, **kw)
    ok = codigo == esperado
    detalle = "" if ok else f" → {cuerpo.get('message') if isinstance(cuerpo, dict) else cuerpo}"
    resultados.append((ok, nombre, metodo, ruta, esperado, codigo, detalle))
    print(f"{'✅' if ok else '❌'} [{codigo}] {nombre}{detalle}")
    return cuerpo


def verificar(nombre, condicion, detalle=""):
    resultados.append((bool(condicion), nombre, "—", "—", "ok", "ok" if condicion else "falla", detalle))
    print(f"{'✅' if condicion else '❌'} {nombre}{'' if condicion else ' → ' + detalle}")


def token_del_log(tipo, correo):
    """Busca en el log el último token de 'Verificación' o 'Recuperación' enviado a un correo."""
    for _ in range(20):
        texto = LOG.read_text(encoding="utf-8", errors="ignore")
        hallados = re.findall(rf"{tipo}[^→]*→ {re.escape(correo)} \| token=([0-9a-f-]+)", texto)
        if hallados:
            return hallados[-1]
        time.sleep(0.5)
    return None


def base_datos():
    from pymongo import MongoClient
    uri = next(l.split("=", 1)[1] for l in ENV.read_text().splitlines() if l.startswith("MONGODB_URI="))
    return MongoClient(uri)["citypulse_db"]


def crear_admin():
    """Crea el primer administrador directamente en MongoDB (equivale a ADMIN_CORREO/ADMIN_PASSWORD).
    Se guarda con el formato antiguo para comprobar además la migración a BCrypt en su primer login."""
    db = base_datos()
    correo = "admin@citypulse.co"
    db.usuarios.update_one({"correo": correo}, {"$setOnInsert": {
        "_class": "com.citypulse.model.Administrador",
        "correo": correo,
        "passwordHash": base64.b64encode(PASSWORD_DEMO.encode()).decode(),
        "nombre": "Santiago", "apellido": "Rivas",
        "correoVerificado": True, "rol": "ADMINISTRADOR",
    }}, upsert=True)
    return str(db.usuarios.find_one({"correo": correo})["_id"])


def main():
    if REINICIAR:
        db = base_datos()
        for coleccion in ["usuarios", "categorias", "eventos", "solicitudes_organizador"]:
            db[coleccion].delete_many({})
        print("Base citypulse_db vaciada.\n")

    print("=== 1. Autenticación ===")
    usuarios = {
        "laura":     ("laura.gomez@citypulse.co", "Laura", "Gómez"),
        "daniela":   ("daniela.rosero@colectivogaleras.org", "Daniela", "Rosero"),
        "andres":    ("andres.benavides@produccionessur.co", "Andrés", "Benavides"),
        "valentina": ("valentina.erazo@pasto.gov.co", "Valentina", "Erazo"),
        "felipe":    ("felipe.guerrero@artelibre.org", "Felipe", "Guerrero"),
    }
    ids, tok = {}, {}
    for clave, (correo, nombre, apellido) in usuarios.items():
        cuerpo = prueba(f"Registrar a {nombre} {apellido}", "POST", "/auth/registro", 201,
                        cuerpo={"correo": correo, "password": PASSWORD_DEMO})
        ids[clave] = cuerpo["id"]
        token = token_del_log("Verificación", correo)
        prueba(f"Verificar correo de {nombre}", "GET", f"/auth/verificar/{token}", 200)
        tok[clave] = prueba(f"Login de {nombre}", "POST", "/auth/login", 200,
                            cuerpo={"correo": correo, "password": PASSWORD_DEMO})["token"]
        prueba(f"Completar perfil de {nombre}", "PUT", f"/usuarios/{ids[clave]}/perfil", 200,
               cuerpo={"nombre": nombre, "apellido": apellido}, headers=bearer(tok[clave]))

    prueba("Registro con correo duplicado (debe fallar)", "POST", "/auth/registro", 409,
           cuerpo={"correo": usuarios["laura"][0], "password": PASSWORD_DEMO})
    prueba("Registro con contraseña de 5 caracteres (debe fallar)", "POST", "/auth/registro", 400,
           cuerpo={"correo": "corta@citypulse.co", "password": "12345"})
    prueba("Registro con correo inválido (debe fallar)", "POST", "/auth/registro", 400,
           cuerpo={"correo": "no-es-correo", "password": PASSWORD_DEMO})
    login = prueba("Login de Laura", "POST", "/auth/login", 200,
                   cuerpo={"correo": usuarios["laura"][0], "password": PASSWORD_DEMO})
    partes = login["token"].split(".")
    carga = json.loads(base64.urlsafe_b64decode(partes[1] + "=" * (-len(partes[1]) % 4)))
    verificar("El login devuelve un JWT firmado con el id y rol de Laura, válido 24 h",
              len(partes) == 3 and carga["sub"] == ids["laura"] and carga["rol"] == "ASISTENTE"
              and carga["exp"] - carga["iat"] == 24 * 3600, str(carga))
    prueba("Registrar usuario que no verificará su correo", "POST", "/auth/registro", 201,
           cuerpo={"correo": "sin.verificar@citypulse.co", "password": PASSWORD_DEMO})
    prueba("Login sin verificar el correo (debe fallar, HU001)", "POST", "/auth/login", 403,
           cuerpo={"correo": "sin.verificar@citypulse.co", "password": PASSWORD_DEMO})
    prueba("Login con contraseña incorrecta (debe fallar)", "POST", "/auth/login", 401,
           cuerpo={"correo": usuarios["laura"][0], "password": "Equivocada123"})
    prueba("Login con Google (pendiente de integración, debe fallar)", "POST", "/auth/login/google", 401,
           cuerpo={"tokenOAuth": "token-de-prueba"})
    prueba("Verificar con token inválido (debe fallar)", "GET", "/auth/verificar/token-falso", 401)
    perfil = prueba("Consultar perfil de Laura", "GET", f"/usuarios/{ids['laura']}", 200, headers=bearer(tok["laura"]))
    verificar("El perfil de Laura tiene nombre, apellido y correo verificado",
              perfil["nombre"] == "Laura" and perfil["apellido"] == "Gómez" and perfil["correoVerificado"])
    prueba("Consultar perfil sin iniciar sesión (debe fallar)", "GET", f"/usuarios/{ids['laura']}", 401)
    prueba("Consultar perfil con token falso (debe fallar)", "GET", f"/usuarios/{ids['laura']}", 401,
           headers=bearer("abc.def.ghi"))
    prueba("Laura consulta el perfil de Daniela (debe fallar)", "GET", f"/usuarios/{ids['daniela']}", 403,
           headers=bearer(tok["laura"]))
    prueba("Laura edita el perfil de Daniela (debe fallar)", "PUT", f"/usuarios/{ids['daniela']}/perfil", 403,
           headers=bearer(tok["laura"]), cuerpo={"nombre": "X", "apellido": "Y"})

    print("\n=== 2. Recuperación de contraseña ===")
    prueba("Solicitar recuperación para Laura", "POST", "/auth/recuperar-password", 200,
           cuerpo={"correo": usuarios["laura"][0]})
    token = token_del_log("Recuperación", usuarios["laura"][0])
    prueba("Restablecer contraseña con el token", "POST", "/auth/restablecer-password", 200,
           cuerpo={"token": token, "nuevaPassword": "CityPulse2026Nueva"})
    prueba("Login con la contraseña nueva", "POST", "/auth/login", 200,
           cuerpo={"correo": usuarios["laura"][0], "password": "CityPulse2026Nueva"})
    prueba("Recuperar con correo no registrado responde igual (HU004)", "POST", "/auth/recuperar-password", 200,
           cuerpo={"correo": "noexiste@citypulse.co"})
    prueba("Reusar el mismo token (debe fallar)", "POST", "/auth/restablecer-password", 401,
           cuerpo={"token": token, "nuevaPassword": "OtraClave2026"})
    prueba("Volver a la contraseña de demostración", "POST", "/auth/recuperar-password", 200,
           cuerpo={"correo": usuarios["laura"][0]})
    prueba("Restablecer a la contraseña de demostración", "POST", "/auth/restablecer-password", 200,
           cuerpo={"token": token_del_log("Recuperación", usuarios["laura"][0]), "nuevaPassword": PASSWORD_DEMO})

    print("\n=== 3. Administración: categorías ===")
    admin_id = crear_admin()
    tok["admin"] = prueba("Login del administrador (migra su contraseña a BCrypt)", "POST", "/auth/login", 200,
                          cuerpo={"correo": "admin@citypulse.co", "password": PASSWORD_DEMO})["token"]
    hash_admin = base_datos().usuarios.find_one({"correo": "admin@citypulse.co"})["passwordHash"]
    verificar("La contraseña del administrador quedó guardada con BCrypt", hash_admin.startswith("$2a$12$"))
    adm = bearer(tok["admin"])
    prueba("Crear categoría sin iniciar sesión (debe fallar)", "POST", "/categorias", 401, cuerpo={"nombre": "Cine"})
    prueba("Laura (asistente) crea categoría (debe fallar)", "POST", "/categorias", 403,
           cuerpo={"nombre": "Cine"}, headers=bearer(tok["laura"]))
    prueba("El admin crea otro administrador", "POST", "/admin/administradores", 201, headers=adm,
           cuerpo={"correo": "coordinacion@citypulse.co", "password": PASSWORD_DEMO,
                   "nombre": "Coordinación", "apellido": "City Pulse"})
    prueba("Laura intenta crear un administrador (debe fallar)", "POST", "/admin/administradores", 403,
           headers=bearer(tok["laura"]),
           cuerpo={"correo": "falso@citypulse.co", "password": PASSWORD_DEMO, "nombre": "X", "apellido": "Y"})
    cat = {}
    for nombre in ["Cultura", "Música", "Tecnología", "Deportes", "Gastronomía", "Salud"]:
        cat[nombre] = prueba(f"Crear categoría {nombre}", "POST", "/categorias", 201,
                             cuerpo={"nombre": nombre}, headers=adm)["id"]
    prueba("Crear categoría duplicada 'Música' (debe fallar)", "POST", "/categorias", 409,
           cuerpo={"nombre": "Música"}, headers=adm)
    prueba("Crear categoría sin nombre (debe fallar)", "POST", "/categorias", 400, cuerpo={"nombre": ""}, headers=adm)
    prueba("Renombrar 'Salud' a 'Salud y Bienestar'", "PUT", f"/categorias/{cat['Salud']}", 200,
           params={"nombre": "Salud y Bienestar"}, headers=adm)
    prueba("Desactivar categoría 'Deportes'", "DELETE", f"/categorias/{cat['Deportes']}", 204, headers=adm)
    activas = prueba("Listar categorías activas", "GET", "/categorias", 200)
    nombres = {c["nombre"] for c in activas}
    verificar("'Deportes' ya no aparece y 'Salud y Bienestar' sí",
              "Deportes" not in nombres and "Salud y Bienestar" in nombres, str(nombres))

    print("\n=== 4. Solicitudes de rol Organizador ===")
    solicitudes = {
        "daniela":   {"nombreEntidad": "Colectivo Galeras", "tipo": "GRUPO_LOCAL",
                      "telefonoContacto": "+57 312 456 7890", "sitioWeb": "https://colectivogaleras.org",
                      "direccion": "Plazoleta UCC, Pasto"},
        "andres":    {"nombreEntidad": "Producciones Sur S.A.S.", "tipo": "EMPRESA",
                      "telefonoContacto": "+57 315 220 1188", "sitioWeb": "https://produccionessur.co",
                      "direccion": "Cra. 27 #18-40, Pasto"},
        "valentina": {"nombreEntidad": "Secretaría de Cultura", "tipo": "ALCALDIA",
                      "telefonoContacto": "+57 602 733 0000", "direccion": "CAM Anganoy, Pasto"},
        "felipe":    {"nombreEntidad": "Colectivo Arte Libre", "tipo": "GRUPO_LOCAL",
                      "telefonoContacto": "+57 318 940 2211"},
    }
    sol_ids = {}
    for clave, datos in solicitudes.items():
        sol_ids[clave] = prueba(f"Solicitud de {usuarios[clave][1]} ({datos['nombreEntidad']})", "POST",
                                f"/usuarios/{ids[clave]}/solicitar-rol-organizador", 201, cuerpo=datos,
                                headers=bearer(tok[clave]))["id"]
    prueba("Solicitud sin teléfono (debe fallar)", "POST",
           f"/usuarios/{ids['felipe']}/solicitar-rol-organizador", 400,
           cuerpo={"nombreEntidad": "Sin Teléfono", "tipo": "EMPRESA"}, headers=bearer(tok["felipe"]))
    prueba("Laura pide el rol en nombre de Felipe (debe fallar)", "POST",
           f"/usuarios/{ids['felipe']}/solicitar-rol-organizador", 403,
           cuerpo=solicitudes["felipe"], headers=bearer(tok["laura"]))
    prueba("Laura lista solicitudes (debe fallar)", "GET", "/admin/solicitudes-organizador", 403,
           headers=bearer(tok["laura"]))
    pendientes = prueba("Listar solicitudes pendientes", "GET", "/admin/solicitudes-organizador", 200, headers=adm)
    verificar("Hay 4 solicitudes pendientes", len(pendientes) == 4, f"hay {len(pendientes)}")
    prueba("Aprobar a Daniela (Colectivo Galeras)", "POST",
           f"/admin/solicitudes-organizador/{sol_ids['daniela']}/aprobar", 200, headers=adm)
    prueba("Aprobar a Andrés (Producciones Sur)", "POST",
           f"/admin/solicitudes-organizador/{sol_ids['andres']}/aprobar", 200, headers=adm)
    prueba("Rechazar sin motivo (debe fallar)", "POST",
           f"/admin/solicitudes-organizador/{sol_ids['valentina']}/rechazar", 400, headers=adm, cuerpo={"motivo": ""})
    prueba("Rechazar a Valentina con motivo", "POST",
           f"/admin/solicitudes-organizador/{sol_ids['valentina']}/rechazar", 200, headers=adm,
           cuerpo={"motivo": "Falta el documento que acredite a la entidad. Puedes enviarla de nuevo."})
    prueba("Aprobar una solicitud ya rechazada (debe fallar)", "POST",
           f"/admin/solicitudes-organizador/{sol_ids['valentina']}/aprobar", 403, headers=adm)
    verificar("Daniela ahora es ORGANIZADOR",
              req("GET", f"/usuarios/{ids['daniela']}", headers=bearer(tok["daniela"]))[1]["rol"] == "ORGANIZADOR")
    pendientes = prueba("Listar pendientes tras revisar", "GET", "/admin/solicitudes-organizador", 200, headers=adm)
    verificar("Solo queda pendiente la de Felipe", [p["id"] for p in pendientes] == [sol_ids["felipe"]])

    print("\n=== 5. Eventos (organizadores) ===")
    def evento(titulo, desc, categoria, ini, fin, modalidad, precio, canal):
        return {"titulo": titulo, "descripcion": desc, "categoriaId": cat[categoria],
                "fechaInicio": ini, "fechaFin": fin, "modalidad": modalidad, "precio": precio,
                "canalInscripcion": canal}
    # Tokens obtenidos antes de la aprobación: el rol se lee de la base, así que sirven sin volver a iniciar sesión.
    org_d = bearer(tok["daniela"])
    org_a = bearer(tok["andres"])
    prueba("Laura (asistente) intenta crear un evento (debe fallar)", "POST", "/eventos", 403, headers=bearer(tok["laura"]),
           cuerpo={"titulo": "X", "descripcion": "X", "categoriaId": cat["Música"], "fechaInicio": "2026-12-20T10:00:00",
                   "fechaFin": "2026-12-20T11:00:00", "modalidad": "VIRTUAL",
                   "canalInscripcion": {"tipo": "URL", "destino": "https://example.com"}})
    ev = {}
    ev["novena"] = prueba("Crear 'Novena Navideña Comunitaria'", "POST", "/eventos", 201, headers=org_d, cuerpo=evento(
        "Novena Navideña Comunitaria",
        "Celebremos la novena de aguinaldos con villancicos, natilla, buñuelos y actividades para toda la familia.",
        "Cultura", "2026-12-16T19:00:00", "2026-12-16T21:00:00", "PRESENCIAL", None,
        {"tipo": "WHATSAPP", "destino": "+573124567890", "mensajePredefinido": "Hola, quiero inscribirme a la novena"}))["id"]
    ev["velitas"] = prueba("Crear 'Noche de Velitas en la Plaza'", "POST", "/eventos", 201, headers=org_d, cuerpo=evento(
        "Noche de Velitas en la Plaza",
        "Encendido colectivo de velas y faroles en la Plaza de Nariño con música en vivo.",
        "Cultura", "2026-12-07T18:00:00", "2026-12-07T21:00:00", "PRESENCIAL", None,
        {"tipo": "URL", "destino": "https://colectivogaleras.org/velitas"}))["id"]
    ev["concierto"] = prueba("Crear 'Concierto de Fin de Año'", "POST", "/eventos", 201, headers=org_a, cuerpo=evento(
        "Concierto de Fin de Año",
        "Despide el 2026 con bandas locales y artistas invitados en el Estadio Libertad.",
        "Música", "2026-12-28T20:00:00", "2026-12-28T23:30:00", "PRESENCIAL", 30000,
        {"tipo": "FORMULARIO", "destino": "https://forms.gle/citypulse-concierto", "proveedor": "Google Forms"}))["id"]
    ev["feria"] = prueba("Crear 'Feria Navideña Emprendedora'", "POST", "/eventos", 201, headers=org_a, cuerpo=evento(
        "Feria Navideña Emprendedora",
        "Más de 40 emprendimientos de Pasto con regalos, artesanías y comida típica.",
        "Gastronomía", "2026-12-05T10:00:00", "2026-12-05T18:00:00", "PRESENCIAL", None,
        {"tipo": "URL", "destino": "https://produccionessur.co/feria"}))["id"]
    ev["taller"] = prueba("Crear 'Taller Virtual de Fotografía Navideña'", "POST", "/eventos", 201, headers=org_a,
                          cuerpo=evento("Taller Virtual de Fotografía Navideña",
                                        "Aprende a fotografiar luces y alumbrados con tu celular.",
                                        "Tecnología", "2026-12-12T15:00:00", "2026-12-12T17:00:00", "VIRTUAL", 15000,
                                        {"tipo": "URL", "destino": "https://produccionessur.co/taller"}))["id"]
    temporal = prueba("Crear evento temporal para borrar", "POST", "/eventos", 201, headers=org_a,
                      cuerpo=evento("Evento temporal", "Se elimina en la prueba.", "Música",
                                    "2026-12-20T10:00:00", "2026-12-20T11:00:00", "VIRTUAL", None,
                                    {"tipo": "URL", "destino": "https://example.com"}))["id"]
    prueba("Crear evento con fin antes del inicio (debe fallar)", "POST", "/eventos", 400, headers=org_a,
           cuerpo=evento("Fechas malas", "x", "Música", "2026-12-20T20:00:00", "2026-12-20T18:00:00",
                         "PRESENCIAL", None, {"tipo": "URL", "destino": "https://example.com"}))
    prueba("Crear evento en el pasado (debe fallar)", "POST", "/eventos", 400, headers=org_a,
           cuerpo=evento("En el pasado", "x", "Música", "2025-01-10T20:00:00", "2025-01-10T22:00:00",
                         "PRESENCIAL", None, {"tipo": "URL", "destino": "https://example.com"}))
    prueba("Crear evento sin título (debe fallar)", "POST", "/eventos", 400, headers=org_a,
           cuerpo=evento("", "x", "Música", "2026-12-20T20:00:00", "2026-12-20T22:00:00",
                         "PRESENCIAL", None, {"tipo": "URL", "destino": "https://example.com"}))

    cambio = evento("Concierto de Fin de Año 2026",
                    "Despide el 2026 con bandas locales, artistas invitados y show de luces en el Estadio Libertad.",
                    "Música", "2026-12-28T19:30:00", "2026-12-28T23:59:00", "PRESENCIAL", 35000,
                    {"tipo": "FORMULARIO", "destino": "https://forms.gle/citypulse-concierto", "proveedor": "Google Forms"})
    editado = prueba("Editar el concierto (título, hora y precio)", "PUT", f"/eventos/{ev['concierto']}", 200,
                     headers=org_a, cuerpo=cambio)
    verificar("El concierto quedó con precio 35000", editado.get("precio") == 35000)
    prueba("Editar un evento de otro organizador (debe fallar)", "PUT", f"/eventos/{ev['concierto']}", 403,
           headers=org_d, cuerpo=cambio)
    prueba("Ocultar 'Noche de Velitas'", "PATCH", f"/eventos/{ev['velitas']}/visibilidad", 200,
           headers=org_d, params={"oculto": "true"})
    prueba("Cancelar el taller virtual", "PATCH", f"/eventos/{ev['taller']}/cancelar", 200, headers=org_a)
    prueba("Eliminar el evento temporal", "DELETE", f"/eventos/{temporal}", 204, headers=org_a)
    mis = prueba("Panel: listar eventos de Producciones Sur", "GET", f"/eventos/organizador/{ids['andres']}", 200, headers=org_a)
    estados = {e["titulo"]: e.get("estado") for e in mis}
    verificar("El panel muestra el taller como CANCELADO", estados.get("Taller Virtual de Fotografía Navideña") == "CANCELADO",
              str(estados))
    cal = prueba("Panel: calendario de diciembre 2026 de Colectivo Galeras", "GET",
                 f"/eventos/organizador/{ids['daniela']}/calendario", 200, params={"mes": 12, "anio": 2026}, headers=org_d)
    prueba("Daniela consulta el panel de Producciones Sur (debe fallar)", "GET",
           f"/eventos/organizador/{ids['andres']}", 403, headers=org_d)
    print(f"   calendario: {json.dumps(cal, ensure_ascii=False)[:160]}")

    print("\n=== 6. Descubrimiento (público) ===")
    grid = prueba("Grid público de eventos", "GET", "/eventos", 200)
    titulos = [e["titulo"] for e in grid]
    verificar("El grid muestra 3 eventos ordenados por fecha (sin oculto, cancelado ni eliminado)",
              titulos == ["Feria Navideña Emprendedora", "Novena Navideña Comunitaria", "Concierto de Fin de Año 2026"],
              str(titulos))
    cultura = prueba("Filtrar por categoría Cultura", "GET", "/eventos", 200, params={"categoriaId": cat["Cultura"]})
    verificar("Cultura solo trae la Novena", [e["titulo"] for e in cultura] == ["Novena Navideña Comunitaria"],
              str([e["titulo"] for e in cultura]))
    rango = prueba("Filtrar presencial del 1 al 20 de diciembre", "GET", "/eventos", 200,
                   params={"modalidad": "PRESENCIAL", "fechaDesde": "2026-12-01T00:00:00", "fechaHasta": "2026-12-20T23:59:59"})
    verificar("El rango trae Feria y Novena", [e["titulo"] for e in rango] ==
              ["Feria Navideña Emprendedora", "Novena Navideña Comunitaria"], str([e["titulo"] for e in rango]))
    vacio = prueba("Filtro sin resultados (virtual en Cultura)", "GET", "/eventos", 200,
                   params={"categoriaId": cat["Cultura"], "modalidad": "VIRTUAL"})
    verificar("El filtro sin resultados devuelve lista vacía", vacio == [])
    detalle = prueba("Detalle de la Novena", "GET", f"/eventos/{ev['novena']}", 200)
    verificar("El detalle trae organizador y canal de WhatsApp",
              detalle.get("canalInscripcion", {}).get("tipo") == "WHATSAPP", json.dumps(detalle, ensure_ascii=False)[:200])
    prueba("Detalle de evento inexistente (debe fallar)", "GET", "/eventos/000000000000000000000000", 404)

    print("\n=== 7. Favoritos (asistente) ===")
    fav = f"/usuarios/{ids['laura']}/favoritos"
    lau = bearer(tok["laura"])
    prueba("Laura guarda la Novena", "POST", f"{fav}/{ev['novena']}", 201, headers=lau)
    prueba("Laura guarda el Concierto", "POST", f"{fav}/{ev['concierto']}", 201, headers=lau)
    prueba("Guardar la Novena otra vez (debe fallar)", "POST", f"{fav}/{ev['novena']}", 400, headers=lau)
    lista = prueba("Listar favoritos de Laura", "GET", fav, 200, headers=lau)
    verificar("Laura tiene 2 favoritos", len(lista) == 2, str(len(lista)))
    prueba("Quitar el Concierto de favoritos", "DELETE", f"{fav}/{ev['concierto']}", 204, headers=lau)
    lista = prueba("Listar favoritos tras quitar", "GET", fav, 200, headers=lau)
    verificar("Queda solo la Novena", [e["titulo"] for e in lista] == ["Novena Navideña Comunitaria"])
    prueba("Un organizador no puede tener favoritos (debe fallar)", "POST",
           f"/usuarios/{ids['daniela']}/favoritos/{ev['concierto']}", 403, headers=org_d)
    prueba("Felipe ve los favoritos de Laura (debe fallar)", "GET", fav, 403, headers=bearer(tok["felipe"]))

    ok = sum(1 for r in resultados if r[0])
    print(f"\nRESULTADO: {ok}/{len(resultados)} pruebas correctas")
    with open(Path(__file__).with_name("resultados.json"), "w", encoding="utf-8") as f:
        json.dump([dict(zip(["ok", "prueba", "metodo", "ruta", "esperado", "obtenido", "detalle"], r))
                   for r in resultados], f, ensure_ascii=False, indent=2)
    return 0 if ok == len(resultados) else 1


if __name__ == "__main__":
    sys.exit(main())
