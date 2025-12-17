// Archivo: dashboard_admin.js
// Panel del Administrador: gestión de domiciliarios, clientes y pedidos.

document.addEventListener('DOMContentLoaded', () => {

    const domiciliariosBody = document.getElementById('domiciliarios-body');
    const clientesBody = document.getElementById('clientes-body');

    if (typeof getUsers === 'undefined' || typeof saveUsers === 'undefined') {
        console.error("Error: getUsers/saveUsers no están disponibles. Asegúrate de que script.js se cargue antes.");
        return;
    }

    function loadUsersTables() {
        const users = getUsers();

        domiciliariosBody.innerHTML = '';
        clientesBody.innerHTML = '';

        const domiciliarios = users.filter(u => u.role === 'domiciliario');
        const clientes = users.filter(u => u.role === 'cliente');

        // Domiciliarios
        if (domiciliarios.length === 0) {
            domiciliariosBody.innerHTML = '<tr><td colspan="6">No hay solicitudes de domiciliarios.</td></tr>';
        } else {
            domiciliarios.forEach(user => {
                const row = domiciliariosBody.insertRow();
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>Doc: ${user.documento || 'N/A'} / Placa: ${user.placa || 'N/A'}</td>
                    <td>${user.status}</td>
                    <td>
                        ${user.status === 'pendiente' ? `
                            <button class="action-btn approve-btn" data-email="${user.email}" data-action="aprobado">Aprobar</button>
                            <button class="action-btn reject-btn" data-email="${user.email}" data-action="rechazado">Rechazar</button>
                        ` : '---'}
                    </td>
                `;
            });
        }

        // Clientes
        if (clientes.length === 0) {
            clientesBody.innerHTML = '<tr><td colspan="4">No hay clientes registrados.</td></tr>';
        } else {
            clientes.forEach(user => {
                const row = clientesBody.insertRow();
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.status}</td>
                `;
            });
        }

        attachActionListeners();
    }

    function attachActionListeners() {
        domiciliariosBody.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const email = event.target.getAttribute('data-email');
                const action = event.target.getAttribute('data-action');
                updateUserStatus(email, action);
            });
        });
    }

    function updateUserStatus(email, status) {
        let users = getUsers();
        const index = users.findIndex(u => u.email === email);

        if (index !== -1) {
            users[index].status = status;
            saveUsers(users);
            alert(`El domiciliario ${email} ha sido ${status.toUpperCase()}.`);
            loadUsersTables();
        }
    }

    loadUsersTables();
    cargarPedidos();
});


// ================= GESTIÓN DE PEDIDOS ================= //

function cargarPedidos() {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    let domiciliarios = getUsers().filter(u => u.role === "domiciliario" && u.status === "aprobado");

    const tbody = document.getElementById('pedidos-body');
    tbody.innerHTML = "";

    pedidos.forEach((pedido, index) => {
        
        // ✅ OBTENER INFO DEL CLIENTE Y DOMICILIARIO
        const cliente = getUserInfo(pedido.cliente);
        const nombreCliente = cliente ? cliente.name : pedido.cliente;
        
        const domi = pedido.domiciliario ? getUserInfo(pedido.domiciliario) : null;
        const nombreDomi = domi ? domi.name : 'Sin asignar';

        let acciones = "";

        switch (pedido.estado) {
            case "Pendiente":
                acciones = `
                    <button class="action-btn approve-btn" onclick="aprobarPedido(${index})">Aprobar</button>
                    <button class="action-btn reject-btn" onclick="rechazarPedido(${index})">Rechazar</button>
                `;
                break;

            case "Aprobado":
                acciones = `
                    <select id="selectDomi${index}">
                        ${domiciliarios.map(d => `<option value="${d.email}">${d.name}</option>`).join('')}
                    </select>
                    <button class="action-btn approve-btn" onclick="asignarDomiciliario(${index})">Asignar</button>
                `;
                break;

            default:
                acciones = `<strong>${pedido.estado}</strong>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${nombreCliente}</strong></td>
            <td>${nombreDomi}</td>
            <td>${pedido.recoger}</td>
            <td>${pedido.entregar}</td>
            <td>${pedido.descripcion}</td>
            <td>${pedido.pago}</td>
            <td><strong>${pedido.estado}</strong></td>
            <td>${acciones}</td>
        `;

        tbody.appendChild(row);
    });
}

function aprobarPedido(index) {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos[index].estado = "Aprobado";
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    cargarPedidos();
}

function rechazarPedido(index) {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos[index].estado = "Rechazado";
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    cargarPedidos();
}

function asignarDomiciliario(index) {
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const select = document.getElementById(`selectDomi${index}`);
    const emailDomi = select.value;

    pedidos[index].domiciliario = emailDomi;
    pedidos[index].estado = "Asignado";

    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    cargarPedidos();
    alert("✅ Pedido asignado correctamente.");
}