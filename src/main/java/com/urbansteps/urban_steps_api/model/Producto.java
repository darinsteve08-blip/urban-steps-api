package com.urbansteps.urban_steps_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 120, message = "El nombre no debe exceder 120 caracteres")
    @Column(nullable = false, length = 120)
    private String nombre;

    @Size(max = 600, message = "La descripción no debe exceder 600 caracteres")
    @Column(length = 600)
    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @Min(value = 0, message = "El precio no puede ser negativo")
    @Column(nullable = false)
    private Double precio;

    @Min(value = 0, message = "El precio original no puede ser negativo")
    private Double precioOriginal;

    @Min(value = 0, message = "El descuento no puede ser negativo")
    @Max(value = 100, message = "El descuento no puede superar el 100%")
    private Integer descuento;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    @Column(nullable = false)
    private Integer stock;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Column(length = 2000)
    private String imagenes;

    @Size(max = 60, message = "La categoría no debe exceder 60 caracteres")
    @Column(length = 60)
    private String categoria;

    @Size(max = 120, message = "El proveedor no debe exceder 120 caracteres")
    @Column(length = 120)
    private String proveedor;

    @Column(length = 120)
    private String color;

    @Column(length = 120)
    private String tallas;

    @Column(nullable = false)
    private Boolean destacado = false;

    public Producto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Double getPrecio() {
        if (precio == null) return 0.0;
        if (descuento != null && descuento > 0) {
            return Math.round(precio * (1 - (descuento / 100.0)) * 100.0) / 100.0;
        }
        return precio;
    }
    public void setPrecio(Double precio) { this.precio = precio; }

    public Double getPrecioOriginal() {
        return precioOriginal != null ? precioOriginal : precio;
    }
    public void setPrecioOriginal(Double precioOriginal) { this.precioOriginal = precioOriginal; }

    public Integer getDescuento() { return descuento; }
    public void setDescuento(Integer descuento) { this.descuento = descuento; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }

    public String getImagenes() { return imagenes; }
    public void setImagenes(String imagenes) { this.imagenes = imagenes; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getProveedor() { return proveedor; }
    public void setProveedor(String proveedor) { this.proveedor = proveedor; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getTallas() { return tallas; }
    public void setTallas(String tallas) { this.tallas = tallas; }

    public Boolean getDestacado() { return destacado; }
    public void setDestacado(Boolean destacado) { this.destacado = destacado != null ? destacado : false; }

    public String getImagen() { return imagenUrl; }
    public void setImagen(String imagen) { this.imagenUrl = imagen; }
}
