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

    if (usuario) {
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

// Función de seguridad en tiempo real para verificar permiso de administrador con Spring Boot
window.verificarAccesoAdmin = async function(event) {
    if (event) event.preventDefault();

    try {
        const respuesta = await fetch('/api/auth/me', {
            credentials: 'include'
        });

        if (!respuesta.ok) {
            alert('Debes iniciar sesión como Administrador para agregar productos.');
            window.location.href = 'login.html';
            return;
        }

        const data = await respuesta.json();

        if (data.rol === 'ADMIN' || data.rol === 'ROLE_ADMIN' || data.esAdmin) {
            window.usuarioEsAdminGlobal = true;
            const modal = document.getElementById('modalAgregarProducto');
            if (modal) {
                modal.style.display = 'block';
            } else {
                console.log('Formulario listo para mostrarse');
            }
        } else {
            alert('Acceso denegado. Esta sección es exclusiva para administradores.');
        }
    } catch (error) {
        alert('Debes iniciar sesión primero.');
        window.location.href = 'login.html';
    }
};

// Función para guardar un nuevo producto desde el formulario Admin
async function guardarNuevoProducto(evento) {
    if (evento) evento.preventDefault();

    const form = document.getElementById('form-producto');
    if (!form) return;

    const nuevoProducto = {
        nombre: document.getElementById('prod-nombre')?.value,
        precio: parseFloat(document.getElementById('prod-precio')?.value ?? 0),
        descripcion: document.getElementById('prod-descripcion')?.value,
        imagen: document.getElementById('prod-imagen')?.value || document.getElementById('prod-imagenUrl')?.value
    };

    try {
        await realizarPeticionSegura('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(nuevoProducto)
        });

        alert('Producto guardado correctamente.');
        form.reset();
        cargarProductos();
    } catch (error) {
        console.error('Error en guardarNuevoProducto:', error.message);
        alert(`No se pudo guardar el producto: ${error.message}`);
    }
}
window.guardarNuevoProducto = guardarNuevoProducto;

// ==========================================
// FILTROS Y ORDENAMIENTO DE PRODUCTOS
// ==========================================
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

    const filtroUpper = (categoriaActualFiltro ?? '').toUpperCase().trim();

    if (filtroUpper !== 'TODOS' && filtroUpper !== 'TODAS' && filtroUpper !== '') {
        listaFiltrada = listaFiltrada.filter(p => {
            const catProducto = (p.categoria ?? '').toUpperCase().trim();
            const catProductoSinS = catProducto.replace(/S$/, '');
            const filtroSinS = filtroUpper.replace(/S$/, '');

            return catProductoSinS === filtroSinS || catProducto.includes(filtroSinS);
        });
    }

    const inputBuscar = document.getElementById('input-buscar-tienda');
    if (inputBuscar && inputBuscar.value.trim() !== '') {
        const texto = inputBuscar.value.toLowerCase();
        listaFiltrada = listaFiltrada.filter(p =>
            (p.nombre?.toLowerCase().includes(texto) ?? false) ||
            (p.descripcion?.toLowerCase().includes(texto) ?? false)
        );
    }

    listaFiltrada = ordenarListaProductos(listaFiltrada);
    renderizarProductos(listaFiltrada);
}

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

        const tallaDefault = (producto.tallasDisponibles?.length > 0)
            ? producto.tallasDisponibles[0] : 'Única';

        html += `
            <div class="col">
                <div class="card card-producto h-100 shadow-sm border-0 overflow-hidden" data-id="${producto.id}">
                    <div class="position-relative" style="cursor:pointer;" onclick="verDetalle(${producto.id})">
                        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}"
                            style="height: 210px; object-fit: cover;"
                            loading="lazy"
                            onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80'">
                        <div class="position-absolute top-2 start-2 d-flex flex-wrap gap-1">
                            ${badgesSuperiores}
                        </div>
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
                            <button class="btn btn-comprar btn-sm w-100 fw-bold py-2 ${agotado ? 'disabled' : ''}"
                                ${agotado ? 'disabled' : ''}
                                onclick='agregarAlCarritoRapido(${JSON.stringify({
                                    id: producto.id,
                                    nombre: producto.nombre,
                                    precio: Math.round(precioConDescuento),
                                    talla: tallaDefault,
                                    stock: stock,
                                    imagen: producto.imagen
                                })})'>
                                ${agotado ? '<i class="bi bi-x-circle me-1"></i> Agotado' : '<i class="bi bi-cart-plus me-1"></i> Añadir al carrito'}
                            </button>
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
function agregarAlCarritoRapido(info) {
    let carrito = JSON.parse(localStorage.getItem('carritoSteps')) || [];

    const indexExistente = carrito.findIndex(it => it.productoId === info.id && it.talla === info.talla);

    if (indexExistente !== -1) {
        if (carrito[indexExistente].cantidad < info.stock) {
            carrito[indexExistente].cantidad += 1;
        } else {
            alert(`No hay más stock disponible para la talla ${info.talla}.`);
            return;
        }
    } else {
        carrito.push({
            productoId: info.id,
            nombre: info.nombre,
            precio: info.precio,
            talla: info.talla,
            cantidad: 1,
            stock: info.stock,
            imagen: info.imagen
        });
    }

    localStorage.setItem('carritoSteps', JSON.stringify(carrito));
    if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
    if (typeof renderizarCarritoModal === 'function') renderizarCarritoModal();
    if (typeof mostrarToastGlobal === 'function') mostrarToastGlobal(`"${info.nombre}" añadido al carrito`, 'success');
}
window.agregarAlCarritoRapido = agregarAlCarritoRapido;

window.verDetalle = function(id) {
    window.location.href = `detalle.html?id=${id}`;
};

window.agregarAlCarrito = async function(nombre, precio, id) {
    try {
        const respuesta = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });

        if (!respuesta.ok) {
            alert('⚠️ ¡Acceso denegado! Debes iniciar sesión como cliente o administrador para añadir productos al carrito.');
            window.location.href = 'login.html';
            return;
        }

        const usuario = await respuesta.json();

        if (!usuario || (!usuario.email && !usuario.username)) {
            alert('⚠️ ¡Debes iniciar sesión para poder comprar y añadir productos al carrito!');
            window.location.href = 'login.html';
            return;
        }

        let carrito = JSON.parse(localStorage.getItem('carrito')) ?? [];

        const indexExistente = carrito.findIndex(item => item.productoId === id);
        if (indexExistente >= 0) {
            carrito[indexExistente].cantidad += 1;
        } else {
            carrito.push({
                productoId: id,
                nombre: nombre,
                precioUnitario: precio,
                cantidad: 1
            });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContador();
        actualizarCarritoModal();
        alert(`¡"${nombre}" añadido al carrito!`);

    } catch (error) {
        console.error('Error al validar sesión:', error);
        alert('⚠️ ¡Debes iniciar sesión para añadir productos al carrito!');
        window.location.href = 'login.html';
    }
};

window.agregarConTalla = function(nombre, precio, id) {
    const selectTalla = document.getElementById(`talla-${id}`);
    const tallaSeleccionada = selectTalla ? selectTalla.value : '40';
    const nombreConTalla = `${nombre} (Talla: ${tallaSeleccionada})`;
    window.agregarAlCarrito(nombreConTalla, precio, id);
};

function actualizarContador() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) ?? [];
    const contador = document.querySelector('#contador-carrito');
    if (contador) contador.textContent = carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

window.quitarDelCarrito = function(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) ?? [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContador();
    actualizarCarritoModal();
};

function actualizarCarritoModal() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) ?? [];
    const cuerpo = document.getElementById('cuerpo-carrito-tienda');
    const totalSpan = document.getElementById('carrito-total-tienda');

    if (!cuerpo) return;
    cuerpo.innerHTML = '';

    if (carrito.length === 0) {
        cuerpo.innerHTML = `<p class="text-muted text-center py-2">El carrito está vacío.</p>`;
        if (totalSpan) totalSpan.innerText = '0';
        return;
    }

    let total = 0;
    carrito.forEach((p, index) => {
        const subtotal = Number(p.precioUnitario) * p.cantidad;
        total += subtotal;
        cuerpo.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <div>
                    <h6 class="mb-0 fw-bold">${p.nombre}</h6>
                    <small class="text-muted">${p.cantidad}x $${Number(p.precioUnitario).toLocaleString()} COP</small>
                </div>
                <button class="btn btn-outline-danger btn-sm" onclick="quitarDelCarrito(${index})"><i class="bi bi-trash"></i></button>
            </div>
        `;
    });
    if (totalSpan) totalSpan.innerText = total.toLocaleString();
}

async function finalizarCompra() {
    const carrito = JSON.parse(localStorage.getItem('carritoSteps')) || [];

    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    const usuario = obtenerUsuarioSesion() || window.usuarioActual || {};
    const totalCompra = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    const nuevoPedido = {
        nombreCliente: usuario.nombre ?? usuario.username ?? 'Cliente Web',
        emailCliente: usuario.email ?? usuario.username ?? 'cliente@urbansteps.com',
        ciudad: 'Ocaña',
        metodoPago: 'Nequi',
        total: totalCompra,
        estado: 'PENDIENTE',
        detalles: carrito.map(item => ({
            productoId: item.productoId,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
            talla: item.talla
        }))
    };

    try {
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(nuevoPedido)
        });

        if (respuesta.ok) {
            alert("¡Pedido realizado con éxito!");
            localStorage.removeItem('carritoSteps');
            if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
            if (typeof renderizarCarritoModal === 'function') renderizarCarritoModal();
        } else {
            const err = await respuesta.text();
            alert("Error al procesar el pedido: " + err);
        }
    } catch (error) {
        console.error("Error al finalizar compra:", error);
        alert("No se pudo conectar con el servidor.");
    }
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
window.agregarAlCarritoRapidoById = function(id) {
    if (!window.productosGlobal) return;
    const producto = window.productosGlobal.find(p => p.id === id);
    if (!producto) return;

    const tallaDefault = (producto.tallas && producto.tallas.length > 0) ? producto.tallas[0] : 'Única';
    const precioConDescuento = producto.descuento ? producto.precio * (1 - producto.descuento / 100) : producto.precio;

    agregarAlCarritoRapido({
        id: producto.id,
        nombre: producto.nombre,
        precio: Math.round(precioConDescuento),
        talla: tallaDefault,
        stock: producto.stock ?? producto.cantidad ?? 0,
        imagen: producto.imagenUrl || producto.imagen || ''
    });
};

// Generación HTML dentro de renderizarProductos (Fragmento del botón)
/* 
Dentro del map/loop de renderizarProductos, reemplaza el HTML del botón de comprar por este:
*/
const botonComprarHTML = `
    <button class="btn btn-comprar btn-sm w-100 fw-bold py-2"
        ${agotado ? 'disabled' : ''} 
        onclick="agregarAlCarritoRapidoById(${producto.id})">
        <i class="bi bi-cart-plus me-1"></i> ${agotado ? 'Agotado' : 'Agregar al carrito'}
    </button>
`;