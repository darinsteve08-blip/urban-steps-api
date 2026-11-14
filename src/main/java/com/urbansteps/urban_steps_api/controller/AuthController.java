package com.urbansteps.urban_steps_api.controller;

import com.urbansteps.urban_steps_api.model.Usuario;
import com.urbansteps.urban_steps_api.repository.UsuarioRepository;
import com.urbansteps.urban_steps_api.service.EmailService;
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
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
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

    @Autowired
    private org.springframework.security.web.context.SecurityContextRepository securityContextRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/registro")
    public ResponseEntity<?> registrarCliente(@RequestBody Usuario nuevoUsuario) {
        if (usuarioRepository.existsByEmail(nuevoUsuario.getEmail())) {
            return ResponseEntity.badRequest().body("El correo electrónico ya está registrado.");
        }

        nuevoUsuario.setPassword(passwordEncoder.encode(nuevoUsuario.getPassword()));
        
        if (nuevoUsuario.getRol() == null || nuevoUsuario.getRol().trim().isEmpty()) {
            nuevoUsuario.setRol("ROLE_CLIENTE");
        }

        usuarioRepository.save(nuevoUsuario);
        return ResponseEntity.ok("¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrarUsuario(@RequestBody Usuario usuario) {
        return registrarCliente(usuario);
    }

    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@RequestBody Map<String, String> credenciales, 
                                           HttpServletRequest request, 
                                           jakarta.servlet.http.HttpServletResponse response) {
        try {
            String email = credenciales.get("email");
            String password = credenciales.get("password");

            if (email == null || password == null) {
                return ResponseEntity.badRequest().body("Correo y contraseña son obligatorios.");
            }

            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            // Guardado explícito del contexto de seguridad en la sesión HTTP
            HttpSession session = request.getSession(true);
            session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, 
                context
            );

            Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
            String nombre = (usuario != null && usuario.getNombre() != null) ? usuario.getNombre() : "";
            String rol = (usuario != null && usuario.getRol() != null) ? usuario.getRol() : "ROLE_USER";

            return ResponseEntity.ok(Map.of(
                "mensaje", "¡Login exitoso!",
                "email", email,
                "nombre", nombre,
                "rol", rol
            ));
        } catch (org.springframework.security.authentication.DisabledException de) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Tu cuenta ha sido desactivada o bloqueada por un administrador.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Correo o contraseña incorrectos.");
        }
    }

    // Acepta tanto /me como /current para ser compatible con el JS
    @GetMapping({"/me", "/current"})
    public ResponseEntity<?> obtenerUsuarioActual(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autorizado");
        }

        String email = principal.getName();
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No hay una sesión activa.");
        }

        String emailUsuario = principal.getName();
        String passwordActual = request.get("currentPassword");
        String passwordNueva = request.get("newPassword");

        if (passwordActual == null || passwordNueva == null || passwordNueva.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Los campos de contraseña no pueden estar vacíos.");
        }

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("La contraseña actual es incorrecta.");
        }

        usuario.setPassword(passwordEncoder.encode(passwordNueva));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("¡Contraseña actualizada con éxito!");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El correo es obligatorio.");
        }

        email = email.trim().toLowerCase();
        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null) {
            // Por seguridad respondemos igual aunque no exista el correo
            return ResponseEntity.ok("Si el correo está registrado, recibirás el código en breve.");
        }

        emailService.generarYEnviarCodigoRecuperacion(email, usuario.getNombre());
        return ResponseEntity.ok("Si el correo está registrado, recibirás el código en breve.");
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<String> verificarCodigoReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String codigo = request.get("codigo");

        if (email == null || codigo == null || email.trim().isEmpty() || codigo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Correo y código son obligatorios.");
        }

        if (!emailService.verificarCodigo(email.trim().toLowerCase(), codigo.trim())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Código incorrecto o expirado.");
        }

        return ResponseEntity.ok("Código verificado correctamente.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String codigo = request.get("codigo");
        String nuevaPassword = request.get("nuevaPassword");

        if (email == null || codigo == null || nuevaPassword == null
                || email.trim().isEmpty() || codigo.trim().isEmpty() || nuevaPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Todos los campos son obligatorios.");
        }

        if (nuevaPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        email = email.trim().toLowerCase();

        if (!emailService.verificarCodigo(email, codigo.trim())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Código incorrecto o expirado. Vuelve a solicitar el código.");
        }

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        usuario.setPassword(passwordEncoder.encode(nuevaPassword.trim()));
        usuarioRepository.save(usuario);
        emailService.invalidarCodigo(email);

        return ResponseEntity.ok("¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");
    }

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
        usuario.setPassword(null);
        
        return ResponseEntity.ok(usuario);
    }
}
