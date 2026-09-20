package com.urbansteps.urban_steps_api.controller;

import com.urbansteps.urban_steps_api.model.Producto;
import com.urbansteps.urban_steps_api.model.Resena;
import com.urbansteps.urban_steps_api.model.Usuario;
import com.urbansteps.urban_steps_api.repository.ProductoRepository;
import com.urbansteps.urban_steps_api.repository.ResenaRepository;
import com.urbansteps.urban_steps_api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ResenaController {

    @Autowired
    private ResenaRepository resenaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/productos/{productoId}/resenas")
    public ResponseEntity<?> listarResenasDeProducto(@PathVariable Long productoId) {
        if (!productoRepository.existsById(productoId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Producto no encontrado");
        }

        List<Resena> resenas = resenaRepository.findByProductoIdOrderByFechaDesc(productoId);
        int total = resenas.size();
        double suma = 0.0;
        Map<String, Integer> distribucion = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribucion.put(String.valueOf(i), 0);

        for (Resena r : resenas) {
            int cal = r.getCalificacion() != null ? r.getCalificacion() : 5;
            suma += cal;
            String key = String.valueOf(cal);
            distribucion.put(key, distribucion.getOrDefault(key, 0) + 1);
        }

        double promedio = total > 0 ? Math.round((suma / total) * 10.0) / 10.0 : 0.0;

        return ResponseEntity.ok(Map.of(
            "productoId", productoId,
            "promedio", promedio,
            "total", total,
            "distribucion", distribucion,
            "resenas", resenas
        ));
    }

    @PostMapping("/productos/{productoId}/resenas")
    public ResponseEntity<?> guardarResena(@PathVariable Long productoId,
                                           @RequestBody Map<String, Object> body,
                                           Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Debes iniciar sesión para calificar este producto.");
        }

        Optional<Producto> prodOpt = productoRepository.findById(productoId);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Producto no encontrado.");
        }

        if (!body.containsKey("calificacion")) {
            return ResponseEntity.badRequest().body("La calificación de 1 a 5 estrellas es obligatoria.");
        }

        int calificacion;
        try {
            calificacion = Integer.parseInt(String.valueOf(body.get("calificacion")));
            if (calificacion < 1 || calificacion > 5) {
                return ResponseEntity.badRequest().body("La calificación debe estar entre 1 y 5 estrellas.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Calificación inválida.");
        }

        String comentario = body.get("comentario") != null ? String.valueOf(body.get("comentario")).trim() : "";
        if (comentario.length() > 1000) {
            return ResponseEntity.badRequest().body("El comentario no puede exceder 1000 caracteres.");
        }

        String email = principal.getName();
        String nombre = email.split("@")[0];
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getNombre() != null && !usuarioOpt.get().getNombre().isBlank()) {
            nombre = usuarioOpt.get().getNombre();
        }

        // Si el usuario ya había opinado para este producto, actualizamos su reseña
        Resena resena = resenaRepository.findByProductoIdAndUsuarioEmail(productoId, email)
                .orElse(new Resena(productoId, email, nombre, calificacion, comentario));

        resena.setCalificacion(calificacion);
        resena.setComentario(comentario);
        resena.setUsuarioNombre(nombre);
        resena.setFecha(LocalDateTime.now());

        resenaRepository.save(resena);

        return ResponseEntity.ok(Map.of(
            "mensaje", "¡Tu opinión ha sido publicada con éxito!",
            "resena", resena
        ));
    }

    @GetMapping("/resenas/resumen")
    public ResponseEntity<?> obtenerResumenResenas() {
        List<Resena> todas = resenaRepository.findAll();
        Map<Long, List<Integer>> calificacionesPorProducto = new HashMap<>();

        for (Resena r : todas) {
            calificacionesPorProducto
                .computeIfAbsent(r.getProductoId(), k -> new ArrayList<>())
                .add(r.getCalificacion() != null ? r.getCalificacion() : 5);
        }

        Map<String, Map<String, Object>> resumen = new HashMap<>();
        calificacionesPorProducto.forEach((prodId, lista) -> {
            int total = lista.size();
            double suma = 0;
            for (int cal : lista) suma += cal;
            double prom = total > 0 ? Math.round((suma / total) * 10.0) / 10.0 : 0.0;
            resumen.put(String.valueOf(prodId), Map.of(
                "promedio", prom,
                "total", total
            ));
        });

        return ResponseEntity.ok(resumen);
    }

    @DeleteMapping("/resenas/{id}")
    public ResponseEntity<?> eliminarResena(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autorizado");
        }

        Optional<Resena> resenaOpt = resenaRepository.findById(id);
        if (resenaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Reseña no encontrada");
        }

        Resena resena = resenaOpt.get();
        String userEmail = principal.getName();
        Usuario usuario = usuarioRepository.findByEmail(userEmail).orElse(null);
        boolean esAdmin = usuario != null && (
            "ADMIN".equalsIgnoreCase(usuario.getRol()) ||
            "ROLE_ADMIN".equalsIgnoreCase(usuario.getRol())
        );

        if (!esAdmin && !resena.getUsuarioEmail().equalsIgnoreCase(userEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para eliminar esta opinión.");
        }

        resenaRepository.delete(resena);
        return ResponseEntity.ok("Opinión eliminada con éxito.");
    }
}
