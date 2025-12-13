(function () {
    if (!window.DataStore) return;
    const ordersContainer = document.getElementById("order-results");
    const orderSearch = document.getElementById("order-search");
    const cancelModal = document.getElementById("cancel-modal");
    const cancelForm = document.getElementById("cancel-form");
    const cancelOrderId = document.getElementById("cancel-order-id");
    const cancelReason = document.getElementById("cancel-reason");

    function renderOrders() {
        if (!ordersContainer) return;
        const orders = DataStore.loadOrders();
        const filter = (orderSearch?.value || "").toLowerCase();
        const list = orders.filter((order) => order.id.toLowerCase().includes(filter));
        if (list.length === 0) {
            ordersContainer.innerHTML = `<p class="muted">No orders found. Place an order at checkout to see it here.</p>`;
            return;
        }
        ordersContainer.innerHTML = list
            .map((order) => {
                const cancellationState = order.cancellationRequest?.status;
                const disableAction = cancellationState === "Requested" || order.status === "Cancelled";
                const actionLabel = cancellationState === "Requested" ? "Request submitted" : "Submit cancellation";
                const statusPill = cancellationState
                    ? `<span class="pill pill-accent">Cancellation ${cancellationState.toLowerCase()}</span>`
                    : `<span class="pill">${order.status}</span>`;
                return `
            <article class="order-card">
                <header>
                    <strong>${order.id}</strong>
                    ${statusPill}
                </header>
                <div class="order-items">${order.items
                    .map((item) => `${item.name} (${item.variation} • ${item.size}) x${item.qty}`)
                    .join("<br>")}</div>
                <div class="row"><span>ETA</span><strong>${order.eta}</strong></div>
                <div class="row"><span>Total</span><strong>$${order.total.toFixed(2)}</strong></div>
                <button class="btn ghost" data-id="${order.id}" ${disableAction ? "disabled" : ""}>${actionLabel}</button>
            </article>
        `;
            })
            .join("");
    }

    ordersContainer?.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.dataset.id) {
            cancelOrderId.value = target.dataset.id;
            cancelReason.value = "";
            cancelModal?.classList.add("show");
            cancelModal?.setAttribute("aria-hidden", "false");
        }
    });

    cancelModal?.addEventListener("click", (event) => {
        if (event.target === cancelModal || (event.target instanceof HTMLElement && event.target.dataset.closeModal !== undefined)) {
            cancelModal.classList.remove("show");
            cancelModal.setAttribute("aria-hidden", "true");
        }
    });

    cancelForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const orderId = cancelOrderId.value;
        const reason = cancelReason.value.trim();
        const orders = DataStore.loadOrders();
        const order = orders.find((o) => o.id === orderId);
        if (order) {
            order.cancellationRequest = {
                status: "Requested",
                reason,
                submittedAt: new Date().toISOString(),
            };
            DataStore.saveOrders(orders);
            renderOrders();
        }
        cancelModal?.classList.remove("show");
        cancelModal?.setAttribute("aria-hidden", "true");
    });

    orderSearch?.addEventListener("input", renderOrders);
    renderOrders();
})();
