package com.urbansteps.urban_steps_api.config;

import com.urbansteps.urban_steps_api.model.Producto;
import com.urbansteps.urban_steps_api.model.Resena;
import com.urbansteps.urban_steps_api.model.Usuario;
import com.urbansteps.urban_steps_api.repository.ProductoRepository;
import com.urbansteps.urban_steps_api.repository.ResenaRepository;
import com.urbansteps.urban_steps_api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ResenaRepository resenaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        usuarioRepository.findByEmail("admin@urbansteps.com").ifPresentOrElse(
            admin -> {
                admin.setActivo(true);
                admin.setRol("ROLE_ADMIN");
                usuarioRepository.save(admin);
                System.out.println(">>> Usuario Administrador verificado y activo: admin@urbansteps.com");
            },
            () -> {
                Usuario admin = new Usuario();
                admin.setEmail("admin@urbansteps.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setNombre("Administrador Urban Steps");
                admin.setRol("ROLE_ADMIN");
                admin.setTelefono("+57 300 123 4567");
                admin.setDireccion("Calle Principal #123, Bogotá");
                admin.setActivo(true);
                usuarioRepository.save(admin);
                System.out.println(">>> Usuario Administrador creado: admin@urbansteps.com / admin123");
            }
        );

        usuarioRepository.findByEmail("cliente@urbansteps.com").ifPresentOrElse(
            cliente -> {
                cliente.setActivo(true);
                usuarioRepository.save(cliente);
            },
            () -> {
                Usuario cliente = new Usuario();
                cliente.setEmail("cliente@urbansteps.com");
                cliente.setPassword(passwordEncoder.encode("cliente123"));
                cliente.setNombre("Cliente Demo");
                cliente.setRol("ROLE_USER");
                cliente.setTelefono("+57 310 987 6543");
                cliente.setDireccion("Carrera 45 #67-89, Medellín");
                cliente.setActivo(true);
                usuarioRepository.save(cliente);
                System.out.println(">>> Usuario Cliente demo creado: cliente@urbansteps.com / cliente123");
            }
        );

        if (productoRepository.count() == 0) {
            crearProductoDemo(
                    "Nike Air Max 270 Premium",
                    "Zapatillas deportivas con tecnología Air Max en el talón. Amortiguación superior para correr y uso diario. Diseño moderno y transpirable.",
                    459900.0, 529900.0, 15, 28,
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
                    "Deportivas", "Nike", "Rojo, Blanco, Negro", "38,39,40,41,42,43,44",
                    "{\"38\":3,\"39\":5,\"40\":6,\"41\":5,\"42\":5,\"43\":2,\"44\":2}",
                    true
            );
            crearProductoDemo(
                    "Adidas Ultraboost 23",
                    "Zapatillas running con suela Boost y tejido Primeknit. Máxima energía en cada zancada. Perfectas para entrenamientos de larga distancia.",
                    589900.0, 699900.0, 15, 15,
                    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
                    "Deportivas", "Adidas", "Negro, Verde, Blanco", "39,40,41,42,43",
                    "{\"39\":10,\"40\":0,\"41\":0,\"42\":5,\"43\":0}",
                    true
            );
            crearProductoDemo(
                    "Puma Suede Classic XXI",
                    "Clásicas zapatillas Puma Suede en su versión 2024. Gamuza premium, suela de goma y el icónico Formstrip lateral. Estilo urbano atemporal.",
                    289900.0, null, 0, 45,
                    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
                    "Urbanas", "Puma", "Azul Marino, Negro, Rojo", "37,38,39,40,41,42,43,44,45",
                    "{\"37\":5,\"38\":5,\"39\":5,\"40\":10,\"41\":10,\"42\":5,\"43\":3,\"44\":2}",
                    false
            );
            crearProductoDemo(
                    "Converse Chuck Taylor 70",
                    "Las legendarias Converse Chuck 70 con lona premium, costuras reforzadas y suela más gruesa. Un ícono de la moda urbana sin fecha de vencimiento.",
                    329900.0, 379900.0, 13, 3,
                    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
                    "Urbanas", "Converse", "Blanco, Negro, Rojo", "36,37,38,39,40,41,42",
                    "{\"36\":1,\"37\":0,\"38\":1,\"39\":0,\"40\":1,\"41\":0,\"42\":0}",
                    true
            );
            crearProductoDemo(
                    "Timberland Premium 6-Inch",
                    "Botas clásicas Timberland impermeables con cuero premium Nobuck. Ideal para aventuras al aire libre y look casual resistente.",
                    729900.0, null, 0, 12,
                    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80",
                    "Botas", "Timberland", "Amarillo Clásico, Marrón, Negro", "40,41,42,43,44,45",
                    "{\"40\":2,\"41\":2,\"42\":2,\"43\":2,\"44\":2,\"45\":2}",
                    false
            );
            crearProductoDemo(
                    "Vans Old Skool Pro",
                    "Las Vans Old Skool más la versión Pro con suela Off The Wall reforzada, plantilla acolchada y durabilidad extra para skate o uso diario intenso.",
                    249900.0, 319900.0, 22, 60,
                    "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=800&q=80",
                    "Urbanas", "Vans", "Negro, Blanco, Azul", "37,38,39,40,41,42,43,44",
                    "{\"37\":5,\"38\":10,\"39\":15,\"40\":15,\"41\":10,\"42\":5}",
                    false
            );
            crearProductoDemo(
                    "New Balance 530 Retro",
                    "Zapatillas lifestyle con estética running de los 2000. Entresuela ABZORB, malla transpirable y detalles en cuero sintético. Comodidad todo el día.",
                    399900.0, null, 0, 20,
                    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=80",
                    "Deportivas", "New Balance", "Blanco, Azul, Gris", "38,39,40,41,42,43",
                    "{\"38\":3,\"39\":4,\"40\":5,\"41\":5,\"42\":3}",
                    false
            );
            crearProductoDemo(
                    "Dr. Martens 1460 Pascal",
                    "Las icónicas botas de 8 ojales en cuero suave Virginia. Plantilla AirWair con amortiguación y suela resistente al aceite, grasa y alcalinos.",
                    549900.0, 629900.0, 12, 8,
                    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
                    "Botas", "Dr. Martens", "Negro, Cereza", "36,37,38,39,40,41,42",
                    "{\"36\":1,\"37\":1,\"38\":2,\"39\":2,\"40\":1,\"41\":1,\"42\":0}",
                    true
            );
            System.out.println(">>> 8 productos demo cargados correctamente en la base de datos");
        } else {
            // Asegurar que todos los productos existentes en base de datos tengan stock_por_talla
            List<Producto> existentes = productoRepository.findAll();
            for (Producto p : existentes) {
                if (p.getStockPorTalla() == null || p.getStockPorTalla().isBlank()) {
                    p.setStockPorTalla(generarStockPorTallaAutomatico(p.getTallas(), p.getStock()));
                    productoRepository.save(p);
                }
            }
        }

        if (resenaRepository.count() == 0) {
            List<Producto> productos = productoRepository.findAll();
            if (!productos.isEmpty()) {
                Producto p1 = productos.get(0);
                resenaRepository.save(new Resena(p1.getId(), "carlos.m@gmail.com", "Carlos Mendoza", 5, "¡Excelente calidad! Las zapatillas son súper cómodas, la amortiguación es increíble y llegaron rapidísimo a Bogotá. Muy recomendadas."));
                resenaRepository.save(new Resena(p1.getId(), "valeria.g@hotmail.com", "Valeria Gómez", 5, "Me encantó el diseño y los acabados. La talla es exacta como indica la tabla de medidas."));
                resenaRepository.save(new Resena(p1.getId(), "andres.p@gmail.com", "Andrés Pardo", 4, "Muy buenas zapatillas para entrenar y para vestir casual. 100% originales."));

                if (productos.size() > 1) {
                    Producto p2 = productos.get(1);
                    resenaRepository.save(new Resena(p2.getId(), "daniela.r@gmail.com", "Daniela Ramírez", 5, "La comodidad de estas zapatillas no tiene comparación. Llegaron en su caja original y perfectas condiciones."));
                    resenaRepository.save(new Resena(p2.getId(), "felipe.s@yahoo.com", "Felipe Silva", 5, "Una compra 10/10. La atención al cliente por WhatsApp también fue muy ágil."));
                }
                if (productos.size() > 2) {
                    Producto p3 = productos.get(2);
                    resenaRepository.save(new Resena(p3.getId(), "laura.v@gmail.com", "Laura Vargas", 5, "Hermosas, combinan con todo y la suela es muy resistente."));
                }
                System.out.println(">>> Reseñas y calificaciones demo inicializadas con éxito");
            }
        }
    }

    private void crearProductoDemo(String nombre, String descripcion, Double precio, Double precioOriginal,
                                   Integer descuento, int stock, String imagenUrl,
                                   String categoria, String proveedor, String color, String tallas,
                                   String stockPorTalla, boolean destacado) {
        Producto p = new Producto();
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setPrecio(precio);
        p.setPrecioOriginal(precioOriginal);
        p.setDescuento(descuento);
        p.setStock(stock);
        p.setImagenUrl(imagenUrl);
        p.setCategoria(categoria);
        p.setProveedor(proveedor);
        p.setColor(color);
        p.setTallas(tallas);
        p.setStockPorTalla(stockPorTalla);
        p.setDestacado(destacado);
        productoRepository.save(p);
    }

    private String generarStockPorTallaAutomatico(String tallasStr, Integer stockTotal) {
        if (tallasStr == null || tallasStr.isBlank()) return "{}";
        String[] arr = tallasStr.replace("[", "").replace("]", "").replace("\"", "").split(",");
        java.util.List<String> tallas = new java.util.ArrayList<>();
        for (String t : arr) {
            String limpio = t.trim();
            if (!limpio.isEmpty()) tallas.add(limpio);
        }
        if (tallas.isEmpty()) return "{}";

        int total = stockTotal != null && stockTotal > 0 ? stockTotal : 0;
        int basePorTalla = total / tallas.size();
        int residuo = total % tallas.size();

        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < tallas.size(); i++) {
            int qty = basePorTalla + (i < residuo ? 1 : 0);
            sb.append("\"").append(tallas.get(i)).append("\":").append(qty);
            if (i < tallas.size() - 1) sb.append(",");
        }
        sb.append("}");
        return sb.toString();
    }
}
