package com.urbansteps.urban_steps_api.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 1. VITAL: Configura repositorio de contexto de seguridad explícito y compatible con sesiones
            .securityContext(sc -> sc
                .securityContextRepository(securityContextRepository())
                .requireExplicitSave(false)
            ) 
            
            .sessionManagement(sess -> sess
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                .requestMatchers("/", "/index.html", "/login.html", "/registro.html",
                        "/carrito.html", "/checkout.html", "/pago.html",
                        "/detalle.html", "/perfil.html", "/pedidos.html", "/usuarios.html",
                        "/js/**", "/css/**", "/img/**", "/images/**", "/*.html",
                        "/favicon.ico", "/error").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()

                // 2. SE AGREGA OPERARIO Y ROLE_OPERARIO A LOS PERMISOS DE GESTIÓN
                .requestMatchers(HttpMethod.POST, "/api/productos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "OPERARIO", "ROLE_OPERARIO")
                .requestMatchers(HttpMethod.PUT, "/api/productos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "OPERARIO", "ROLE_OPERARIO")
                .requestMatchers(HttpMethod.PATCH, "/api/productos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "OPERARIO", "ROLE_OPERARIO")
                .requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "OPERARIO", "ROLE_OPERARIO")

                .requestMatchers(HttpMethod.GET, "/api/pedidos/mis-pedidos").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/pedidos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "OPERARIO", "ROLE_OPERARIO")
                .requestMatchers(HttpMethod.POST, "/api/pedidos/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/pedidos/**").authenticated()

                // 3. GESTIÓN DE USUARIOS (Solo Administrador)
                .requestMatchers("/api/usuarios/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")

                .anyRequest().authenticated()
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"mensaje\":\"Sesión cerrada correctamente\"}");
                })
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.security.web.context.SecurityContextRepository securityContextRepository() {
        return new org.springframework.security.web.context.HttpSessionSecurityContextRepository();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.vercel.app",
                "https://*.render.com",
                "https://*.onrender.com",
                "https://*.railway.app",
                "https://*.clever-cloud.com",
                "https://*.netlify.app"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "Authorization", "Content-Disposition"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
