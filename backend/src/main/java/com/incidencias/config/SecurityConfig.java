package com.incidencias.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.incidencias.constants.Constants;
import com.incidencias.dto.ErrorMessageDto;
import com.incidencias.enums.Rol;
import com.incidencias.filter.JwtAuthenticationFilter;
import com.incidencias.util.DatetimeUtil;

import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

/**
 * Autorización por rol a nivel de ruta (RNF1). La regla «solo el técnico asignado» (RN5) depende de los
 * datos de la incidencia y por eso vive en IncidenciaService.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Value("${api.base-path}")
    private String basePath;

    @Value("${api.cors-origin}")
    private String corsOrigin;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        String incidencias = basePath + "/incidencias";
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // El despacho interno de errores no debe exigir sesión: si no, un 400 o 500 llega como 401.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(basePath + "/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.POST, incidencias).hasRole(Rol.USUARIO.name())
                        .requestMatchers(HttpMethod.PATCH, incidencias + "/*/asignacion").hasRole(Rol.COORDINADOR.name())
                        .requestMatchers(HttpMethod.PATCH, incidencias + "/*/estado").hasRole(Rol.TECNICO.name())
                        .requestMatchers(HttpMethod.GET, basePath + "/usuarios").hasRole(Rol.COORDINADOR.name())
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, e) ->
                                escribirError(response, Constants.NO_AUTENTICADO, HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, e) ->
                                escribirError(response, Constants.ACCESO_DENEGADO, HttpStatus.FORBIDDEN)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** Con este bean y UserDetailsServiceImpl, Spring arma el proveedor DAO que valida contraseñas BCrypt. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private void escribirError(HttpServletResponse response, String mensaje, HttpStatus status)
            throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(),
                new ErrorMessageDto(mensaje, status, DatetimeUtil.getTimestampInMilliseconds()));
    }
}
