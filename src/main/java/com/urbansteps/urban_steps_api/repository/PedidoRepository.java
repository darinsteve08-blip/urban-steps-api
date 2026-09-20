package com.urbansteps.urban_steps_api.repository;

import com.urbansteps.urban_steps_api.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.productos ORDER BY p.id DESC")
    List<Pedido> findAllByOrderByIdDesc();

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.productos WHERE p.emailCliente = :emailCliente ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByEmailClienteOrderByFechaCreacionDesc(@Param("emailCliente") String emailCliente);
}
