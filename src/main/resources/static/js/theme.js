// =======================================================
// URBAN STEPS - SISTEMA DE MODO OSCURO GLOBAL
// =======================================================

(function () {
    const STORAGE_KEY = 'urban_steps_theme';

    function obtenerTemaGuardado() {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado === 'dark' || guardado === 'light') {
            return guardado;
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function aplicarTema(tema) {
        document.documentElement.setAttribute('data-bs-theme', tema);
        if (document.body) {
            if (tema === 'dark') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }

        // Actualizar todos los botones e iconos de cambio de tema
        document.querySelectorAll('.btn-theme-toggle, #btn-theme-toggle').forEach(btn => {
            if (tema === 'dark') {
                btn.innerHTML = '<i class="bi bi-sun-fill text-warning fs-6"></i>';
                btn.title = 'Cambiar a modo claro ☀️';
                btn.setAttribute('aria-label', 'Modo Claro');
            } else {
                btn.innerHTML = '<i class="bi bi-moon-stars-fill text-white fs-6"></i>';
                btn.title = 'Cambiar a modo oscuro 🌙';
                btn.setAttribute('aria-label', 'Modo Oscuro');
            }
        });
    }

    window.toggleModoOscuro = function () {
        const actual = document.documentElement.getAttribute('data-bs-theme') || obtenerTemaGuardado();
        const nuevo = actual === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, nuevo);
        aplicarTema(nuevo);

        if (typeof mostrarToast === 'function') {
            mostrarToast(nuevo === 'dark' ? 'Modo Oscuro activado 🌙' : 'Modo Claro activado ☀️', 'info');
        } else if (typeof toast === 'function') {
            toast(nuevo === 'dark' ? 'Modo Oscuro activado 🌙' : 'Modo Claro activado ☀️', 'info');
        } else if (typeof mostrarToastPerfil === 'function') {
            mostrarToastPerfil(nuevo === 'dark' ? 'Modo Oscuro activado 🌙' : 'Modo Claro activado ☀️', 'info');
        }
    };

    // Aplicar inmediatamente para evitar destello blanco
    const temaInicial = obtenerTemaGuardado();
    document.documentElement.setAttribute('data-bs-theme', temaInicial);

    document.addEventListener('DOMContentLoaded', () => {
        aplicarTema(obtenerTemaGuardado());

        document.querySelectorAll('.btn-theme-toggle, #btn-theme-toggle').forEach(btn => {
            btn.removeEventListener('click', window.toggleModoOscuro);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.toggleModoOscuro();
            });
        });
    });
})();
