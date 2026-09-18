package com.urbansteps.urban_steps_api.repository;

import com.urbansteps.urban_steps_api.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByEmailClienteOrderByFechaCreacionDesc(String emailCliente);
}
