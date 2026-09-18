function seleccionarMetodo(metodo) {
    alert(`Has seleccionado pagar con ${metodo}. A continuación, procesaremos tu orden.`);
    
    // Aquí puedes redirigir a una pantalla de instrucciones o registrar el pedido en tu Spring Boot
    if (metodo === 'Nequi' || metodo === 'Daviplata') {
        alert("Te enviaremos los datos de la línea o el número de cuenta para confirmar tu transferencia.");
    } else if (metodo === 'PSE' || metodo === 'Bancolombia') {
        alert("Te redirigiremos a la pasarela bancaria seleccionada.");
    }
}
function finalizarCompra(event) {
    event.preventDefault();

    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalCompra = localStorage.getItem('totalCompra') || 0;

    const datosPedido = {
        cliente: document.getElementById('nombre-cliente').value,
        telefono: document.getElementById('telefono-cliente').value,
        direccion: document.getElementById('direccion-cliente').value,
        metodoPago: document.getElementById('metodo-pago').value,
        total: parseFloat(totalCompra),
        productos: carrito // Enviamos los productos para que el backend descuente stock
    };

    fetch('http://localhost:8082/api/pedidos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosPedido)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Pedido registrado y stock actualizado:', data);
        localStorage.removeItem('carrito'); // Limpiamos el carrito
        alert('¡Pedido realizado con éxito! Tu stock se ha actualizado.');
        window.location.href = 'index.html';
    })
    .catch(error => console.error('Error al procesar el pedido:', error));
}
function verificarMetodoPago() {
    const metodoSelect = document.getElementById('metodo-pago').value;
    const contenedorInfo = document.getElementById('info-pago');
    const contenidoDinamico = document.getElementById('contenido-dinamico-pago');

    if (!metodoSelect) {
        contenedorInfo.style.display = 'none';
        return;
    }

    contenedorInfo.style.display = 'block';

    if (metodoSelect === 'Nequi' || metodoSelect === 'Daviplata') {
        contenidoDinamico.innerHTML = `
            <h6 class="text-primary fw-bold mb-2">Pago por ${metodoSelect}</h6>
            <p class="small text-muted mb-2">Transfiere al número de la tienda: <strong>300 123 4567</strong></p>
            <div class="mb-2">
                <label class="form-label small fw-bold">Celular desde el que realizas el pago:</label>
                <input type="text" id="pago-celular" class="form-control form-control-sm" placeholder="Ej: 3109876543">
            </div>
            <div class="mb-0">
                <label class="form-label small fw-bold">Número de Comprobante / Transacción:</label>
                <input type="text" id="pago-comprobante" class="form-control form-control-sm" placeholder="Ej: 987654321">
            </div>
        `;
    } else if (metodoSelect === 'Bancolombia') {
        contenidoDinamico.innerHTML = `
            <h6 class="text-success fw-bold mb-2">Pago por Bancolombia</h6>
            <p class="small text-muted mb-2">Transfiere a la Cuenta de Ahorros <strong>123-456789-00</strong></p>
            <div class="mb-0">
                <label class="form-label small fw-bold">Número de Comprobante / Referencia:</label>
                <input type="text" id="pago-comprobante" class="form-control form-control-sm" placeholder="Ej: CPN-00482">
            </div>
        `;
    } else if (metodoSelect === 'PSE') {
        contenidoDinamico.innerHTML = `
            <h6 class="text-dark fw-bold mb-2">Pago en Línea (PSE / Tarjeta)</h6>
            <p class="small text-muted mb-0">Al hacer clic en finalizar compra, se procesará tu orden de forma segura.</p>
        `;
    }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    alert(mensaje);
}

async function procesarCompra() {
    const nombre = document.getElementById('nombreCliente').value;
    const email = document.getElementById('emailCliente').value;
    const direccion = document.getElementById('direccion').value;
    const ciudad = document.getElementById('ciudad').value;
    const telefono = document.getElementById('telefono').value;
    const metodoPago = document.getElementById('metodo-pago').value;
    const total = parseFloat(localStorage.getItem('totalCompra')) || 0;
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (!nombre || !email || !direccion || !ciudad || !telefono) {
        mostrarNotificacion("Por favor completa todos los datos de envío, incluyendo el correo.", "error");
        return;
    }

    if (!metodoPago) {
        mostrarNotificacion("Por favor selecciona un método de pago.", "error");
        return;
    }

    let datosExtraPago = {};

    if (metodoPago === 'Nequi' || metodoPago === 'Daviplata') {
        const celular = document.getElementById('pago-celular')?.value;
        const comprobante = document.getElementById('pago-comprobante')?.value;

        if (!celular || !comprobante) {
            mostrarNotificacion(`Completa los datos de transferencia de ${metodoPago}.`, "error");
            return;
        }
        datosExtraPago = { celularPagador: celular, comprobante: comprobante };

    } else if (metodoPago === 'Bancolombia') {
        const comprobante = document.getElementById('pago-comprobante')?.value;
        if (!comprobante) {
            mostrarNotificacion('Ingresa el número de comprobante de Bancolombia.', "error");
            return;
        }
        datosExtraPago = { comprobante: comprobante };
    }

    const datosOrden = {
        nombreCliente: nombre,
        emailCliente: email,
        direccion: direccion,
        ciudad: ciudad,
        telefono: telefono,
        total: total,
        metodoPago: metodoPago,
        detallesPago: datosExtraPago,
        productos: carrito,
        estado: "PENDIENTE"
    };

    try {
        const respuesta = await fetch('http://localhost:8082/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosOrden)
        });

        if (!respuesta.ok) {
            throw new Error(`Error en el servidor: ${respuesta.status}`);
        }

        const data = await respuesta.json();

        localStorage.removeItem('carrito');
        localStorage.removeItem('totalCompra');

        // Ocultar formulario de envío y mostrar tarjeta de éxito con opción de cancelación
        const contenedorForm = document.querySelector('.container .row .col-md-7');
        if (contenedorForm) contenedorForm.style.display = 'none';

        document.getElementById('lbl-id-pedido').textContent = data.id;
        document.getElementById('seccion-exito').style.display = 'block';

        document.getElementById('btn-cancelar-orden').onclick = async function() {
            if (!confirm("¿Estás seguro de que deseas cancelar tu pedido y solicitar el reembolso?")) return;

            try {
                const resCancel = await fetch(`http://localhost:8082/api/pedidos/${data.id}/cancelar`, {
                    method: 'PUT'
                });

                if (!resCancel.ok) throw new Error("No se pudo cancelar.");

                alert(`El pedido #${data.id} ha sido cancelado. El reembolso se gestionará a tu medio de pago.`);
                window.location.href = 'index.html';
            } catch (err) {
                alert("Error al cancelar el pedido en el servidor.");
            }
        };

    } catch (error) {
        console.error('Error en el fetch:', error);
        mostrarNotificacion("Error al registrar el pedido en el servidor.", "error");
    }
async function cancelarPedido(id) {
        try {
            const res = await fetch(`http://localhost:8082/api/pedidos/${id}/cancelar`, {
                method: 'PUT'
            });
            if (res.ok) {
                cargarPedidos(); // Actualiza la vista de inmediato de forma silenciosa
            }
        } catch (err) {
            console.error(err);
        }
    }
}
// Validar al intentar pagar / finalizar compra
async function verificarSesionCheckout() {
    try {
        const respuesta = await fetch('http://localhost:8082/api/auth/current', {
            method: 'GET',
            credentials: 'include'
        });

        if (!respuesta.ok) {
            alert("⚠️ Sesión expirada o no iniciada. Debes registrarte o iniciar sesión para completar el pedido.");
            window.location.href = 'login.html';
            return false;
        }

        const usuario = await respuesta.json();
        if (!usuario || !usuario.email) {
            alert("⚠️ Debes iniciar sesión con tu cuenta para completar el pedido.");
            window.location.href = 'login.html';
            return false;
        }
        return true; // Usuario válido
    } catch (error) {
        window.location.href = 'login.html';
        return false;
    }
}

// Ejecutar esta validación justo al hacer clic en el botón de confirmar pago:
document.getElementById('formCheckout')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sesionValida = await verificarSesionCheckout();
    if (!sesionValida) return; // Detiene el pago si no está logueado

    // --- AQUí CONTINÚA TU CÓDIGO NORMAL PARA ENVIAR EL PEDIDO AL BACKEND ---
});