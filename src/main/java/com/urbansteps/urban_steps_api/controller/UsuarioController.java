package com.urbansteps.urban_steps_api.controller;

import com.urbansteps.urban_steps_api.model.Usuario;
import com.urbansteps.urban_steps_api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<?> listarUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        usuarios.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUsuarioPorId(@PathVariable Long id) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }
        Usuario usuario = usuarioOpt.get();
        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/{id}/rol")
    public ResponseEntity<?> cambiarRol(@PathVariable Long id, @RequestBody Map<String, String> body, Principal principal) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        String nuevoRol = body.get("rol");
        if (nuevoRol == null || nuevoRol.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El rol es obligatorio.");
        }

        nuevoRol = nuevoRol.trim().toUpperCase();
        if (!nuevoRol.startsWith("ROLE_")) {
            nuevoRol = "ROLE_" + nuevoRol;
        }

        if (!nuevoRol.equals("ROLE_ADMIN") && !nuevoRol.equals("ROLE_OPERARIO") && !nuevoRol.equals("ROLE_CLIENTE") && !nuevoRol.equals("ROLE_USER")) {
            return ResponseEntity.badRequest().body("Rol inválido. Los roles permitidos son ADMIN, OPERARIO o CLIENTE.");
        }

        Usuario usuario = usuarioOpt.get();

        // Evitar que el administrador en sesión se quite a sí mismo los permisos de administrador
        if (principal != null && usuario.getEmail().equalsIgnoreCase(principal.getName()) && !nuevoRol.equals("ROLE_ADMIN")) {
            return ResponseEntity.badRequest().body("No puedes degradar tu propio rol de Administrador en la sesión activa.");
        }

        usuario.setRol(nuevoRol);
        usuarioRepository.save(usuario);
        usuario.setPassword(null);

        return ResponseEntity.ok(Map.of(
            "mensaje", "Rol actualizado con éxito.",
            "usuario", usuario
        ));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Object> body, Principal principal) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        if (!body.containsKey("activo")) {
            return ResponseEntity.badRequest().body("El campo 'activo' (true/false) es obligatorio.");
        }

        boolean nuevoEstado = Boolean.parseBoolean(String.valueOf(body.get("activo")));
        Usuario usuario = usuarioOpt.get();

        if ("admin@urbansteps.com".equalsIgnoreCase(usuario.getEmail()) && !nuevoEstado) {
            return ResponseEntity.badRequest().body("La cuenta principal de Administrador no puede ser bloqueada.");
        }

        // Evitar que el administrador se bloquee a sí mismo
        if (principal != null && usuario.getEmail().equalsIgnoreCase(principal.getName()) && !nuevoEstado) {
            return ResponseEntity.badRequest().body("No puedes bloquear tu propia cuenta de Administrador.");
        }

        usuario.setActivo(nuevoEstado);
        usuarioRepository.save(usuario);
        usuario.setPassword(null);

        String accion = nuevoEstado ? "activada" : "bloqueada";
        return ResponseEntity.ok(Map.of(
            "mensaje", "Cuenta de usuario " + accion + " con éxito.",
            "usuario", usuario
        ));
    }
}
