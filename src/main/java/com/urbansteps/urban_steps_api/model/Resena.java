package com.urbansteps.urban_steps_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resenas")
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El ID de producto es obligatorio")
    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    @NotBlank(message = "El correo del usuario es obligatorio")
    @Column(name = "usuario_email", nullable = false, length = 120)
    private String usuarioEmail;

    @NotBlank(message = "El nombre del usuario es obligatorio")
    @Column(name = "usuario_nombre", nullable = false, length = 100)
    private String usuarioNombre;

    @NotNull(message = "La calificación es obligatoria")
    @Min(value = 1, message = "La calificación mínima es 1 estrella")
    @Max(value = 5, message = "La calificación máxima es 5 estrellas")
    @Column(nullable = false)
    private Integer calificacion;

    @Size(max = 1000, message = "El comentario no debe exceder 1000 caracteres")
    @Column(length = 1000)
    private String comentario;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    public Resena() {
        this.fecha = LocalDateTime.now();
    }

    public Resena(Long productoId, String usuarioEmail, String usuarioNombre, Integer calificacion, String comentario) {
        this.productoId = productoId;
        this.usuarioEmail = usuarioEmail;
        this.usuarioNombre = usuarioNombre;
        this.calificacion = calificacion;
        this.comentario = comentario;
        this.fecha = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public Integer getCalificacion() { return calificacion; }
    public void setCalificacion(Integer calificacion) { this.calificacion = calificacion; }

    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }

    public LocalDateTime getFecha() { return fecha != null ? fecha : LocalDateTime.now(); }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
