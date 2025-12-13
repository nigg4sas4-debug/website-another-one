(function () {
    if (!window.DataStore) return;
    const ordersContainer = document.getElementById("order-results");
    const orderSearch = document.getElementById("order-search");

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
            .map(
                (order) => `
            <article class="order-card">
                <header>
                    <strong>${order.id}</strong>
                    <span class="pill">${order.status}</span>
                </header>
                <div class="order-items">${order.items
                    .map((item) => `${item.name} (${item.variation} • ${item.size}) x${item.qty}`)
                    .join("<br>")}</div>
                <div class="row"><span>ETA</span><strong>${order.eta}</strong></div>
                <div class="row"><span>Total</span><strong>$${order.total.toFixed(2)}</strong></div>
                <button class="btn ghost" data-id="${order.id}" ${order.status === "Cancelled" ? "disabled" : ""}>Cancel order</button>
            </article>
        `
            )
            .join("");
    }

    ordersContainer?.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement && target.dataset.id) {
            const orders = DataStore.loadOrders();
            const order = orders.find((o) => o.id === target.dataset.id);
            if (order && order.status !== "Cancelled") {
                order.status = "Cancelled";
                DataStore.saveOrders(orders);
                renderOrders();
            }
        }
    });

    orderSearch?.addEventListener("input", renderOrders);
    renderOrders();
})();
