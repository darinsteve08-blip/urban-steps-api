package com.urbansteps.urban_steps_api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final Path rootUploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    public UploadController() {
        try {
            Files.createDirectories(rootUploadDir);
            Files.createDirectories(rootUploadDir.resolve("avatars"));
            Files.createDirectories(rootUploadDir.resolve("productos"));
            Files.createDirectories(rootUploadDir.resolve("general"));
        } catch (IOException e) {
            System.err.println("Error creando directorios de subida: " + e.getMessage());
        }
    }

    @PostMapping("/imagen")
    public ResponseEntity<?> subirImagen(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tipo", defaultValue = "general") String tipo
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo de imagen no puede estar vacío."));
        }

        // Validar tipo de contenido
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        if (!esImagenValida(contentType, originalFilename)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten archivos de imagen (JPG, JPEG, PNG, WEBP, GIF)."));
        }

        try {
            String subDir = determinarSubdirectorio(tipo);
            Path targetDir = rootUploadDir.resolve(subDir);
            Files.createDirectories(targetDir);

            String extension = extraerExtension(originalFilename);
            String nuevoNombre = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            Path targetLocation = targetDir.resolve(nuevoNombre);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String urlPublica = "/uploads/" + subDir + "/" + nuevoNombre;

            return ResponseEntity.ok(Map.of(
                "url", urlPublica,
                "nombreArchivo", nuevoNombre,
                "mensaje", "Imagen subida exitosamente",
                "exito", true
            ));
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al guardar el archivo: " + ex.getMessage()));
        }
    }

    @PostMapping("/imagenes")
    public ResponseEntity<?> subirMultiplesImagenes(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "tipo", defaultValue = "productos") String tipo
    ) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se recibieron archivos."));
        }

        List<String> urls = new ArrayList<>();
        String subDir = determinarSubdirectorio(tipo);
        Path targetDir = rootUploadDir.resolve(subDir);

        try {
            Files.createDirectories(targetDir);

            for (MultipartFile file : files) {
                if (!file.isEmpty() && esImagenValida(file.getContentType(), file.getOriginalFilename())) {
                    String extension = extraerExtension(file.getOriginalFilename());
                    String nuevoNombre = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
                    Path targetLocation = targetDir.resolve(nuevoNombre);

                    Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                    urls.add("/uploads/" + subDir + "/" + nuevoNombre);
                }
            }

            return ResponseEntity.ok(Map.of(
                "urls", urls,
                "totalSubidas", urls.size(),
                "mensaje", "Imágenes subidas exitosamente",
                "exito", true
            ));
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al guardar imágenes: " + ex.getMessage()));
        }
    }

    private boolean esImagenValida(String contentType, String filename) {
        if (contentType != null && contentType.toLowerCase().startsWith("image/")) {
            return true;
        }
        if (filename != null) {
            String lower = filename.toLowerCase();
            return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
                || lower.endsWith(".webp") || lower.endsWith(".gif") || lower.endsWith(".avif");
        }
        return false;
    }

    private String determinarSubdirectorio(String tipo) {
        if ("avatar".equalsIgnoreCase(tipo) || "avatars".equalsIgnoreCase(tipo)) {
            return "avatars";
        } else if ("producto".equalsIgnoreCase(tipo) || "productos".equalsIgnoreCase(tipo)) {
            return "productos";
        }
        return "general";
    }

    private String extraerExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".")).toLowerCase();
        }
        return ".jpg";
    }
}
