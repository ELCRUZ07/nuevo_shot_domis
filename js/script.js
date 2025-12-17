// Archivo: script.js (VERSIÓN FINAL Y LIMPIA - SOLO FUNCIONES GLOBALES)

// =========================================================================
// CONFIGURACIÓN Y CONSTANTES
// =========================================================================
const ADMIN_EMAIL = 'admin@shotdomis.com';
const ADMIN_PASSWORD = 'superpassword123';
const DASHBOARD_ADMIN = 'dashboard_admin.html';
const DASHBOARD_USUARIO = 'dashboard_usuario.html';
const DASHBOARD_DOMICILIARIO = 'dashboard_domiciliario.html';


// =========================================================================
// CONSTANTES DE ESTADO DE PEDIDOS (FUENTE ÚNICA DE VERDAD)
// =========================================================================
const ESTADOS_PEDIDO = Object.freeze({
    PENDIENTE: "Pendiente",
    APROBADO: "Aprobado",
    ASIGNADO: "Asignado",
    EN_CAMINO: "En Camino",
    FINALIZADO: "Finalizado",
    RECHAZADO: "Rechazado"
});



// =========================================================================
// GENERADOR DE ID ÚNICO (UUID COMPATIBLE)
// =========================================================================
function generarUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



// =========================================================================
// FUNCIONES DE UTILIDAD GENERAL
// =========================================================================

function showMessage(message) {
    alert(message);
}

// ✅ FUNCIÓN DE SESIÓN Y LOGOUT
function getSession() {
    const session = localStorage.getItem('shotdomis_session');
    return session ? JSON.parse(session) : { isLoggedIn: false, role: null, email: null, name: null };
}
window.logout = function() { // Hacemos 'logout' global para el onclick en HTML
    localStorage.removeItem('shotdomis_session');
    window.location.href = "index.html";
}

// ✅ PROTECCIÓN DE RUTAS
function protectRoute(requiredRole) {
    const session = getSession();
    if (!session.isLoggedIn || session.role !== requiredRole) {
        showMessage("Acceso denegado.");
        logout();
    }
}

// =========================================================================
// GESTIÓN DE USUARIOS
// =========================================================================
function getUsers() {
    const users = localStorage.getItem('shotdomis_users');
    return users ? JSON.parse(users) : [];
}
function saveUsers(users) {
    localStorage.setItem('shotdomis_users', JSON.stringify(users));
}
function getUserInfo(email) {
    const users = getUsers();
    return users.find(u => u.email === email);
}

// =========================================================================
// LOGIN Y REGISTRO (MANTENIDO)
// =========================================================================
function handleFormSubmit(form) {
    const isRegistration = form.id === 'registro-form';

    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value.trim();
    let users = getUsers();

    // ADMIN LOGIN
    if (!isRegistration && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('shotdomis_session', JSON.stringify({
            isLoggedIn: true, role: 'admin', email: ADMIN_EMAIL
        }));
        window.location.href = DASHBOARD_ADMIN;
        return;
    }

    // LOGIN NORMAL
    if (!isRegistration) {
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            showMessage("❌ Correo o contraseña incorrectos. Intenta nuevamente.");
            return;
        }
        
        // 🛑 VERIFICACIÓN DE ESTADO PARA DOMICILIARIOS
        if (user.role === 'domiciliario' && user.status !== 'aprobado') {
             let mensaje = "❌ Tu cuenta de domiciliario está ";
             if (user.status === 'pendiente') {
                 mensaje += "pendiente de aprobación por el Administrador. Por favor, espera.";
             } else if (user.status === 'denegado') {
                 mensaje += "denegada. Contacta al soporte.";
             } else {
                  mensaje += "inactiva. Contacta al soporte.";
             }
             showMessage(mensaje);
             return; 
        }

        // Guardar sesión
        localStorage.setItem('shotdomis_session', JSON.stringify({
            isLoggedIn: true,
            role: user.role,
            email: user.email,
            name: user.name
        }));

        showMessage(`✅ ¡Login exitoso! Bienvenido ${user.name}.`);

        // Redirección según rol
        if (user.role === 'domiciliario') {
            window.location.href = DASHBOARD_DOMICILIARIO;
        } else {
            window.location.href = DASHBOARD_USUARIO;
        }
        return;
    }

    // REGISTRO (MANTENIDO)
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const isDomi = window.location.hash === "#domiciliario";

    if (password !== confirmPassword) return showMessage("Las contraseñas no coinciden.");
    if (users.some(u => u.email === email)) return showMessage("Ya existe un usuario con este correo.");
let extraData = {};
if (isDomi) {
    extraData = {
        documento: document.getElementById('documento').value.trim(),
        placa: document.getElementById('placa').value.trim(),
        tipoTransporte: document.getElementById('tipo-transporte').value,
        disponibilidad: document.getElementById('disponibilidad').value,
    };
}

users.push({
    email,
    password,
    name: nombre,
    phone: telefono,
    role: isDomi ? 'domiciliario' : 'cliente',
    status: isDomi ? 'pendiente' : 'aprobado',
    ...extraData
});
saveUsers(users);
showMessage("Registro exitoso.");
window.location.href = "index.html";
}

// =========================================================================
// LISTENERS DE FORMULARIOS (MANTENIDO)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.login-form, #registro-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            handleFormSubmit(e.target);
        });
    });
});


// =========================================================================
// GESTIÓN DE PEDIDOS (MÓDULO CENTRAL CORREGIDO)
// =========================================================================

// --- BASE DE DATOS DE PEDIDOS ---
window.getAllPedidos = function() {
    return JSON.parse(localStorage.getItem('pedidos')) || [];
}
window.savePedidos = function(pedidos) {
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

// --- UTILIDAD DE CLIENTE ---
window.guardarNuevoPedidoCliente = function(nuevoPedido) {
    let pedidos = getAllPedidos();
    
    nuevoPedido.id = generarUUID();
    nuevoPedido.estado = "Pendiente";
    // 🛑 CORRECCIÓN: Usar 'domiciliario' en la creación para la consistencia
    nuevoPedido.domiciliario = null; 
    nuevoPedido.fecha_solicitud = new Date().toISOString(); 

    pedidos.push(nuevoPedido);
    savePedidos(pedidos);
    return true;
}

// --- FILTRADO DE LECTURA (CORREGIDO) ---
window.getPedidosCliente = function(email) {
    const pedidos = getAllPedidos();
    return pedidos.filter(p => p.cliente === email);
}

// 🛑 FUNCIÓN PRINCIPAL DE DOMICILIARIO (PEDIDOS ACTIVOS)
window.getPedidosDomiciliario = function(email) {
    const pedidos = getAllPedidos();
    return pedidos.filter(p => 
        // 🛑 CORRECCIÓN: Usar p.domiciliario
        p.domiciliario === email && 
        p.estado !== "Finalizado" // El domi solo ve lo que no ha sido finalizado
    );
}

// ✅ NUEVA FUNCIÓN: HISTORIAL DEL DOMICILIARIO
window.getHistorialDomiciliario = function(email) {
    const pedidos = getAllPedidos();
    return pedidos.filter(p => 
        p.domiciliario === email && 
        p.estado !== "Finalizado"

    );
}


// --- ACCIONES DE ESTADO (MANTENIDAS CON CORRECCIONES) ---

// La asignación ahora la hace el Admin (o desde un botón, si se decide)
window.asignarPedido = function(id, email) {
    let pedidos = getAllPedidos();
    const index = pedidos.findIndex(p => p.id == id); 

    if (index !== -1 && (pedidos[index].estado === "Pendiente" || pedidos[index].estado === "Aprobado")) {
        // 🛑 CORRECCIÓN: Usar 'domiciliario'
        pedidos[index].domiciliario = email;
        pedidos[index].estado = "Asignado"; 
        savePedidos(pedidos);
        return true;
    }
    return false;
}




// ---------------------------------------------------------
// FUNCIÓN PRINCIPAL: Cambia pedido de "Asignado" → "En Camino"
// ---------------------------------------------------------
window.marcarRecogidoPedido = function(id) {
    let pedidos = getAllPedidos();
    const index = pedidos.findIndex(p => p.id == id);

    if (index !== -1 && pedidos[index].estado === "Asignado") {
        pedidos[index].estado = "En Camino";
        savePedidos(pedidos);
        return true;
    }
    return false;
};


// ---------------------------------------------------------
// FUNCIÓN USADA POR EL BOTÓN DEL DOMICILIARIO
// ---------------------------------------------------------
window.marcarRecogidoDomiciliario = function(idPedido) {
    const ok = window.marcarRecogidoPedido(idPedido);

    if (ok) {
        alert("📦 Pedido recogido. ¡Buen viaje!");
    } else {
        alert("❌ No se puede marcar como recogido. Verifica el estado del pedido.");
    }
};


// ---------------------------------------------------------
// FUNCIÓN: Cliente confirma la entrega → libera al domiciliario
// =====================================================================
// 3. ACCIÓN DEL CLIENTE: CONFIRMAR RECIBIDO
// =====================================================================

window.clienteConfirmaEntrega = function(pedidoId) {
    if (typeof getAllPedidos !== 'function' || typeof savePedidos !== 'function') {
        alert("Error de sistema: No se puede acceder a la base de datos de pedidos.");
        return;
    }

    if (!confirm("¿Estás seguro de que quieres confirmar la recepción de este pedido?")) return;
    
    let pedidos = getAllPedidos();
    const i = pedidos.findIndex(x => x.id == pedidoId);

    if (i === -1 || pedidos[i].estado !== "En Camino") {
        alert("El pedido no está listo para ser marcado como Entregado.");
        return;
    }

    // 1) Marcar como FINALIZADO (coherente con script.js)
    pedidos[i].estado = "Finalizado"; // <- CORRECCIÓN
    savePedidos(pedidos);

    // 2) Guardar entrega en historial DEL CLIENTE en shotdomis_users
try {
    let users = getUsers();
    const emailCliente = pedidos[i].cliente;
    let idxCliente = users.findIndex(u => u.email === emailCliente && u.role === "cliente");

    if (idxCliente !== -1) {
        if (!Array.isArray(users[idxCliente].historialPedidos)) {
            users[idxCliente].historialPedidos = [];
        }

        users[idxCliente].historialPedidos.push({
            ...pedidos[i],
            fecha_finalizado: new Date().toISOString()
        });

        localStorage.setItem("shotdomis_users", JSON.stringify(users));
    }
} catch (e) {
    console.warn("No se pudo actualizar historial del cliente:", e);
}


// 3) Guardar en historial REAL del domiciliario (tabla unificada)
try {
    const domiEmail = pedidos[i].domiciliario;

    let users = getUsers();
    let idxDomi = users.findIndex(u => u.email === domiEmail && u.role === 'domiciliario');

    if (idxDomi !== -1) {

        if (!Array.isArray(users[idxDomi].historialEntregas)) {
            users[idxDomi].historialEntregas = [];
        }

        // Guardar entrega
        users[idxDomi].historialEntregas.push({
            ...pedidos[i],
            fecha_finalizado: new Date().toISOString()
        });

        // Resetear estado
        users[idxDomi].pedidoActual = null;
        users[idxDomi].estado = "libre";

        // Guardar cambios
        localStorage.setItem("shotdomis_users", JSON.stringify(users));
    }

} catch (e) {
    console.warn("No se pudo actualizar historial del domiciliario:", e);
}



    alert("¡Gracias! Pedido marcado como entregado.");
    cargarPedidosCliente();
};


// ---------------------------------------------------------
// ACCIONES DEL ADMINISTRADOR
// ---------------------------------------------------------
window.denegarPedido = function(idPedido) {
    const pedidos = getAllPedidos();
    const index = pedidos.findIndex(p => p.id == idPedido);
    
    if (index !== -1) {
        pedidos[index].estado = "Rechazado";
        savePedidos(pedidos);
        return true;
    }
    return false;
};


window.aprobarPedido = function(idPedido) {
    const pedidos = getAllPedidos();
    const index = pedidos.findIndex(p => p.id == idPedido);

    if (index !== -1) {
        pedidos[index].estado = "Pendiente";
        savePedidos(pedidos);
        return true;
    }
    return false;
};
