    protectRoute('domiciliario');
    const session = getSession();

    const estadoLabel = document.getElementById("estadoLabel");
    const estadoDesc = document.getElementById("estadoDesc");
    const pedidoUnicoContainer = document.getElementById("pedidoAsignadoUnico");
    const listaHistorial = document.getElementById("listaHistorial");

    // ----------------------------------------------------
    // 1. CARGA CENTRAL
    // ----------------------------------------------------
    function cargarDashboard() {
        const pedidosActivos = getPedidosDomiciliario(session.email);

        // Obtener domiciliario ACTUAL desde la tabla unificada
        const domi = getUsers().find(u =>
            u.role === 'domiciliario' && u.email === session.email
        );

        const historial = domi?.historialEntregas || [];

        actualizarEstadoDomiciliario(pedidosActivos);
        cargarPedidoAsignado(pedidosActivos);
        cargarHistorial(historial);
    }


    // ----------------------------------------------------
    // 2. ESTADO DEL DOMICILIARIO
    // ----------------------------------------------------
    function actualizarEstadoDomiciliario(pedidosActivos) {
        const enRuta  = pedidosActivos.some(p => p.estado === "En Camino");
        const asignado = pedidosActivos.some(p => p.estado === "Asignado");

        if (enRuta) {
            estadoLabel.textContent = "EN RUTA";
            estadoLabel.style.color = "#ff8a00";
            estadoDesc.textContent = "¡Estás entregando el pedido!";
        } else if (asignado) {
            estadoLabel.textContent = "ASIGNADO";
            estadoLabel.style.color = "#ffff00";
            estadoDesc.textContent = "Tienes un pedido asignado, recógelo.";
        } else {
            estadoLabel.textContent = "LIBRE";
            estadoLabel.style.color = "#00ff88";
            estadoDesc.textContent = "Esperando asignación del administrador.";
        }
    }

    // ----------------------------------------------------
    // 3. TARJETA DEL PEDIDO ASIGNADO
    // ----------------------------------------------------
    function cargarPedidoAsignado(pedidosActivos) {
        const pedido = pedidosActivos[0];

        if (!pedido) {
            pedidoUnicoContainer.innerHTML =
                "<p style='color:gray;'>No tienes pedidos activos.</p>";
            return;
        }

        const estado = pedido.estado.toLowerCase();
        let actionButton = '';
        let borderColor = '';

        // ÚNICA ACCIÓN PERMITIDA: MARCAR RECOGIDO (INICIAR RUTA)
        if (estado === "asignado") {
            actionButton = `
                <button class="btn accept-btn" 
                        onclick="marcarRecogidoDomiciliario('${pedido.id}')"
                        style="background:#03a9f4; margin-top:20px; width:100%;">
                    ✅ Recogí el pedido (Iniciar Ruta)
                </button>`;
            borderColor = '#ffff00';
        }

        // Si está "En Camino", NO SE DEBE MOSTRAR ningún botón
        if (estado === "en camino") {
            borderColor = '#ff8a00';
        }

        pedidoUnicoContainer.innerHTML = `
            <div class="card"
                style="margin-top:15px; padding:25px; background:#1a1a1a; 
                        border-radius:10px; border-left:5px solid ${borderColor};">
                
                <h4 style="color:${borderColor}; margin-bottom:10px;">
                    ESTADO: ${pedido.estado.toUpperCase()}
                </h4>

                <p><strong>Recoger:</strong> ${pedido.recoger}</p>
                <p><strong>Entregar:</strong> ${pedido.entregar}</p>
                <p><strong>Descripción:</strong> ${pedido.descripcion}</p>
                <p><strong>Cliente:</strong> ${pedido.cliente}</p>

                ${actionButton}

                ${estado === "en camino" ? 
                    "<p style='color:#ff8a00; margin-top:10px;'>⏳ Esperando que el cliente confirme la entrega.</p>"
                    : ""
                }
            </div>
        `;
    }

    // ----------------------------------------------------
    // 4. MARCAR COMO RECOGIDO (ÚNICA ACCIÓN AUTORIZADA)
    // ----------------------------------------------------
    window.marcarRecogidoDomiciliario = function(id) {
        if (marcarRecogidoPedido(id)) {
            alert("Pedido marcado como RECIBIDO. ¡Buena ruta!");
            cargarDashboard();
        } else {
            alert("Error: No se pudo marcar como recogido.");
        }
    };

    // ----------------------------------------------------
    // 5. HISTORIAL
    // ----------------------------------------------------
    function cargarHistorial(historial) {
        if (historial.length === 0) {
            listaHistorial.innerHTML =
                "<p style='color:gray;'>Aún no tienes pedidos finalizados.</p>";
            return;
        }

        listaHistorial.innerHTML = historial
            .map(p => `
                <div class="card" 
                    style="margin-top:15px; padding:15px; background:#0c1218; 
                            border-radius:10px; border-left:4px solid #00ff88;">
                    <p><strong>ID:</strong> #${p.id.slice(-4)}</p>
                    <p><strong>Entrega:</strong> ${p.entregar}</p>
                    <p style="color:#00ff88;">Entregado por el cliente.</p>
                </div>
            `)
            .join("");
    }


    // ----------------------------------------------------
    // 6. INICIALIZACIÓN
    // ----------------------------------------------------
    cargarDashboard();
    verificarEstado = function () {
        const activos = getPedidosDomiciliario(session.email);
        if (activos.length === 0) cargarDashboard();
    };
