package com.urbansteps.urban_steps_api.service;
import com.urbansteps.urban_steps_api.model.Usuario;
import com.urbansteps.urban_steps_api.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));

        // La cuenta principal admin@urbansteps.com nunca puede ser bloqueada
        boolean isSuperAdmin = "admin@urbansteps.com".equalsIgnoreCase(usuario.getEmail());
        boolean isActivo = isSuperAdmin || (usuario.getActivo() == null || usuario.getActivo());

        return User.builder()
                .username(usuario.getEmail())
                .password(usuario.getPassword())
                .authorities(usuario.getRol()) // Asigna ROLE_ADMIN o ROLE_CLIENTE
                .disabled(!isActivo)
                .build();
    }
}
