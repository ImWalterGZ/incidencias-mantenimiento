"""Carga incidencias de demostración por la API (no por SQL), para que las vistas tengan datos en varios estados.

Uso: python3 scripts/sembrar-demo.py [http://localhost:8081/api/v1]
"""
import json
import sys
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api/v1"
CONTRASENA = "Incidencias2026"


def llamar(metodo, ruta, token=None, cuerpo=None):
    req = urllib.request.Request(BASE + ruta, method=metodo,
                                 data=json.dumps(cuerpo).encode() if cuerpo is not None else None)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def token(usuario):
    return llamar("POST", "/auth/login", cuerpo={"username": usuario, "password": CONTRASENA})["token"]


t = {u: token(u) for u in ("ana", "bruno", "carlos", "diana", "elena")}
tecnicos = {u["username"]: u["id"] for u in llamar("GET", "/usuarios?rol=TECNICO", t["elena"])}
ubic = {u["nombre"]: u["id"] for u in llamar("GET", "/ubicaciones", t["ana"])}

# (quien reporta, ubicación, categoría, prioridad, descripción, técnico, pasos que avanza el técnico con comentario)
DEMO = [
    ("ana", "Coordinación de TI", "EQUIPO_COMPUTO", "MEDIA",
     "La impresora compartida atasca cada hoja que sale por la bandeja 2.", "diana",
     ["Revisando rodillos de la bandeja 2", "Se limpiaron y ajustaron los rodillos; imprime sin atascos"]),
    ("bruno", "Aula A-204", "MOBILIARIO", "BAJA",
     "Tres bancas de la fila del fondo tienen el respaldo flojo y se balancean.", "diana",
     ["Se llevaron tornillos y llave para fijar los respaldos"]),
    ("ana", "Laboratorio de Redes", "CLIMATIZACION", "ALTA",
     "El minisplit gotea agua sobre el rack de switches del laboratorio.", "carlos", []),
    ("bruno", "Servicios Escolares", "ELECTRICA", "ALTA",
     "El contacto doble junto a la ventanilla 2 echa chispa al conectar un equipo.", None, []),
]

for reporta, ubicacion, categoria, prioridad, descripcion, tecnico, pasos in DEMO:
    inc = llamar("POST", "/incidencias", t[reporta], {
        "ubicacionId": ubic[ubicacion], "categoria": categoria,
        "prioridad": prioridad, "descripcion": descripcion})
    if tecnico:
        llamar("PATCH", f"/incidencias/{inc['id']}/asignacion", t["elena"], {"tecnicoId": tecnicos[tecnico]})
        for estado, comentario in zip(("EN_PROCESO", "RESUELTA"), pasos):
            inc = llamar("PATCH", f"/incidencias/{inc['id']}/estado", t[tecnico],
                         {"estado": estado, "comentario": comentario})
    final = llamar("GET", f"/incidencias/{inc['id']}", t["elena"])
    print(f"#{final['id']:>3}  {final['estado']:<11} {descripcion[:60]}")
