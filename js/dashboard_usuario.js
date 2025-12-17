// =====================================================================
// dashboard_usuario.js 
// [FINAL — MISMO CÓDIGO, SOLO ORDENADO Y ESTRUCTURADO]
// =====================================================================

// ----------------------------------------------------
// 1. FUNCIONES AUXILIARES
// ----------------------------------------------------

/**
 * Obtiene la información de un usuario por email.
 * Usa la función getUsers() de script.js.
 */
function getUserInfo(email) {
    if (!email || typeof getUsers !== 'function') return null;

    const standardizedEmail = email.trim().toLowerCase(); 
    const users = getUsers();

    return users.find(u => 
        u.email && u.email.trim().toLowerCase() === standardizedEmail
    );
}

/** Escapa caracteres peligrosos para evitar inyección HTML */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================================
// 2. CARGAR PEDIDOS DEL CLIENTE
// =====================================================================

function cargarPedidosCliente() {
    if (typeof getSession !== 'function' || typeof getPedidosCliente !== 'function') {
        document.getElementById('listaPedidos').innerHTML =
            `<p style="color:red;">Error: El archivo script.js no cargó correctamente.</p>`;
        return;
    }
    
    const session = getSession();
    if (!session.email) return;

    const misPedidos = getPedidosCliente(session.email);
    const contenedor = document.getElementById('listaPedidos');

    // Sin pedidos
    if (misPedidos.length === 0) {
        contenedor.innerHTML = `
            <div class="placeholder-box" style="justify-content: center; text-align: center;">
                <p>Aún no tienes pedidos. Haz tu primer pedido usando el formulario.</p>
            </div>`;
        return;
    }

    // Construcción de tarjetas
    contenedor.innerHTML = misPedidos.map((p, index) => {
        let infoDomiHTML = '';
        let estadoColor = 'gray';

        // ----------------------------
        // Color del estado
        // ----------------------------
        switch(p.estado) {
            case 'Pendiente':
            case 'Aprobado':
                estadoColor = '#ffff00';
                break;
            case 'Asignado':
                estadoColor = 'lightblue';
                break;
            case 'En Camino':
                estadoColor = '#ff8a00';
                break;
            case 'Finalizado':
                estadoColor = '#00ff88';
                break;
            case 'Rechazado':
                estadoColor = 'red';
                break;
            default:
                estadoColor = 'gray';
        }

        // ----------------------------
        // Info del domiciliario
        // ----------------------------
        if (p.domiciliario) { 
            const domi = getUserInfo(p.domiciliario);
            let placaHTML = '';

            if (domi && domi.name && domi.phone) {

                if (domi.placa) {
                    placaHTML = `
                        <p>🏍️ <strong>Placa:</strong> 
                            <span style="background:#2b3340; color:#fff; padding:2px 6px; border-radius:4px; font-weight:800;">
                                ${escapeHtml(domi.placa.toUpperCase())}
                            </span>
                        </p>`;
                }
                
                infoDomiHTML = `
                    <div class="info-domi" style="margin-top:15px; padding:10px; border-radius:6px; border:1px solid #444; background:#0c1116;">
                        <p>👤 <strong>Domiciliario Asignado:</strong> ${escapeHtml(domi.name)}</p>
                        ${placaHTML}
                        <p>📞 <strong>Teléfono:</strong> 
                            <a href="tel:${escapeHtml(domi.phone)}" style="color:#00b894; font-weight:bold;">
                                ${escapeHtml(domi.phone)}
                            </a>
                        </p>
                    </div>`;
            } else {
                infoDomiHTML = `
                    <div class="info-domi" style="background:#402f1a; border:1px dashed #ffc300; color:#ffc300; margin-top:15px; padding:10px; border-radius:6px;">
                        <p><strong>Domiciliario Asignado (Email):</strong> ${escapeHtml(p.domiciliario)}</p>
                        <p>⚠️ Datos de contacto no encontrados.</p>
                    </div>`;
            }
        }

        // ----------------------------
        // Tarjeta HTML del pedido
        // ----------------------------
        return `
            <div class="pedido-card card" style="border-left:3px solid ${estadoColor};">
                <details>
                    <summary style="cursor:pointer; font-weight:600; padding:5px 0;">
                        Pedido #${index + 1}: Recoge en ${escapeHtml(p.recoger)}
                        <span style="color:${estadoColor}; float:right;">(${p.estado})</span>
                    </summary>

                    <div style="padding-top:10px; border-top:1px solid #333; margin-top:10px;">
                        <p><strong>Entregar en:</strong> ${escapeHtml(p.entregar)}</p>
                        <p><strong>Descripción:</strong> ${escapeHtml(p.descripcion)}</p>
                        <p><strong>Pago:</strong> ${p.pago || 'Pago al recibir'}</p>
                        <p class="small">Solicitado el: ${new Date(p.fecha_solicitud).toLocaleString()}</p>


                        
                        

                        ${infoDomiHTML}

                        ${p.estado === "En Camino" ? 
                            `<button class="btn delivered-btn"
                                onclick="clienteConfirmaEntrega('${p.id}')"
                                style="margin-top:15px; background:#00b894; color:#032016; font-weight:700; border:none; padding:10px; border-radius:8px;">
                                    Confirmar Pedido Recibido
                            </button>` 
                        : ""}
                    </div>
                </details>
            </div>`;
    }).join("");
}




// =====================================================================
// 4. INICIALIZACIÓN AL CARGAR LA PÁGINA
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (typeof protectRoute === 'function') {
        protectRoute('cliente');
    }
    
    cargarPedidosCliente();
    
    if (typeof getSession === 'function') {
        const session = getSession();
        if (session.name) {
            const nameElement = document.getElementById('user-name');
            if (nameElement) {
                nameElement.textContent = `Hola, ${session.name}`;
            }
        }
    }
});


// =====================================================================
// 5. GUARDAR NUEVO PEDIDO DEL CLIENTE
// =====================================================================

const formPedido = document.getElementById('formPedido');

if (formPedido) {
    formPedido.addEventListener('submit', function (e) {
        e.preventDefault();

        const recoger = document.getElementById('recoger').value.trim();
        const entregar = document.getElementById('entregar').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();

        if (!recoger || !entregar || !descripcion) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        const nuevoPedido = {
            recoger,
            entregar,
            descripcion,
            contactoRecoger: document.getElementById('contactoRecoger').value.trim(),
            contactoEntregar: document.getElementById('contactoEntregar').value.trim(),
            pago: document.getElementById('pago').value,
            cliente: getSession().email,
            estado: "Pendiente"
        };

        if (typeof guardarNuevoPedidoCliente === 'function') {
            guardarNuevoPedidoCliente(nuevoPedido);
            alert("¡Pedido creado con éxito!");
            formPedido.reset();
            cargarPedidosCliente();
        } else {
            alert("Error: No se puede guardar el pedido.");
        }
    });
}

