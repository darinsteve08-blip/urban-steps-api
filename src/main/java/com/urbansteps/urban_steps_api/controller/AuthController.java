package com.urbansteps.urban_steps_api.controller;

import com.urbansteps.urban_steps_api.model.Usuario;
import com.urbansteps.urban_steps_api.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/registro")
    public ResponseEntity<?> registrarCliente(@RequestBody Usuario nuevoUsuario) {
        if (usuarioRepository.findByEmail(nuevoUsuario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("El correo electrónico ya está registrado.");
        }

        nuevoUsuario.setPassword(passwordEncoder.encode(nuevoUsuario.getPassword()));
        nuevoUsuario.setRol("ROLE_CLIENTE");

        usuarioRepository.save(nuevoUsuario);
        return ResponseEntity.ok("¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
    }

    // Endpoint de Login por API (ideal para JavaScript / fetch)
    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@RequestBody Map<String, String> credenciales, HttpServletRequest request) {
        try {
            String email = credenciales.get("email");
            String password = credenciales.get("password");

            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            HttpSession session = request.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

            return ResponseEntity.ok(Map.of("mensaje", "¡Login exitoso!", "email", email));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Correo o contraseña incorrectos.");
        }
    }

    // Endpoint para verificar sesión y rol actual
    @GetMapping("/me")
    public ResponseEntity<?> obtenerUsuarioActual(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("No autorizado");
        }
        
        // Buscar el usuario en la base de datos usando el email del Principal
        String email = principal.getName();
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        
        if (usuario == null) {
            return ResponseEntity.notFound().build();
        }
        
        // No enviar la contraseña por seguridad
        usuario.setPassword(null);
        
        return ResponseEntity.ok(usuario);
    }
    // Endpoint para cambiar la contraseña (Funciona tanto para Clientes como para Administradores)
    @PostMapping("/change-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> request, Principal principal) {
        // 1. Verificar si el usuario ha iniciado sesión
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No hay una sesión activa.");
        }

        String emailUsuario = principal.getName(); // El email del usuario logueado gracias a Spring Security
        String passwordActual = request.get("currentPassword");
        String passwordNueva = request.get("newPassword");

        if (passwordActual == null || passwordNueva == null || passwordNueva.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Los campos de contraseña no pueden estar vacíos.");
        }

        // 2. Buscar el usuario en la base de datos
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(404).body("Usuario no encontrado.");
        }

        // 3. Validar que la contraseña actual escrita coincida con la de la BD
        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            return ResponseEntity.status(400).body("La contraseña actual es incorrecta.");
        }

        // 4. Encriptar la nueva contraseña y guardarla
        usuario.setPassword(passwordEncoder.encode(passwordNueva));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("¡Contraseña actualizada con éxito!");
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        // Aquí puedes agregar tu lógica para buscar el correo y enviar el token o la contraseña
        // Por ahora, para que responda con éxito:
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("El correo es obligatorio.");
        }

        // Simulación de envío exitoso
        return ResponseEntity.ok("Se han enviado las instrucciones de recuperación a " + email);
    }
    @PostMapping("/register")
    public ResponseEntity<String> registrarUsuario(@RequestBody Usuario usuario) {
        // Verificar si el correo ya existe
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            return ResponseEntity.badRequest().body("El correo electrónico ya está registrado.");
        }

        // Encriptar contraseña antes de guardarla
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        
        // Guardar en la base de datos
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("¡Usuario registrado con éxito! Ahora puedes iniciar sesión.");
    }

    // Endpoint para actualizar el perfil del usuario (nombre, teléfono, dirección, avatarUrl)
    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Usuario actualizacion, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autorizado");
        }

        Usuario usuario = usuarioRepository.findByEmail(principal.getName()).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        if (actualizacion.getNombre() != null && !actualizacion.getNombre().trim().isEmpty()) {
            usuario.setNombre(actualizacion.getNombre());
        }
        if (actualizacion.getTelefono() != null) {
            usuario.setTelefono(actualizacion.getTelefono());
        }
        if (actualizacion.getDireccion() != null) {
            usuario.setDireccion(actualizacion.getDireccion());
        }
        if (actualizacion.getAvatarUrl() != null) {
            usuario.setAvatarUrl(actualizacion.getAvatarUrl());
        }

        usuarioRepository.save(usuario);
        
        // No enviar la contraseña en la respuesta
        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }
}
