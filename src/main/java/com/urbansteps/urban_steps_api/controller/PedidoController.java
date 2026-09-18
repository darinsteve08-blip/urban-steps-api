package com.urbansteps.urban_steps_api.controller;

import com.urbansteps.urban_steps_api.model.DetallePedido;
import com.urbansteps.urban_steps_api.model.Pedido;
import com.urbansteps.urban_steps_api.model.Producto;
import com.urbansteps.urban_steps_api.repository.PedidoRepository;
import com.urbansteps.urban_steps_api.repository.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Pedido> listarPedidos() {
        return pedidoRepository.findAll();
    }

    @GetMapping("/mis-pedidos")
    public ResponseEntity<?> misPedidos() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "No autenticado");
            error.put("message", "Debes iniciar sesión para ver tus pedidos");
            return ResponseEntity.status(401).body(error);
        }

        String email = auth.getName();
        List<Pedido> pedidos = pedidoRepository.findByEmailClienteOrderByFechaCreacionDesc(email);
        return ResponseEntity.ok(pedidos);
    }

    @PostMapping
    public ResponseEntity<?> crearPedido(@Valid @RequestBody Pedido nuevoPedido) {
        if (nuevoPedido.getEstado() == null || nuevoPedido.getEstado().isEmpty()) {
            nuevoPedido.setEstado("PENDIENTE");
        }

        if (nuevoPedido.getProductos() == null || nuevoPedido.getProductos().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Pedido vacío");
            error.put("message", "El pedido debe tener al menos un producto");
            return ResponseEntity.badRequest().body(error);
        }

        for (DetallePedido detalle : nuevoPedido.getProductos()) {
            Producto producto = productoRepository.findById(detalle.getProductoId()).orElse(null);
            if (producto == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Producto no encontrado");
                error.put("message", "El producto con ID " + detalle.getProductoId() + " no existe");
                return ResponseEntity.badRequest().body(error);
            }
            if (producto.getStock() < detalle.getCantidad()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Stock insuficiente");
                error.put("message", "El producto '" + producto.getNombre() + "' solo tiene " + producto.getStock() + " unidades disponibles");
                error.put("productoId", String.valueOf(producto.getId()));
                error.put("stockDisponible", String.valueOf(producto.getStock()));
                return ResponseEntity.badRequest().body(error);
            }
        }

        for (DetallePedido detalle : nuevoPedido.getProductos()) {
            Producto producto = productoRepository.findById(detalle.getProductoId()).get();
            producto.setStock(producto.getStock() - detalle.getCantidad());
            if (detalle.getNombreProducto() == null || detalle.getNombreProducto().isBlank()) {
                detalle.setNombreProducto(producto.getNombre());
            }
            if (detalle.getImagenProducto() == null || detalle.getImagenProducto().isBlank()) {
                detalle.setImagenProducto(producto.getImagen());
            }
            productoRepository.save(producto);
        }

        Pedido pedidoGuardado = pedidoRepository.save(nuevoPedido);
        return ResponseEntity.ok(pedidoGuardado);
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarPedido(@PathVariable Long id) {
        Pedido pedido = pedidoRepository.findById(id).orElse(null);
        if (pedido == null) {
            return ResponseEntity.notFound().build();
        }

        if ("CANCELADO".equals(pedido.getEstado())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Ya cancelado");
            error.put("message", "Este pedido ya se encuentra cancelado");
            return ResponseEntity.badRequest().body(error);
        }

        String estadoAnterior = pedido.getEstado();
        pedido.setEstado("CANCELADO");

        if (!"COMPLETADO".equals(estadoAnterior) && pedido.getProductos() != null) {
            for (DetallePedido detalle : pedido.getProductos()) {
                productoRepository.findById(detalle.getProductoId()).ifPresent(producto -> {
                    producto.setStock(producto.getStock() + detalle.getCantidad());
                    productoRepository.save(producto);
                });
            }
        }

        pedidoRepository.save(pedido);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("ok", true);
        respuesta.put("message", "Pedido cancelado correctamente. El stock ha sido reestablecido.");
        respuesta.put("pedidoId", pedido.getId());
        return ResponseEntity.ok(respuesta);
    }

    @PutMapping("/{id}/completar")
    public ResponseEntity<?> completarPedido(@PathVariable Long id) {
        Pedido pedido = pedidoRepository.findById(id).orElse(null);
        if (pedido == null) {
            return ResponseEntity.notFound().build();
        }

        pedido.setEstado("COMPLETADO");
        pedidoRepository.save(pedido);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("ok", true);
        respuesta.put("message", "Pedido marcado como completado");
        respuesta.put("pedidoId", pedido.getId());
        return ResponseEntity.ok(respuesta);
    }
}
