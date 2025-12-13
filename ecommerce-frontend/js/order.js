(async function () {
    if (!window.apiClient) return;
    const ordersContainer = document.getElementById("order-results");
    const orderSearch = document.getElementById("order-search");
    const cancelModal = document.getElementById("cancel-modal");
    const cancelForm = document.getElementById("cancel-form");
    const cancelOrderId = document.getElementById("cancel-order-id");
    const cancelReason = document.getElementById("cancel-reason");

    let orders = [];

    async function loadOrders() {
        try {
            orders = await apiClient.listOrders();
        } catch (err) {
            if (ordersContainer) {
                ordersContainer.innerHTML = `<p class="muted">Unable to load orders: ${err.message}</p>`;
            }
        }
    }

    function renderOrders() {
        if (!ordersContainer) return;
        const filter = (orderSearch?.value || "").toLowerCase();
        const list = (orders || []).filter((order) => String(order.id).toLowerCase().includes(filter));
        if (list.length === 0) {
            ordersContainer.innerHTML = `<p class="muted">No orders found. Place an order at checkout to see it here.</p>`;
            return;
        }
        ordersContainer.innerHTML = list
            .map((order) => {
                const cancellationState = order.status === "CANCELLED" ? "Cancelled" : null;
                const disableAction = cancellationState || order.status === "FULFILLED";
                const actionLabel = cancellationState ? "Request submitted" : "Submit cancellation";
                const statusPill = cancellationState
                    ? `<span class="pill pill-accent">Cancellation ${cancellationState.toLowerCase()}</span>`
                    : `<span class="pill">${order.status}</span>`;
                const items = order.items?.map((item) => `${item.product.name} x${item.quantity}`).join("<br>") || "";
                return `
            <article class="order-card">
                <header>
                    <strong>${order.id}</strong>
                    ${statusPill}
                </header>
                <div class="order-items">${items}</div>
                <div class="row"><span>Created</span><strong>${new Date(order.createdAt).toLocaleDateString()}</strong></div>
                <div class="row"><span>Total</span><strong>$${Number(order.total).toFixed(2)}</strong></div>
                <button class="btn ghost" data-id="${order.id}" ${disableAction ? "disabled" : ""}>${actionLabel}</button>
            </article>
        `;
            })
            .join("");
    }

    ordersContainer?.addEventListener("click", async (event) => {
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

    cancelForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const orderId = cancelOrderId.value;
        try {
            await apiClient.cancelOrder(orderId);
            await loadOrders();
            renderOrders();
        } catch (err) {
            alert(`Unable to cancel order: ${err.message}`);
        }
        cancelModal?.classList.remove("show");
        cancelModal?.setAttribute("aria-hidden", "true");
    });

    orderSearch?.addEventListener("input", renderOrders);

    await loadOrders();
    renderOrders();
})();
