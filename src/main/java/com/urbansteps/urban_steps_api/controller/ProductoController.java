package com.urbansteps.urban_steps_api.controller;

import com.urbansteps.urban_steps_api.model.Producto;
import com.urbansteps.urban_steps_api.repository.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Producto> listarProductos(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean destacado,
            @RequestParam(required = false, defaultValue = "id") String sort,
            @RequestParam(required = false, defaultValue = "DESC") String dir
    ) {
        Sort orden = Sort.by(Sort.Direction.fromString(dir.toUpperCase()), sort);
        List<Producto> lista = productoRepository.findAll(orden);

        if (destacado != null) {
            lista = lista.stream().filter(p -> destacado.equals(p.getDestacado())).toList();
        }
        if (categoria != null && !categoria.isBlank() && !categoria.equalsIgnoreCase("TODOS")) {
            lista = lista.stream()
                    .filter(p -> categoria.equalsIgnoreCase(p.getCategoria()))
                    .toList();
        }
        if (q != null && !q.isBlank()) {
            String qLower = q.toLowerCase();
            lista = lista.stream()
                    .filter(p -> (p.getNombre() != null && p.getNombre().toLowerCase().contains(qLower))
                            || (p.getDescripcion() != null && p.getDescripcion().toLowerCase().contains(qLower))
                            || (p.getProveedor() != null && p.getProveedor().toLowerCase().contains(qLower)))
                    .toList();
        }
        return lista;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerProductoPorId(@PathVariable Long id) {
        return productoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/relacionados")
    public ResponseEntity<List<Producto>> productosRelacionados(@PathVariable Long id,
                                                                 @RequestParam(defaultValue = "4") int limit) {
        Producto actual = productoRepository.findById(id).orElse(null);
        if (actual == null) return ResponseEntity.notFound().build();
        List<Producto> todos = productoRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        List<Producto> relacionados = todos.stream()
                .filter(p -> !p.getId().equals(id))
                .filter(p -> p.getStock() == null || p.getStock() > 0)
                .filter(p -> actual.getCategoria() == null || actual.getCategoria().equalsIgnoreCase(p.getCategoria()))
                .limit(limit)
                .toList();
        if (relacionados.size() < limit) {
            relacionados = todos.stream()
                    .filter(p -> !p.getId().equals(id))
                    .filter(p -> p.getStock() == null || p.getStock() > 0)
                    .limit(limit)
                    .toList();
        }
        return ResponseEntity.ok(relacionados);
    }

    @PostMapping
    public ResponseEntity<?> crearProducto(@Valid @RequestBody Producto producto) {
        if (producto.getPrecioOriginal() == null) {
            producto.setPrecioOriginal(producto.getPrecio());
        }
        Producto guardado = productoRepository.save(producto);
        return ResponseEntity.status(201).body(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id,
                                                 @Valid @RequestBody Producto productoEntrante) {
        return productoRepository.findById(id).map(existente -> {
            if (productoEntrante.getNombre() != null) existente.setNombre(productoEntrante.getNombre());
            if (productoEntrante.getDescripcion() != null) existente.setDescripcion(productoEntrante.getDescripcion());
            if (productoEntrante.getPrecio() != null) {
                if (existente.getPrecioOriginal() == null) existente.setPrecioOriginal(productoEntrante.getPrecio());
                existente.setPrecio(productoEntrante.getPrecio());
            }
            if (productoEntrante.getPrecioOriginal() != null) existente.setPrecioOriginal(productoEntrante.getPrecioOriginal());
            if (productoEntrante.getDescuento() != null) existente.setDescuento(productoEntrante.getDescuento());
            if (productoEntrante.getStock() != null) existente.setStock(productoEntrante.getStock());
            if (productoEntrante.getImagenUrl() != null) existente.setImagenUrl(productoEntrante.getImagenUrl());
            if (productoEntrante.getImagenes() != null) existente.setImagenes(productoEntrante.getImagenes());
            if (productoEntrante.getCategoria() != null) existente.setCategoria(productoEntrante.getCategoria());
            if (productoEntrante.getProveedor() != null) existente.setProveedor(productoEntrante.getProveedor());
            if (productoEntrante.getColor() != null) existente.setColor(productoEntrante.getColor());
            if (productoEntrante.getTallas() != null) existente.setTallas(productoEntrante.getTallas());
            if (productoEntrante.getDestacado() != null) existente.setDestacado(productoEntrante.getDestacado());
            return ResponseEntity.ok(productoRepository.save(existente));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> actualizarStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return productoRepository.findById(id).map(p -> {
            Integer stock = body.get("stock");
            if (stock == null) return ResponseEntity.badRequest().build();
            p.setStock(stock);
            return ResponseEntity.ok(productoRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        if (!productoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/estadisticas/resumen")
    public ResponseEntity<Map<String, Object>> estadisticas() {
        List<Producto> todos = productoRepository.findAll();
        long totalProductos = todos.size();
        long activos = todos.stream().filter(p -> p.getStock() != null && p.getStock() > 0).count();
        long agotados = totalProductos - activos;
        double valorInventario = todos.stream()
                .mapToDouble(p -> (p.getPrecio() != null ? p.getPrecio() : 0) * (p.getStock() != null ? p.getStock() : 0))
                .sum();
        return ResponseEntity.ok(Map.of(
                "totalProductos", totalProductos,
                "activos", activos,
                "agotados", agotados,
                "valorInventario", Math.round(valorInventario * 100.0) / 100.0
        ));
    }
}
