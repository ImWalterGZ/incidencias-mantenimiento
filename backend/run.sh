#!/bin/sh
# Arranca el backend en :8081. Requiere JDK 21 con javac y Postgres de compose.yaml arriba.
cd "$(dirname "$0")" || exit 1
[ -d "$HOME/.local/share/jdks/21" ] && export JAVA_HOME="$HOME/.local/share/jdks/21"
exec ./mvnw -q spring-boot:run "$@"
