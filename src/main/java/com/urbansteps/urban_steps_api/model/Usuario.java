package com.urbansteps.urban_steps_api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Formato de correo inválido")
    @Size(max = 120, message = "El correo no debe exceder 120 caracteres")
    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 4, max = 200, message = "La contraseña debe tener entre 4 y 200 caracteres")
    @Column(nullable = false, length = 200)
    private String password;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no debe exceder 100 caracteres")
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "El rol es obligatorio")
    @Size(max = 30, message = "El rol no debe exceder 30 caracteres")
    @Column(nullable = false, length = 30)
    private String rol;

    @Size(max = 30, message = "El teléfono no debe exceder 30 caracteres")
    @Column(length = 30)
    private String telefono;

    @Size(max = 255, message = "La dirección no debe exceder 255 caracteres")
    @Column(length = 255)
    private String direccion;

    @Size(max = 500, message = "La URL del avatar no debe exceder 500 caracteres")
    @Column(length = 500)
    private String avatarUrl;

    public Usuario() {}

    public Usuario(String email, String password, String nombre, String rol) {
        this.email = email;
        this.password = password;
        this.nombre = nombre;
        this.rol = rol;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
