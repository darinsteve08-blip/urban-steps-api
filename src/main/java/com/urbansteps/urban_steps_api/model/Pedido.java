package com.urbansteps.urban_steps_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(max = 150, message = "El nombre no debe exceder 150 caracteres")
    @Column(nullable = false, length = 150)
    private String nombreCliente;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Formato de correo inválido")
    @Size(max = 120, message = "El email no debe exceder 120 caracteres")
    @Column(nullable = false, length = 120)
    private String emailCliente;

    @Size(max = 255, message = "La dirección no debe exceder 255 caracteres")
    @Column(length = 255)
    private String direccion;

    @Size(max = 80, message = "La ciudad no debe exceder 80 caracteres")
    @Column(length = 80)
    private String ciudad;

    @Size(max = 30, message = "El teléfono no debe exceder 30 caracteres")
    @Column(length = 30)
    private String telefono;

    @NotNull(message = "El total es obligatorio")
    @DecimalMin(value = "0.0", message = "El total no puede ser negativo")
    @Column(nullable = false)
    private Double total;

    @Size(max = 50, message = "El método de pago no debe exceder 50 caracteres")
    @Column(length = 50)
    private String metodoPago;

    @Size(max = 30, message = "El estado no debe exceder 30 caracteres")
    @Column(length = 30)
    private String estado;

    @Size(max = 80, message = "La transportadora no debe exceder 80 caracteres")
    @Column(length = 80)
    private String transportadora;

    @Size(max = 80, message = "El número de guía no debe exceder 80 caracteres")
    @Column(length = 80)
    private String numeroGuia;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "pedido_id")
    private List<DetallePedido> productos;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
        if (estado == null || estado.isBlank()) estado = "PENDIENTE";
    }

    public String getEmailCliente() { return emailCliente; }
    public void setEmailCliente(String emailCliente) { this.emailCliente = emailCliente; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombreCliente() { return nombreCliente; }
    public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getTransportadora() { return transportadora; }
    public void setTransportadora(String transportadora) { this.transportadora = transportadora; }

    public String getNumeroGuia() { return numeroGuia; }
    public void setNumeroGuia(String numeroGuia) { this.numeroGuia = numeroGuia; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public List<DetallePedido> getProductos() { return productos; }
    public void setProductos(List<DetallePedido> productos) { this.productos = productos; }
}
