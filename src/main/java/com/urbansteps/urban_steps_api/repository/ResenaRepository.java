package com.urbansteps.urban_steps_api.repository;

import com.urbansteps.urban_steps_api.model.Resena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {

    List<Resena> findByProductoIdOrderByFechaDesc(Long productoId);

    Optional<Resena> findByProductoIdAndUsuarioEmail(Long productoId, String usuarioEmail);

    long countByProductoId(Long productoId);
}
