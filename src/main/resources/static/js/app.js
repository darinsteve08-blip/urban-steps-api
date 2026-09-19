// ==========================================
// ESTADO GLOBAL Y VARIABLES
// ==========================================
let categoriaActualFiltro = 'TODOS';
let ordenActualProductos = 'FECHA_DESC';
window.usuarioEsAdminGlobal = false;
window.productosGlobal = [];

// ==========================================
// INICIALIZACIÓN (DOMContentLoaded)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarSesion();
    cargarProductos();
    verificarAccesoAdminUI();
    verificarSesion();
    actualizarContadorCarrito();
    actualizarModalCarritoMini();

    const modalCarritoEl = document.getElementById('modalCarrito');
    if (modalCarritoEl) {
        modalCarritoEl.addEventListener('show.bs.modal', actualizarModalCarritoMini);
    }
});

// ==========================================
// MANEJO SEGURO DE SESIÓN
// ==========================================
function obtenerUsuarioSesion() {
    try {
        const usuarioStorage = localStorage.getItem('usuario');
        return usuarioStorage ? JSON.parse(usuarioStorage) : null;
    } catch (error) {
        console.error('Error al procesar la sesión local:', error);
        localStorage.removeItem('usuario'); // Limpia datos corruptos para evitar bucles
        return null;
    }
}

function inicializarSesion() {
    const usuario = obtenerUsuarioSesion();
    const estaEnPerfil = window.location.pathname.includes('perfil.html');

    if (usuario && (usuario.email || usuario.nombre)) {
        const rol = (usuario.rol || '').toUpperCase();
        const esAdmin = rol === 'ROLE_ADMIN' || rol === 'ADMIN';
        const esOperario = rol === 'ROLE_OPERARIO' || rol === 'OPERARIO';
        window.usuarioEsAdminGlobal = esAdmin || esOperario;
        window.usuarioActual = usuario;

        actualizarInterfazUsuario(usuario, esAdmin, esOperario);

        // Actualiza indicadores de rol y perfil en el navbar si existen
        const rolBadge = document.getElementById('rol-badge');
        if (rolBadge && usuario.rol) {
            rolBadge.textContent = usuario.rol;
        }

        const navLoginLink = document.getElementById('nav-login-link');
        if (navLoginLink) {
            navLoginLink.textContent = `Hola, ${usuario.nombre || usuario.username || 'Mi Perfil'}`;
            navLoginLink.href = 'perfil.html';
        }

        mostrarDatosUsuarioEnHeader(usuario);
    } else {
        // Redirige solo si intenta ingresar a la vista de perfil sin sesión activa
        if (estaEnPerfil) {
            window.location.href = 'login.html';
        }
    }
}

function mostrarDatosUsuarioEnHeader(usuario) {
    const contenedorUsuario = document.getElementById('usuario-header');
    if (!contenedorUsuario) return;

    contenedorUsuario.innerHTML = `
        <span>Bienvenido, <strong>${usuario.nombre || usuario.username || usuario.email || 'Usuario'}</strong></span>
        <button id="btn-logout" class="btn btn-sm btn-outline-danger ms-2">Cerrar Sesión</button>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);
}

// Función global para Cerrar Sesión (Backend + LocalStorage)
async function cerrarSesion() {
    try {
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {
        console.error('Error al cerrar sesión en el servidor:', e);
    }

    localStorage.removeItem('usuario');
    localStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';
}
window.cerrarSesion = cerrarSesion;

// ==========================================
// AUXILIAR PARA PETICIONES SEGURAS (EVITA SyntaxError)
// ==========================================
async function realizarPeticionSegura(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);
    const tipoContenido = respuesta.headers.get('content-type') || '';

    if (!respuesta.ok) {
        let mensajeError = `Error HTTP ${respuesta.status}`;
        if (tipoContenido.includes('application/json')) {
            const errData = await respuesta.json();
            mensajeError = errData.mensaje || errData.error || mensajeError;
        } else {
            const textoError = await respuesta.text();
            mensajeError = textoError || mensajeError;
        }
        throw new Error(mensajeError);
    }

    if (tipoContenido.includes('application/json')) {
        return await respuesta.json();
    }
    return null;
}

// ==========================================
// CONTROL DE ACCESO ADMIN
// ==========================================
// Muestra u oculta el panel de admin en la interfaz local
function verificarAccesoAdminUI() {
    const usuario = obtenerUsuarioSesion();
    const panelAdmin = document.getElementById('panel-admin');

    if (panelAdmin) {
        if (usuario && (usuario.rol === 'ADMIN' || usuario.rol === 'ROLE_ADMIN' || usuario.esAdmin)) {
            panelAdmin.style.display = 'block';
            window.usuarioEsAdminGlobal = true;
        } else {
            panelAdmin.style.display = 'none';
            window.usuarioEsAdminGlobal = false;
        }
    }
}

// Función para verificar permiso de administrador y abrir el modal de nuevo producto
window.verificarAccesoAdmin = function(event) {
    if (event) event.preventDefault();

    const usuario = obtenerUsuarioSesion() || window.usuarioActual;
    const rol = (usuario?.rol || '').toUpperCase();
    const esAdmin = rol === 'ADMIN' || rol === 'ROLE_ADMIN' || rol === 'OPERARIO' || rol === 'ROLE_OPERARIO' || window.usuarioEsAdminGlobal;

    if (!esAdmin) {
        alert('Debes iniciar sesión como Administrador para agregar productos.');
        window.location.href = 'login.html';
        return;
    }

    const modalEl = document.getElementById('modalAgregarProducto');
    if (modalEl) {
        if (window.bootstrap && bootstrap.Modal) {
            const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
            bsModal.show();
        } else {
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
        }
    }
};

// ==========================================
// FILTROS Y ORDENAMIENTO DE PRODUCTOS
// ==========================================
function normalizarTexto(txt) {
    return (txt || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

window.filtrarCategoria = function(categoria, boton) {
    categoriaActualFiltro = categoria;

    if (boton && boton.parentElement) {
        boton.parentElement.querySelectorAll('button').forEach(b => {
            b.classList.replace('btn-dark', 'btn-outline-dark');
        });
        boton.classList.replace('btn-outline-dark', 'btn-dark');
    }

    aplicarFiltrosProductos();
};

function aplicarFiltrosProductos() {
    let listaFiltrada = window.productosGlobal ?? [];

    // 1. Filtro por Categoría
    const filtroNorm = normalizarTexto(categoriaActualFiltro);
    if (filtroNorm !== 'TODOS' && filtroNorm !== 'TODAS' && filtroNorm !== '') {
        listaFiltrada = listaFiltrada.filter(p => {
            const catProducto = normalizarTexto(p.categoria);
            const catProductoSinS = catProducto.replace(/S$/, '');
            const filtroSinS = filtroNorm.replace(/S$/, '');

            return catProductoSinS === filtroSinS ||
                   catProducto.includes(filtroSinS) ||
                   catProducto.includes(filtroNorm) ||
                   filtroNorm.includes(catProductoSinS);
        });
    }

    // 2. Filtro por Búsqueda de Texto
    const inputBuscar = document.getElementById('input-buscar-tienda');
    if (inputBuscar && inputBuscar.value.trim() !== '') {
        const texto = normalizarTexto(inputBuscar.value);
        listaFiltrada = listaFiltrada.filter(p =>
            normalizarTexto(p.nombre).includes(texto) ||
            normalizarTexto(p.descripcion).includes(texto)
        );
    }

    // 3. Filtro por Talla
    const selectTalla = document.getElementById('filtro-talla');
    const tallaFiltro = selectTalla ? selectTalla.value : 'TODAS';
    if (tallaFiltro && tallaFiltro !== 'TODAS') {
        listaFiltrada = listaFiltrada.filter(p => {
            if (Array.isArray(p.tallasDisponibles) && p.tallasDisponibles.length > 0) {
                return p.tallasDisponibles.some(t => String(t).trim() === String(tallaFiltro));
            }
            if (typeof p.tallas === 'string') {
                return p.tallas.split(',').map(t => t.trim()).includes(String(tallaFiltro));
            }
            if (p.talla) {
                return String(p.talla).trim() === String(tallaFiltro);
            }
            return false;
        });
    }

    // 4. Filtro por Rango de Precios (Slider)
    const sliderPrecio = document.getElementById('filtro-precio-slider');
    if (sliderPrecio) {
        const valMax = Number(sliderPrecio.value);
        const maxPermitido = Number(sliderPrecio.max || 800000);
        if (valMax < maxPermitido) {
            listaFiltrada = listaFiltrada.filter(p => {
                const precioFinal = (p.descuento > 0)
                    ? (p.precio * (1 - p.descuento / 100))
                    : p.precio;
                return precioFinal <= valMax;
            });
        }
    }

    listaFiltrada = ordenarListaProductos(listaFiltrada);
    renderizarProductos(listaFiltrada);
}
window.aplicarFiltrosProductos = aplicarFiltrosProductos;

window.actualizarLabelPrecio = function(val) {
    const label = document.getElementById('valor-precio-filtro');
    const slider = document.getElementById('filtro-precio-slider');
    if (!label) return;
    const max = slider ? Number(slider.max || 800000) : 800000;
    if (Number(val) >= max) {
        label.innerText = 'Sin límite';
        label.className = 'badge bg-dark fw-bold px-3 py-1 rounded-pill';
    } else {
        label.innerText = `Hasta $${Number(val).toLocaleString('es-CO')} COP`;
        label.className = 'badge bg-danger fw-bold px-3 py-1 rounded-pill';
    }
};

window.limpiarFiltrosAvanzados = function() {
    const inputBuscar = document.getElementById('input-buscar-tienda');
    if (inputBuscar) inputBuscar.value = '';

    const selectTalla = document.getElementById('filtro-talla');
    if (selectTalla) selectTalla.value = 'TODAS';

    const slider = document.getElementById('filtro-precio-slider');
    if (slider) {
        slider.value = slider.max || 800000;
        window.actualizarLabelPrecio(slider.value);
    }

    const selectOrdenar = document.getElementById('select-ordenar');
    if (selectOrdenar) selectOrdenar.value = 'FECHA_DESC';
    ordenActualProductos = 'FECHA_DESC';

    const primerBoton = document.querySelector('#botones-categorias button');
    if (primerBoton) {
        filtrarCategoria('TODOS', primerBoton);
    } else {
        aplicarFiltrosProductos();
    }
};

window.ordenarProductos = function(valor) {
    ordenActualProductos = valor;
    aplicarFiltrosProductos();
};

function ordenarListaProductos(lista) {
    const copia = [...lista];
    switch (ordenActualProductos) {
        case 'PRECIO_ASC':
            return copia.sort((a, b) => Number(a.precio) - Number(b.precio));
        case 'PRECIO_DESC':
            return copia.sort((a, b) => Number(b.precio) - Number(a.precio));
        case 'NOMBRE_ASC':
            return copia.sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
        case 'STOCK_ASC':
            return copia.sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0));
        case 'FECHA_DESC':
        default:
            return copia.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
    }
}

window.filtrarTienda = function() {
    aplicarFiltrosProductos();
};

// ==========================================
// CARGA Y PROCESAMIENTO DE PRODUCTOS (SPRING BOOT)
// ==========================================
async function cargarProductos() {
    const contenedor = document.getElementById('grid-productos-tienda') || document.getElementById('contenedor-productos');
    if (!contenedor) return;

    contenedor.innerHTML = generarSkeletonLoading(6);

    try {
        const data = await realizarPeticionSegura('/api/productos');

        if (data && data.length > 0) {
            console.log('Productos cargados desde la BD:', data);
            window.productosGlobal = data.map(p => {
                let tallasArray = ['40'];
                const campoTallas = p.tallas ?? p.talla ?? p.tallasDisponibles ?? p.sizes;
                if (campoTallas) {
                    if (typeof campoTallas === 'string') {
                        tallasArray = campoTallas.replace(/[\[\]"]+/g, '').split(',').map(t => t.trim()).filter(Boolean);
                    } else if (Array.isArray(campoTallas)) {
                        tallasArray = campoTallas;
                    }
                }

                let coloresArray = [];
                const campoColores = p.color ?? p.colores;
                if (campoColores) {
                    if (typeof campoColores === 'string') {
                        coloresArray = campoColores.replace(/[\[\]"]+/g, '').split(',').map(c => c.trim()).filter(Boolean);
                    } else if (Array.isArray(campoColores)) {
                        coloresArray = campoColores;
                    }
                }

                const imagenesExtra = (typeof p.imagenes === 'string')
                    ? p.imagenes.split(',').map(u => u.trim()).filter(Boolean)
                    : [];

                return {
                    id: p.id,
                    nombre: p.nombre,
                    categoria: p.categoria ?? 'Urbana',
                    precio: Number(p.precio ?? 0),
                    precioOriginal: Number(p.precioOriginal ?? p.precio ?? 0),
                    descuento: Number(p.descuento ?? 0),
                    destacado: Boolean(p.destacado ?? p.featured),
                    stock: Number(p.stock ?? p.cantidad ?? 0),
                    descripcion: p.descripcion,
                    tallasDisponibles: tallasArray,
                    colores: coloresArray,
                    proveedor: p.proveedor ?? 'Urban Steps',
                    imagen: p.imagen ?? p.imagenUrl ?? p.imagen_url ?? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
                    imagenes: imagenesExtra
                };
            });
            aplicarFiltrosProductos();
        } else {
            contenedor.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted fs-5">No hay productos registrados en la base de datos.</p></div>`;
        }
    } catch (err) {
        console.error('Error al conectar con el backend:', err);
        contenedor.innerHTML = `<div class="col-12 text-center py-5"><p class="text-danger fs-5">Error de conexión con el servidor: ${err.message}</p></div>`;
    }
}

function generarSkeletonLoading(cantidad) {
    let html = '';
    for (let i = 0; i < cantidad; i++) {
        html += `
            <div class="col">
                <div class="card h-100 shadow-sm border-0">
                    <div class="placeholder-glow">
                        <div class="placeholder" style="height:200px;width:100%;border-radius:0;"></div>
                    </div>
                    <div class="card-body">
                        <span class="placeholder col-4 mb-2"></span>
                        <h5 class="placeholder-glow"><span class="placeholder col-8"></span></h5>
                        <p class="placeholder-glow mb-3">
                            <span class="placeholder col-12"></span>
                            <span class="placeholder col-10"></span>
                        </p>
                        <p class="placeholder-glow"><span class="placeholder col-4"></span></p>
                        <div class="d-flex gap-2 mt-3">
                            <span class="placeholder col-6" style="height:38px;border-radius:8px;"></span>
                            <span class="placeholder col-6" style="height:38px;border-radius:8px;"></span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
    return html;
}

// ==========================================
// LISTA DE DESEOS (WISHLIST / FAVORITOS)
// ==========================================
function obtenerKeyFavoritos() {
    const usuario = obtenerUsuarioSesion() || window.usuarioActual;
    const userIdentifier = usuario?.email || usuario?.username || 'invitado';
    return `favoritos_${userIdentifier}`;
}

function obtenerFavoritos() {
    try {
        const key = obtenerKeyFavoritos();
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch(e) {
        return [];
    }
}
window.obtenerFavoritos = obtenerFavoritos;

function esProductoFavorito(productoId) {
    const favs = obtenerFavoritos();
    return favs.some(id => String(id) === String(productoId));
}
window.esProductoFavorito = esProductoFavorito;

window.toggleFavorito = function(productoId, btnElement) {
    const usuario = obtenerUsuarioSesion() || window.usuarioActual;
    if (!usuario || (!usuario.email && !usuario.username)) {
        if (confirm("Inicia sesión para guardar zapatillas en tu Lista de Deseos ❤️. ¿Deseas iniciar sesión ahora?")) {
            window.location.href = 'login.html';
        }
        return;
    }

    const key = obtenerKeyFavoritos();
    let favs = obtenerFavoritos();
    const existe = favs.some(id => String(id) === String(productoId));

    if (existe) {
        favs = favs.filter(id => String(id) !== String(productoId));
        localStorage.setItem(key, JSON.stringify(favs));
        if (btnElement) {
            btnElement.innerHTML = '<i class="bi bi-heart text-secondary" style="font-size: 18px;"></i>';
            btnElement.title = 'Añadir a Favoritos';
        }
        if (typeof mostrarToastGlobal === 'function') {
            mostrarToastGlobal('Zapatilla eliminada de tus favoritos 💔', 'info');
        }
    } else {
        favs.push(productoId);
        localStorage.setItem(key, JSON.stringify(favs));
        if (btnElement) {
            btnElement.innerHTML = '<i class="bi bi-heart-fill text-danger" style="font-size: 18px;"></i>';
            btnElement.title = 'Quitar de Favoritos';
            btnElement.style.transform = 'scale(1.25)';
            setTimeout(() => { btnElement.style.transform = 'scale(1)'; }, 200);
        }
        if (typeof mostrarToastGlobal === 'function') {
            mostrarToastGlobal('¡Zapatilla añadida a tus favoritos! ❤️', 'success');
        }
    }

    const badge = document.getElementById('contadorFavoritosBadge');
    if (badge) badge.textContent = favs.length;
};

// RENDERIZADO DE PRODUCTOS EN CATÁLOGO
function renderizarProductos(listaProductos) {
    const contenedor = document.getElementById('grid-productos-tienda') || document.getElementById('contenedor-productos');
    if (!contenedor) return;

    const contador = document.getElementById('contador-productos');
    if (contador) {
        const total = listaProductos.length;
        contador.textContent = `${total} ${total === 1 ? 'producto' : 'productos'}`;
    }

    if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
        contenedor.innerHTML = `<div class="col-12 text-center py-5">
            <i class="bi bi-bag-x text-muted" style="font-size:56px;"></i>
            <p class="text-muted fs-5 mt-3">No se encontraron productos con estos filtros.</p>
        </div>`;
        return;
    }

    const esAdmin = Boolean(window.usuarioEsAdminGlobal);
    let html = '';

    listaProductos.forEach(producto => {
        const stock = Number(producto.stock ?? 0);
        const agotado = stock === 0;
        const pocoStock = !agotado && stock <= 3;
        const descuento = Number(producto.descuento ?? 0);
        const precioConDescuento = descuento > 0 ? (producto.precio * (1 - descuento / 100)) : producto.precio;
        const coloresHtml = (producto.colores?.length > 0)
            ? producto.colores.slice(0, 4).map(c => `<span class="badge bg-light text-dark border me-1">${c}</span>`).join('')
            : '';

        let badgesSuperiores = '';
        if (producto.destacado) badgesSuperiores += `<span class="badge bg-warning text-dark me-1 shadow-sm"><i class="bi bi-star-fill"></i> Destacado</span>`;
        if (descuento > 0) badgesSuperiores += `<span class="badge bg-danger me-1 shadow-sm">-${descuento}% OFF</span>`;
        if (agotado) badgesSuperiores += `<span class="badge bg-dark me-1 shadow-sm">Agotado</span>`;
        else if (pocoStock) badgesSuperiores += `<span class="badge bg-warning text-dark me-1 shadow-sm">¡Últimas ${stock}!</span>`;

        const esFav = esProductoFavorito(producto.id);

        // Generación limpia del botón de compra por ID
        const botonComprarHTML = `
            <button class="btn btn-comprar btn-sm w-100 fw-bold py-2"
                ${agotado ? 'disabled' : ''}
                onclick="agregarAlCarritoRapidoById(${producto.id})">
                <i class="bi bi-${agotado ? 'x-circle' : 'cart-plus'} me-1"></i> ${agotado ? 'Agotado' : 'Añadir al carrito'}
            </button>
        `;

        html += `
            <div class="col">
                <div class="card card-producto h-100 shadow-sm border-0 overflow-hidden position-relative" data-id="${producto.id}">
                    <div class="position-relative" style="cursor:pointer;" onclick="verDetalle(${producto.id})">
                        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}"
                            style="height: 210px; object-fit: cover;"
                            loading="lazy"
                            onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80'">
                        <div class="position-absolute top-2 start-2 d-flex flex-wrap gap-1">
                            ${badgesSuperiores}
                        </div>
                        <button class="btn-favorito position-absolute top-0 end-0 m-2 rounded-circle border-0 shadow-sm d-flex align-items-center justify-content-center"
                            style="width: 38px; height: 38px; background: rgba(255, 255, 255, 0.92); z-index: 5; cursor: pointer; transition: transform 0.2s ease;"
                            onclick="event.stopPropagation(); toggleFavorito(${producto.id}, this)"
                            title="${esFav ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}">
                            <i class="bi bi-heart${esFav ? '-fill text-danger' : ' text-secondary'}" style="font-size: 18px;"></i>
                        </button>
                    </div>

                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <span class="badge bg-secondary align-self-start mb-2">${producto.categoria}</span>
                            ${stock > 0 ? `<small class="text-success fw-bold"><i class="bi bi-check-circle"></i> ${stock} disp.</small>` : `<small class="text-danger fw-bold"><i class="bi bi-x-circle"></i> Sin stock</small>`}
                        </div>
                        <h5 class="card-title fw-bold mb-1" style="cursor:pointer;min-height:48px;" onclick="verDetalle(${producto.id})" title="${producto.nombre}">
                            ${producto.nombre}
                        </h5>

                        ${coloresHtml ? `<div class="mb-2 small">${coloresHtml}</div>` : ''}

                        <p class="card-text text-muted small mb-2" style="min-height:42px;">
                            ${producto.descripcion ? producto.descripcion.substring(0, 65) + (producto.descripcion.length > 65 ? '...' : '') : ''}
                        </p>

                        <div class="mb-3">
                            ${descuento > 0 ? `
                                <div class="d-flex align-items-baseline gap-2">
                                    <span class="fw-bold text-danger fs-5">$${Number(Math.round(precioConDescuento)).toLocaleString()}</span>                                     <span class="text-muted small text-decoration-line-through">$${Number(producto.precio).toLocaleString()}</span>
                                </div>`
                              : `<span class="fw-bold text-danger fs-5">$${Number(producto.precio).toLocaleString()}</span>`
                            }
                            <span class="text-muted small ms-1">COP</span>
                        </div>

                        <div class="mt-auto d-flex flex-column gap-2">
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-dark btn-sm flex-grow-1 fw-bold" onclick="verDetalle(${producto.id})">
                                    <i class="bi bi-eye me-1"></i> Ver
                                </button>
                                ${esAdmin ? `
                                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto(${producto.id})" title="Eliminar producto">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                            ${botonComprarHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

// ==========================================
// OPERACIONES DEL CARRITO Y COMPRA
// ==========================================

// Función unificada para actualizar el contador del carrito en el navbar
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const total = carrito.reduce((acc, item) => acc + (item.cantidad || 1), 0);
    document.querySelectorAll('#contador-carrito').forEach(el => { el.textContent = total; });
}
window.actualizarContadorCarrito = actualizarContadorCarrito;

// Función para actualizar el modal mini del carrito (en index.html)
function actualizarModalCarritoMini() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const cuerpo = document.getElementById('cuerpo-carrito-tienda');
    const totalSpan = document.getElementById('carrito-total-tienda');
    if (!cuerpo) return;

    if (carrito.length === 0) {
        cuerpo.innerHTML = `<p class="text-muted text-center py-2">El carrito está vacío.</p>`;
        if (totalSpan) totalSpan.innerText = '0';
        return;
    }

    let total = 0;
    let html = '';
    carrito.forEach((p, index) => {
        const subtotal = Number(p.precioUnitario) * (p.cantidad || 1);
        total += subtotal;
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <div class="d-flex align-items-center gap-2">
                    ${p.imagen ? `<img src="${p.imagen}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">` : ''}
                    <div>
                        <h6 class="mb-0 fw-bold" style="font-size:13px;">${p.nombre}</h6>
                        <small class="text-muted">${p.cantidad}x $${Number(p.precioUnitario).toLocaleString()} COP</small>
                        ${p.talla ? `<br><small class="text-secondary">Talla: ${p.talla}</small>` : ''}
                    </div>
                </div>
                <button class="btn btn-outline-danger btn-sm" onclick="quitarDelCarritoMini(${index})"><i class="bi bi-trash"></i></button>
            </div>
        `;
    });
    cuerpo.innerHTML = html;
    if (totalSpan) totalSpan.innerText = total.toLocaleString();
}
window.actualizarModalCarritoMini = actualizarModalCarritoMini;

window.quitarDelCarritoMini = function(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    actualizarModalCarritoMini();
};

function agregarAlCarritoRapido(info) {
    // Usamos la clave 'carrito' para ser consistentes con carrito.html y checkout.html
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const indexExistente = carrito.findIndex(it => it.productoId === info.id && it.talla === info.talla);

    if (indexExistente !== -1) {
        if (carrito[indexExistente].cantidad < info.stock) {
            carrito[indexExistente].cantidad += 1;
        } else {
            if (typeof mostrarToastGlobal === 'function') mostrarToastGlobal(`Sin más stock disponible (talla ${info.talla})`, 'warning');
            return;
        }
    } else {
        carrito.push({
            productoId: info.id,
            nombre: info.nombre,
            precioUnitario: info.precio,
            precio: info.precio,
            talla: info.talla,
            cantidad: 1,
            stock: info.stock,
            imagen: info.imagen
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    actualizarModalCarritoMini();
    if (typeof mostrarToastGlobal === 'function') mostrarToastGlobal(`"${info.nombre}" añadido al carrito 🛒`, 'success');
}
window.agregarAlCarritoRapido = agregarAlCarritoRapido;

window.verDetalle = function(id) {
    window.location.href = `detalle.html?id=${id}`;
};

window.agregarAlCarrito = function(nombre, precio, id) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) ?? [];

    const indexExistente = carrito.findIndex(item => item.productoId === id);
    if (indexExistente >= 0) {
        carrito[indexExistente].cantidad += 1;
    } else {
        carrito.push({
            productoId: id,
            nombre: nombre,
            precioUnitario: precio,
            precio: precio,
            cantidad: 1
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    actualizarModalCarritoMini();
    if (typeof mostrarToastGlobal === 'function') {
        mostrarToastGlobal(`¡"${nombre}" añadido al carrito! 🛒`, 'success');
    }
};

window.agregarConTalla = function(nombre, precio, id) {
    const selectTalla = document.getElementById(`talla-${id}`);
    const tallaSeleccionada = selectTalla ? selectTalla.value : '40';
    const nombreConTalla = `${nombre} (Talla: ${tallaSeleccionada})`;
    window.agregarAlCarrito(nombreConTalla, precio, id);
};

function actualizarContador() {
    actualizarContadorCarrito();
}

window.quitarDelCarrito = function(index) {
    quitarDelCarritoMini(index);
};

function actualizarCarritoModal() {
    actualizarModalCarritoMini();
}

async function finalizarCompra() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    // Verificar si el usuario ha iniciado sesión antes de hacer el pedido
    const usuario = obtenerUsuarioSesion() || window.usuarioActual;
    if (!usuario || (!usuario.email && !usuario.username)) {
        if (confirm("Para realizar tu pedido debes iniciar sesión. ¿Deseas iniciar sesión ahora?")) {
            window.location.href = 'login.html?redirect=checkout.html';
        }
        return;
    }

    window.location.href = 'checkout.html';
}
window.finalizarCompra = finalizarCompra;

// ==========================================
// TOASTS Y NOTIFICACIONES
// ==========================================
window.mostrarToastGlobal = function(mensaje, tipo = 'success', duracionMs = 3200) {
    let contenedor = document.getElementById('toastContainerUrban');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toastContainerUrban';
        contenedor.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(contenedor);
    }
    const colores = {
        success: 'linear-gradient(135deg,#198754,#146c43)',
        danger:  'linear-gradient(135deg,#dc3545,#b02a37)',
        warning: 'linear-gradient(135deg,#ffc107,#cc9a06)',
        info:    'linear-gradient(135deg,#0d6efd,#0a58ca)',
        dark:    'linear-gradient(135deg,#212529,#111)'
    };
    const toast = document.createElement('div');
    toast.style.cssText = `min-width:280px;max-width:380px;padding:14px 18px;border-radius:12px;color:#fff;
        font-weight:600;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);
        background:${colores[tipo] ?? colores.success};pointer-events:auto;
        transform:translateX(420px);transition:transform .35s cubic-bezier(.2,.8,.2,1);display:flex;align-items:center;gap:10px;`;
    toast.innerHTML = `<i class="bi bi-${tipo === 'success' ? 'check-circle-fill' : tipo === 'danger' ? 'exclamation-triangle-fill' : tipo === 'warning' ? 'exclamation-circle-fill' : 'info-circle-fill'}" style="font-size:18px;"></i><span style="flex:1;">${mensaje}</span>`;
    contenedor.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(420px)';
        setTimeout(() => toast.remove(), 400);
    }, duracionMs);
};

function mostrarToast(msg) {
    const el = document.getElementById('toastIndex');
    if (!el) return;
    document.getElementById('toast-mensaje-index').innerText = msg;
    new bootstrap.Toast(el).show();
}

// Guardar nuevo producto en la Base de Datos con múltiples tallas + descuento + destacado
window.guardarNuevoProducto = async function(event) {
    event.preventDefault();

    const tallasSeleccionadas = Array.from(document.querySelectorAll('.check-talla:checked'))
        .map(cb => cb.value);

    if (tallasSeleccionadas.length === 0) {
        if (window.mostrarToastGlobal) {
            window.mostrarToastGlobal('⚠️ Selecciona al menos una talla', 'danger');
        } else {
            alert('Por favor selecciona al menos una talla.');
        }
        return;
    }

    const coloresSeleccionados = Array.from(document.querySelectorAll('.check-color:checked'))
        .map(cb => cb.value)
        .join(', ');

    const val = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };
    const check = (id) => {
        const el = document.getElementById(id);
        return el ? !!el.checked : false;
    };

    const urlImagen = val('nuevoImagen');
    const valorStock = Math.max(0, Number(val('nuevoStock')) || 0);
    const precioBase = Math.max(0, Number(val('nuevoPrecio')) || 0);
    let precioOriginal = Number(val('nuevoPrecioOriginal')) || null;
    const descuento = Math.max(0, Math.min(100, Number(val('nuevoDescuento')) || 0));
    const destacado = check('nuevoDestacado');

    if (!precioOriginal && descuento > 0) precioOriginal = precioBase;
    if (precioOriginal && precioOriginal < precioBase) precioOriginal = precioBase;

    const productoData = {
        nombre: val('nuevoNombre'),
        categoria: val('nuevaCategoria'),
        precio: precioBase,
        precioOriginal: precioOriginal,
        descuento: descuento,
        destacado: destacado,
        descripcion: val('nuevaDescripcion'),
        imagen: urlImagen,
        imagenUrl: urlImagen,
        imagenes: val('nuevasImagenes'),
        tallas: tallasSeleccionadas.join(', '),
        talla: tallasSeleccionadas[0],
        color: coloresSeleccionados.length > 0 ? coloresSeleccionados : 'Estándar',
        stock: valorStock,
        cantidad: valorStock,
        proveedor: val('nuevoProveedor')
    };

    const btn = document.getElementById('btn-guardar-producto');
    const txt = document.getElementById('btn-guardar-texto');
    if (btn) btn.disabled = true;
    if (txt) txt.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    try {
        const respuesta = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(productoData)
        });

        if (respuesta.ok) {
            if (window.mostrarToastGlobal) {
                window.mostrarToastGlobal('🎉 Producto guardado correctamente. Recargando...', 'success');
            } else {
                alert('¡ÉXITO! Producto guardado correctamente.');
            }
            setTimeout(() => location.reload(), 1200);
        } else {
            let msj = 'Error al guardar el producto.';
            try {
                const json = await respuesta.json().catch(() => null);
                if (json) {
                    if (json.message) msj = json.message;
                    else if (json.errors && json.errors.length) msj = json.errors.map(e => e.mensaje || e.msg).join('\n');
                } else {
                    const t = await respuesta.text();
                    if (t) msj = t;
                }
            } catch(e) {}
            if (window.mostrarToastGlobal) {
                window.mostrarToastGlobal('❌ ' + msj, 'danger');
            } else {
                alert('EL SERVIDOR RECHAZÓ EL PRODUCTO:\n' + msj);
            }
        }
    } catch (error) {
        const msg = 'ERROR DE CONEXIÓN: ' + (error.message || 'No se pudo conectar');
        if (window.mostrarToastGlobal) {
            window.mostrarToastGlobal('🌐 ' + msg, 'danger');
        } else {
            alert(msg);
        }
    } finally {
        if (btn) btn.disabled = false;
        if (txt) txt.innerHTML = '<i class="bi bi-save me-2"></i>Guardar en Base de Datos';
    }
};

// Función para eliminar un producto por su ID
window.eliminarProducto = async function(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

    try {
        const respuesta = await fetch('/api/productos/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (respuesta.status === 401) {
            alert("Debes iniciar sesión como administrador para eliminar productos.");
            window.location.href = 'login.html';
            return;
        }

        if (respuesta.ok) {
            alert("¡Producto eliminado correctamente!");
            location.reload(); 
        } else {
            const textoError = await respuesta.text();
            alert("No se pudo eliminar el producto: " + textoError);
        }
    } catch (error) {
        alert("Error de conexión al intentar eliminar: " + error.message);
    }
};

// Exportar Reporte en PDF
window.exportarPDF = async function() {
    try {
        const respuesta = await fetch('/api/productos');
        if (!respuesta.ok) throw new Error('Error al obtener la lista de productos');
        
        const productos = await respuesta.json();

        if (!productos || productos.length === 0) {
            alert("No hay productos registrados para exportar.");
            return;
        }

        // Compatibilidad con distintas versiones CDN de jsPDF
        const jsPDFClass = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFClass) {
            alert("La librería jsPDF no está cargada correctamente.");
            return;
        }

        const doc = new jsPDFClass();

        // Verificar plugin autoTable
        if (typeof doc.autoTable !== 'function') {
            alert("El plugin autoTable de jsPDF no está disponible.");
            return;
        }

        const ahora = new Date();
        const fechaHora = ahora.toLocaleString('es-CO', { 
            dateStyle: 'full', 
            timeStyle: 'medium' 
        });

        const colorPrimario = [33, 37, 41];   
        const colorAcento = [253, 126, 20];    

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text("Urban Steps - Reporte de Inventario", 14, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el: ${fechaHora}`, 14, 27);

        doc.setDrawColor(colorAcento[0], colorAcento[1], colorAcento[2]);
        doc.setLineWidth(0.6);
        doc.line(14, 32, 196, 32);

        const columnas = ["ID", "Nombre", "Categoría", "Precio (COP)", "Stock", "Proveedor"];
        const filas = productos.map(p => [
            p.id || '',
            p.nombre || '',
            p.categoria || '',
            `$ ${Number(p.precio || 0).toLocaleString('es-CO')}`,
            p.stock ?? p.cantidad ?? 0,
            p.proveedor || 'N/A'
        ]);

        doc.autoTable({
            startY: 38,
            head: [columnas],
            body: filas,
            theme: 'grid',
            headStyles: {
                fillColor: colorAcento,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                textColor: [40, 40, 40],
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'center' }
            }
        });

        doc.save(`Inventario_UrbanSteps_${ahora.toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
        console.error("Error al exportar PDF:", error);
        alert("No se pudo generar el reporte en PDF: " + error.message);
    }
};

// Función global para enviar el cambio de contraseña al backend
window.ejecutarCambioPassword = async function(event) {
    event.preventDefault();

    const inputCurrent = document.getElementById('currentPassword');
    const inputNew = document.getElementById('newPassword');

    if (!inputCurrent || !inputNew) return;

    const currentPassword = inputCurrent.value.trim();
    const newPassword = inputNew.value.trim();

    if (!currentPassword || !newPassword) {
        alert("Por favor completa todos los campos de contraseña.");
        return;
    }

    if (newPassword.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
    }

    try {
        const respuesta = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', 
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        if (respuesta.ok) {
            alert("¡Contraseña actualizada correctamente! Redirigiendo para iniciar sesión...");
            
            const modalElement = document.getElementById('modalCambiarPassword');
            if (modalElement && window.bootstrap) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) modalInstance.hide();
            }
            
            const form = document.getElementById('formCambiarPassword');
            if (form) form.reset();

            // Opcional: Redirigir al login si el backend requiere reautenticación
            // window.location.href = '/login.html';
        } else {
            const errorTxt = await respuesta.text();
            alert("Error al cambiar la contraseña: " + errorTxt);
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor para cambiar la contraseña.");
    }
};
// Función auxiliar para agregar al carrito de forma segura por ID
// Función auxiliar para agregar al carrito de forma segura por ID
window.agregarAlCarritoRapidoById = function(id) {
    if (!window.productosGlobal) return;
    const producto = window.productosGlobal.find(p => p.id === id);
    if (!producto) return;

    // Usar tallasDisponibles (campo mapeado en cargarProductos), con fallback a 'Única'
    const tallaDefault = (producto.tallasDisponibles && producto.tallasDisponibles.length > 0)
        ? producto.tallasDisponibles[0]
        : 'Única';
    const precioConDescuento = producto.descuento > 0
        ? Math.round(producto.precio * (1 - producto.descuento / 100))
        : producto.precio;

    agregarAlCarritoRapido({
        id: producto.id,
        nombre: producto.nombre,
        precio: precioConDescuento,
        talla: tallaDefault,
        stock: producto.stock ?? 0,
        imagen: producto.imagen || producto.imagenUrl || ''
    });
};
async function verificarSesion() {
    try {
        const respuesta = await fetch('/api/auth/current', {
            method: 'GET',
            credentials: 'include' // OBLIGATORIO: Envía la cookie JSESSIONID
        });

        if (respuesta.ok) {
            const usuario = await respuesta.json();
            console.log("Sesión detectada exitosamente:", usuario);

            // Normalizar el rol a mayúsculas
            const rol = usuario.rol ? usuario.rol.toUpperCase() : '';
            
            const esAdmin = rol === 'ROLE_ADMIN' || rol === 'ADMIN';
            const esOperario = rol === 'ROLE_OPERARIO' || rol === 'OPERARIO';

            // Asignamos permisos globales de gestión si es Admin u Operario
            window.usuarioEsAdminGlobal = esAdmin || esOperario;
            window.usuarioActual = usuario;

            actualizarInterfazUsuario(usuario, esAdmin, esOperario);
        } else {
            console.log("No hay sesión activa (401 / No autenticado)");
            window.usuarioEsAdminGlobal = false;
            window.usuarioActual = null;
            actualizarInterfazInvitado();
        }
    } catch (error) {
        console.error("Error al verificar sesión:", error);
        window.usuarioEsAdminGlobal = false;
    }
}

function actualizarInterfazUsuario(usuario, esAdmin, esOperario) {
    // 1. Reemplazar el botón de Iniciar Sesión por el dropdown del usuario
    const contenedorExistente = document.getElementById('dropdownUsuarioNav') || document.getElementById('btnLoginNavbar');
    if (contenedorExistente) {
        const nombreMostrar = usuario.nombre || usuario.email || 'Mi Cuenta';
        const inicial = nombreMostrar.charAt(0).toUpperCase();

        contenedorExistente.outerHTML = `
            <div class="dropdown" id="dropdownUsuarioNav">
                <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle"
                        style="width:26px;height:26px;font-size:12px;background:linear-gradient(135deg,#FF5722,#dc2626);">
                        ${inicial}
                    </span>
                    <span class="fw-semibold">${nombreMostrar.split(' ')[0]}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="border-radius:14px;min-width:200px;">
                    <li class="px-3 pt-2 pb-1">
                        <div class="fw-bold" style="font-size:14px;">${nombreMostrar}</div>
                        <div class="text-muted" style="font-size:12px;">${usuario.email || ''}</div>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                        <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="perfil.html">
                            <i class="bi bi-person-circle text-dark"></i>
                            <span>Mi Perfil</span>
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="perfil.html#favoritos">
                            <i class="bi bi-heart-fill text-danger"></i>
                            <span>Mis Favoritos</span>
                        </a>
                    </li>
                    ${(esAdmin || esOperario) ? `
                    <li>
                        <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="pedidos.html">
                            <i class="bi bi-gear text-secondary"></i>
                            <span>Panel Admin</span>
                        </a>
                    </li>` : `
                    <li>
                        <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="pedidos.html">
                            <i class="bi bi-bag-check text-secondary"></i>
                            <span>Mis Pedidos</span>
                        </a>
                    </li>`}
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                        <a class="dropdown-item d-flex align-items-center gap-2 py-2 text-danger fw-semibold" href="#" onclick="cerrarSesion(event)">
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Cerrar Sesión</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;
    }

    // 2. Ocultar botones de Mi Perfil y Cerrar Sesión separados (ya incluidos en el dropdown)
    const btnMiPerfil = document.getElementById('btnMiPerfil');
    if (btnMiPerfil) btnMiPerfil.style.display = 'none';

    const btnCerrarSesion = document.getElementById('btnCerrarSesionNav');
    if (btnCerrarSesion) btnCerrarSesion.style.display = 'none';

    // 3. Mostrar Panel de Administración si es Admin u Operario
    const btnPanelAdmin = document.getElementById('btnPanelAdmin');
    if (btnPanelAdmin) {
        btnPanelAdmin.style.display = (esAdmin || esOperario) ? 'inline-block' : 'none';
    }

    const btnAgregarProducto = document.getElementById('btnAgregarProducto');
    if (btnAgregarProducto) {
        btnAgregarProducto.style.display = (esAdmin || esOperario) ? 'inline-block' : 'none';
    }

    // 4. Recargar catálogo si aplica (para mostrar botones de eliminar admin)
    if (typeof cargarProductosTienda === 'function') {
        cargarProductosTienda();
    }
}

function actualizarInterfazInvitado() {
    const btnPanelAdmin = document.getElementById('btnPanelAdmin');
    if (btnPanelAdmin) btnPanelAdmin.style.display = 'none';

    const btnAgregarProducto = document.getElementById('btnAgregarProducto');
    if (btnAgregarProducto) btnAgregarProducto.style.display = 'none';
}