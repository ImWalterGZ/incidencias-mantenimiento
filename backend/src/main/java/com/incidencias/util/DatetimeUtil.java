package com.incidencias.util;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

public final class DatetimeUtil {

    private DatetimeUtil() {
    }

    public static long getTimestampInMilliseconds() {
        return System.currentTimeMillis();
    }

    public static OffsetDateTime ahora() {
        // UTC y microsegundos, igual que lo guarda PostgreSQL, para que la respuesta no cambie al releer.
        return OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
    }
}
