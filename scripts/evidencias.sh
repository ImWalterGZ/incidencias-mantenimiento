#!/bin/sh
# Regenera todas las evidencias de docs/evidencias sobre una base recién creada.
# Requiere: compose arriba con la base vacía, backend en :8081 y `npx ng serve` en :4200.
# NEWMAN puede apuntar a un newman con el reporter htmlextra (por defecto, npx newman sin HTML).
set -e
cd "$(dirname "$0")/.."
E=docs/evidencias
NEWMAN=${NEWMAN:-"npx -y newman"}
REPORTERS=${REPORTERS:-cli,json,htmlextra}

python3 scripts/sembrar-demo.py
node scripts/capturas.mjs "$E/capturas/"

for d in "$E/newman/corrida-1" "$E/newman"; do
  mkdir -p "$d"
  $NEWMAN run postman/incidencias.postman_collection.json -e postman/local.postman_environment.json \
    --color off -r "$REPORTERS" --reporter-json-export "$d/resultado.json" \
    --reporter-htmlextra-export "$d/reporte.html" > "$d/salida.txt"
done

{
  echo "-- Evidencia de datos. Consultas con psql dentro del contenedor después de sembrar-demo.py,"
  echo "-- capturas.mjs y dos corridas de newman:"
  echo "--   1) migraciones aplicadas por Flyway;  2) estructura y restricciones de la tabla incidencia;"
  echo "--   3) estado, técnico y filas de historial de las incidencias de demostración y de la UI;"
  echo "--   4) UPDATE manual que intenta poner ASIGNADA sin técnico: la base lo rechaza (ERROR esperado)."
  echo
  podman exec incidencias-postgres psql -U incidencias -d incidencias \
    -c "select installed_rank, version, description, success from flyway_schema_history order by 1;" \
    -c "\d incidencia" \
    -c "select i.id, i.estado, u.username as tecnico, count(h.id) as filas_historial from incidencia i left join usuario u on u.id = i.tecnico_id join historial_estado_incidencia h on h.incidencia_id = i.id where i.id <= 5 group by i.id, i.estado, u.username order by i.id;" \
    -c "update incidencia set estado = 'ASIGNADA' where id = 4;" 2>&1 || true  # el ERROR final es esperado
} > "$E/bd-consultas.txt"

(cd backend && ./mvnw test 2>&1 | grep -E 'Tests run|BUILD|Running') > "$E/junit.txt"
